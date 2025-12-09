// backend/engine/commandEngine.js
const FileNode = require('../models/FileNode');
const Session = require('../models/Session');
const { basename, joinPath, modeToString } = require('./helper');

// list of allowed commands
const SUPPORTED = new Set([
  'ls','ls -a','ls -l','cd','pwd','cat','less','find',
  'tar -xvzf','ps','ps aux','ps -ef','kill','kill -9','chmod','chmod +x'
]);

// ---------- PATH NORMALIZATION ----------
function normalizePath(p) {
  if (!p) return p;
  p = p.toString();
  p = p.replace(/\/+/g, '/'); // collapse multiple slashes
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1); // strip trailing slash except root
  return p;
}

// getNode uses normalized path
async function getNode(path) {
  const np = normalizePath(path);
  return await FileNode.findOne({ path: np });
}

async function listDir(path, showHidden=false) {
  const np = normalizePath(path);
  const node = await getNode(np);
  if (!node) throw { code: 404, msg: 'No such directory' };
  if (node.type !== 'dir') throw { code: 400, msg: 'Not a directory' };
  const childPaths = node.children.map(n => normalizePath(np + '/' + n));
  const children = await FileNode.find({ path: { $in: childPaths }});
  const filtered = children.filter(c => (showHidden ? true : !c.hidden));
  return filtered.map(c => ({ name: c.name || basename(c.path), type: c.type, mode: c.mode, hidden: c.hidden }));
}

async function catFile(path) {
  const node = await getNode(path);
  if (!node) throw { code: 404, msg: 'No such file' };
  if (node.type !== 'file') throw { code: 400, msg: 'Is a directory' };
  return node.content;
}

// tar extractor: archive content is stored as JSON string (as in seed)
async function tarExtract(archivePath) {
  const archive = await getNode(archivePath);
  if (!archive) throw { code: 404, msg: 'Archive not found' };
  if (archive.type !== 'file') throw { code: 400, msg: 'Not an archive file' };
  let listing;
  try { listing = JSON.parse(archive.content); } catch(e){ throw { code: 400, msg: 'Invalid archive format' }; }
  const created = [];
  const baseDir = archivePath.replace(/\/[^\/]+$/, '');
  for (const item of listing) {
    const destPath = normalizePath(baseDir + '/' + item.path);
    const existing = await FileNode.findOne({ path: destPath });
    if (!existing) {
      const node = new FileNode({ path: destPath, name: item.path.split('/').pop(), type: 'file', content: item.content, hidden: item.hidden || false, mode: item.mode || '0644' });
      await node.save();
      // ensure parent children updated
      const parentPath = normalizePath(destPath.split('/').slice(0,-1).join('/') || '/');
      const parentNode = await FileNode.findOne({ path: parentPath });
      if (parentNode && !parentNode.children.includes(node.name)) {
        parentNode.children.push(node.name);
        await parentNode.save();
      }
      created.push(destPath);
    }
  }
  return created;
}

// find by name anywhere (simple)
async function findByName(name) {
  const regex = new RegExp(name.replace(/\./g,'\\.'), 'i');
  const nodes = await FileNode.find({ path: { $regex: regex }});
  return nodes.map(n=>n.path);
}

// ps simulation: realistic list for Round-2 (PID 1399 is the suspicious one)
function psAuxSample() {
  return `USER       PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root       842  0.3  0.2  41000  3200 ?        S    17:22   0:05 /usr/lib/systemd/systemd-journald
root      1120  1.1  0.4  50200  6000 ?        S    17:23   0:14 /usr/bin/audit-agent --monitor
root      1278  0.0  0.1  35500  2100 ?        S    17:24   0:00 /usr/bin/metricsd
root      1399 18.7  0.7  60200  9500 ?        R    17:24   3:10 /usr/local/bin/fs-replayd --scan /system/root
root      1420  0.5  0.1  37000  2200 ?        S    17:25   0:03 /usr/sbin/dbus-daemon
root      1501  0.0  0.0  12000   900 ?        S    17:26   0:00 /usr/bin/anomaly-collector --passive
root      1603  0.0  0.0  11000   800 ?        S    17:26   0:00 /sbin/init
`;
}

// ---------- ROUND 2 INJECTION HELPERS ----------
async function ensureDirWithParent(path, name) {
  const np = normalizePath(path);
  let node = await FileNode.findOne({ path: np });
  if (!node) {
    node = new FileNode({ path: np, name, type: 'dir', children: [] });
    await node.save();
  }
  // update parent's children
  const parentPath = normalizePath(np.split('/').slice(0, -1).join('/') || '/');
  if (parentPath && parentPath !== np) {
    const parent = await FileNode.findOne({ path: parentPath });
    if (parent && !parent.children.includes(name)) {
      parent.children.push(name);
      await parent.save();
    }
  }
  return node;
}

async function ensureFile(path, name, opts = {}) {
  const np = normalizePath(path);
  let node = await FileNode.findOne({ path: np });
  if (!node) {
    node = new FileNode(Object.assign({ path: np, name, type: 'file', content: opts.content || '', hidden: opts.hidden || false, mode: opts.mode || '0644' }, opts.extra || {}));
    await node.save();
  } else {
    // merge minimal fields if provided
    let changed = false;
    if (opts.content && node.content !== opts.content) { node.content = opts.content; changed = true; }
    if (typeof opts.hidden === 'boolean' && node.hidden !== opts.hidden) { node.hidden = opts.hidden; changed = true; }
    if (opts.mode && node.mode !== opts.mode) { node.mode = opts.mode; changed = true; }
    if (changed) await node.save();
  }
  // ensure parent lists this file in children
  const parentPath = normalizePath(np.split('/').slice(0, -1).join('/') || '/');
  const parent = await FileNode.findOne({ path: parentPath });
  if (parent && !parent.children.includes(name)) {
    parent.children.push(name);
    await parent.save();
  }
  return node;
}

async function injectRound2Files() {
  // idempotent injection of key Round-2 files
  console.log('[GAME] injectRound2Files: starting');
  await ensureDirWithParent('/system/root/var', 'var');
  await ensureDirWithParent('/system/root/var/log', 'log');
  await ensureDirWithParent('/system/root/tmp', 'tmp');

  await ensureFile('/system/root/var/log/fswatch.log', 'fswatch.log', {
    content:
`2025-11-30 17:23:02 [WARN] excessive read activity in /system/root by PID 1399
2025-11-30 17:23:03 [INFO] watcher: unindexed executable at /usr/local/bin/fs-replayd
2025-11-30 17:23:05 [WARN] unexpected access to /tmp/.cache_replay
`
  });

  await ensureFile('/system/root/tmp/.cache_replay', '.cache_replay', {
    content: "last_writer_pid=1399\naccess_count=154\n",
    hidden: true
  });

  // also create usr/local/bin and clean-replay (non-executable by default)
  await ensureDirWithParent('/system/root/usr', 'usr');
  await ensureDirWithParent('/system/root/usr/local', 'local');
  await ensureDirWithParent('/system/root/usr/local/bin', 'bin');

  await ensureFile('/system/root/usr/local/bin/fs-replayd', 'fs-replayd', {
    content: "#!/bin/sh\n# placeholder fs-replayd\n# usage: fs-replayd --scan /system/root\n",
    mode: '0755'
  });

  await ensureFile('/system/root/usr/local/bin/clean-replay.sh', 'clean-replay.sh', {
    content: "#!/bin/bash\n# clean-replay - simulated cleanup\necho \"[clean-replay] clearing replay buffers\"\necho \"[clean-replay] removing /tmp/.cache_replay\"\necho \"[clean-replay] stopping residual scan tasks\"\n",
    mode: '0644'
  });

  // ensure /etc/replayd.conf exists
  await ensureDirWithParent('/system/root/etc', 'etc');
  await ensureFile('/system/root/etc/replayd.conf', 'replayd.conf', {
    content: "# replayd config (unregistered)\nwatch_mode=full\npriority=high\n"
  });

  console.log('[GAME] injectRound2Files: completed');
}

// ---------- COMMAND EXECUTION ----------
async function runCommand(rawCmd, sessionId) {
  const session = await Session.findById(sessionId);
  if (!session) throw new Error('No session');

  // update score: every command executed is -1
  session.score = (session.score || 0) - 1;

  // normalize and sanitize command string
  rawCmd = (rawCmd || '').toString().trim();

  // normalizations for common user variations
  const NORMALIZATIONS = [
    [/\btar[-\s]*xvzf\b/i, 'tar -xvzf'],
    [/\bls[-\s]*-a\b/i, 'ls -a'],
    [/\bls[-\s]*-l\b/i, 'ls -l'],
    [/\bps[-\s]*aux\b/i, 'ps aux'],
    [/\bps[-\s]*-ef\b/i, 'ps -ef'],
    [/\bkill[-\s]*-9\b/i, 'kill -9'],
    [/\bchmod[-\s]*\+x\b/i, 'chmod +x']
  ];
  for (const [re, repl] of NORMALIZATIONS) rawCmd = rawCmd.replace(re, repl);
  rawCmd = rawCmd.replace(/\s+/g, ' ').trim();

  if (!rawCmd) {
    await session.save();
    return { output: '', session };
  }

  // special: execute local scripts like ./script.sh
  const execLocalMatch = rawCmd.match(/^\.(\/[^\s]+)(?:\s+.*)?$/);
  if (execLocalMatch) {
    const scriptRel = execLocalMatch[1]; // like ./clean-replay.sh
    const scriptPath = scriptRel.startsWith('/') ? scriptRel : normalizePath(session.cwd + '/' + scriptRel.slice(1));
    const node = await FileNode.findOne({ path: scriptPath });
    if (!node) {
      const out = `${rawCmd.split(' ')[0]}: command not found`;
      session.history.push({ command: rawCmd, output: out, ts: new Date() });
      await session.save();
      return { output: out, session };
    }
    // require executable permission (simulate by mode '0755')
    if (node.mode !== '0755') {
      const out = `bash: ${scriptPath}: Permission denied`;
      session.history.push({ command: rawCmd, output: out, ts: new Date() });
      await session.save();
      return { output: out, session };
    }
    // simulate script output
    const out = node.content;
    session.history.push({ command: rawCmd, output: out, ts: new Date() });

    // special-case cleanup script behaviour
    if (scriptPath.endsWith('/clean-replay.sh')) {
      session.score += 50;
      session.history.push({ command: '[CLEANUP]', output: 'Cleanup completed. Services restore queued.', ts: new Date() });
      session.phase = 'round2_ready';
    }
    await session.save();
    return { output: out, session };
  }

  // parse redirection combine 'cat a b > out'
  const redirectMatch = rawCmd.match(/^cat\s+(.+?)\s*>\s*(\S+)$/);
  if (redirectMatch) {
    const left = redirectMatch[1].trim();
    const outPathRaw = redirectMatch[2].trim();
    const parts = left.split(/\s+/);
    const resolved = parts.map(p => p.startsWith('/') ? normalizePath(p) : normalizePath(session.cwd + '/' + p));
    let allExist = true;
    const contents = [];
    for (const p of resolved) {
      const node = await FileNode.findOne({ path: p });
      if (!node || node.type !== 'file') { allExist = false; break; }
      contents.push(node.content);
    }
    const combined = contents.join('\n');
    const has1 = combined.includes('MK-9A2') || combined.includes('FRAG-ID: 0001');
    const has2 = combined.includes('QX-4B7') || combined.includes('FRAG-ID: 0002');
    const has3 = combined.includes('ZK-5C1') || combined.includes('FRAG-ID: 0003');
    if (!allExist) {
      session.history.push({ command: rawCmd, output: `bash: ${outPathRaw}: No such file or directory`, ts: new Date() });
      await session.save();
      return { output: `bash: ${outPathRaw}: No such file or directory`, session };
    }
    if (!(has1 && has2 && has3)) {
      session.history.push({ command: rawCmd, output: `Error: fragments incomplete. Reassembly failed.`, ts: new Date() });
      await session.save();
      return { output: `Error: fragments incomplete. Reassembly failed.`, session };
    }
    const outPath = outPathRaw.startsWith('/') ? normalizePath(outPathRaw) : normalizePath(session.cwd + '/' + outPathRaw);
    let outNode = await FileNode.findOne({ path: outPath });
    const createdNow = !outNode;
    if (!outNode) {
      outNode = new FileNode({ path: outPath, name: outPath.split('/').pop(), type: 'file', content: combined });
      await outNode.save();
      // update parent children
      const parentPath = normalizePath(outPath.split('/').slice(0,-1).join('/') || '/');
      const parent = await FileNode.findOne({ path: parentPath });
      if (parent && !parent.children.includes(outNode.name)) {
        parent.children.push(outNode.name);
        await parent.save();
      }
    } else {
      outNode.content = combined;
      await outNode.save();
    }

    // success message + round completion & postfs messages
    const fragmentsUsed = [
      has1 ? 'MK-9A2' : null,
      has2 ? 'QX-4B7' : null,
      has3 ? 'ZK-5C1' : null
    ].filter(Boolean).join(', ');
    let awarded = 0;
    if (!session.roundCompleted) {
      session.score += 100;
      session.roundCompleted = true;

      console.log('[GAME] Round 1 completed for session', session._id, '- injecting Round-2 files');
      try {
        await injectRound2Files();
        console.log('[GAME] injectRound2Files succeeded for session', session._id);
      } catch (e) {
        console.error('[GAME] injectRound2Files ERROR', e);
      }

      awarded = 100;

      // push subtle system logs to history (no natural-language instructions)
      const sysMsgs = [
        '[SYS] File System Module restored.',
        '[SYS] watcher: anomaly detected. Inspect logs under /var/log.',
        '[SYS] resource spike noted; consider inspecting process activity (ps aux).'
      ];
      for (const m of sysMsgs) session.history.push({ command: '[SYSTEM]', output: m, ts: new Date() });
      session.phase = 'postfs';
    }

    const outputMsg = [
      `[SUCCESS] All fragments combined.`,
      `Created: ${outPath}`,
      `Fragments: ${fragmentsUsed}`,
      awarded ? `Points awarded: +${awarded}` : `No points awarded`
    ].join(' ');

    session.history.push({ command: rawCmd, output: outputMsg, ts: new Date() });
    await session.save();
    return { output: outputMsg, session, meta: { createdPath: outPath, fragmentsUsed: fragmentsUsed.split(',').map(s => s.trim()).filter(Boolean), pointsAwarded: awarded, createdNow } };
  }

  // other commands: parse command name and args
  const tokens = rawCmd.split(/\s+/);
  const cmd = tokens[0];
  const args = tokens.slice(1);

  // fallback: unsupported command key detection
  const cmdKey = (() => {
    if (rawCmd.startsWith('ls -l')) return 'ls -l';
    if (rawCmd.startsWith('ls -a')) return 'ls -a';
    if (rawCmd.startsWith('tar -xvzf')) return 'tar -xvzf';
    if (rawCmd.startsWith('kill -9')) return 'kill -9';
    if (rawCmd.startsWith('chmod +x')) return 'chmod +x';
    return cmd;
  })();

  if (!SUPPORTED.has(cmdKey)) {
    const out = `bash: ${cmd}: command not found`;
    session.history.push({ command: rawCmd, output: out, ts: new Date() });
    await session.save();
    return { output: out, session };
  }

  try {
    switch (cmdKey) {
      case 'pwd': {
        session.history.push({ command: rawCmd, output: session.cwd, ts: new Date() });
        await session.save();
        return { output: session.cwd, session };
      }
      case 'ls': case 'ls -a': {
        const showHidden = (cmdKey === 'ls -a') || args.includes('-a');
        const target = args.find(a => !a.startsWith('-')) || session.cwd;
        const path = target.startsWith('/') ? normalizePath(target) : normalizePath(session.cwd + '/' + target);
        const list = await listDir(path, showHidden);
        const out = list.map(i => i.name + (i.type === 'dir' ? '/' : '')).join('    ');
        session.history.push({ command: rawCmd, output: out, ts: new Date() });
        await session.save();
        return { output: out, session };
      }
      case 'ls -l': {
        const target = args[0] ? (args[0].startsWith('/') ? normalizePath(args[0]) : normalizePath(session.cwd + '/' + args[0])) : session.cwd;
        const list = await listDir(target, true);
        const out = list.map(i => `${modeToString(i.mode,i.type)} 1 root root  ${i.name}`).join('\n');
        session.history.push({ command: rawCmd, output: out, ts: new Date() });
        await session.save();
        return { output: out, session };
      }
      case 'cd': {
        const target = args[0] ? (args[0].startsWith('/') ? normalizePath(args[0]) : joinPath(session.cwd, args[0])) : '/system/root';
        const node = await getNode(target);
        if (!node || node.type !== 'dir') {
          const out = `bash: cd: ${args[0] || ''}: No such file or directory`;
          session.history.push({ command: rawCmd, output: out, ts: new Date() });
          await session.save();
          return { output: out, session };
        }
        session.cwd = normalizePath(target);
        session.history.push({ command: rawCmd, output: '', ts: new Date() });
        await session.save();
        return { output: '', session };
      }
      case 'cat': {
        const targets = args.length ? args.map(a => a.startsWith('/') ? normalizePath(a) : normalizePath(session.cwd + '/' + a)) : [];
        if (targets.length === 0) {
          const out = 'cat: missing operand';
          session.history.push({ command: rawCmd, output: out, ts: new Date() });
          await session.save();
          return { output: out, session };
        }
        let combined = '';
        for (const t of targets) {
          const node = await getNode(t);
          if (!node) {
            const out = `cat: ${t}: No such file or directory`;
            session.history.push({ command: rawCmd, output: out, ts: new Date() });
            await session.save();
            return { output: out, session };
          }
          if (node.type !== 'file') {
            const out = `cat: ${t}: Is a directory`;
            session.history.push({ command: rawCmd, output: out, ts: new Date() });
            await session.save();
            return { output: out, session };
          }
          combined += node.content + '\n';
          if (node.content.includes('MK-9A2') && !session.foundFragments.includes('MK-9A2')) session.foundFragments.push('MK-9A2');
          if (node.content.includes('QX-4B7') && !session.foundFragments.includes('QX-4B7')) session.foundFragments.push('QX-4B7');
          if (node.content.includes('ZK-5C1') && !session.foundFragments.includes('ZK-5C1')) session.foundFragments.push('ZK-5C1');
        }
        await session.save();
        session.history.push({ command: rawCmd, output: combined.trim(), ts: new Date() });
        return { output: combined.trim(), session };
      }
      case 'less': {
        const t = args[0] ? (args[0].startsWith('/') ? normalizePath(args[0]) : normalizePath(session.cwd + '/' + args[0])) : null;
        if (!t) {
          const out = 'less: missing operand';
          session.history.push({ command: rawCmd, output: out, ts: new Date() });
          await session.save();
          return { output: out, session };
        }
        const node = await getNode(t);
        if (!node) { const out = `less: ${t}: No such file`; session.history.push({ command: rawCmd, output: out, ts: new Date()}); await session.save(); return { output: out, session }; }
        if (node.type !== 'file') { const out = `less: ${t}: Is a directory`; session.history.push({ command: rawCmd, output: out, ts: new Date()}); await session.save(); return { output: out, session }; }
        session.history.push({ command: rawCmd, output: node.content, ts: new Date()});
        await session.save();
        return { output: node.content, session };
      }
      case 'find': {
        const idx = args.indexOf('-name');
        let pattern = args[ idx + 1 ] || args[0];
        if (!pattern) {
          const out='find: missing name';
          session.history.push({command:rawCmd, output:out, ts:new Date()});
          await session.save();
          return { output: out, session };
        }
        const results = await findByName(pattern);
        const out = results.join('\n') || 'No results';
        session.history.push({ command: rawCmd, output: out, ts: new Date() });
        await session.save();
        return { output: out, session };
      }
      case 'tar -xvzf': {
        // find first non-flag argument
        const archiveArg = args.find(a => !a.startsWith('-'));
        if (!archiveArg) {
          const out='tar: missing archive';
          session.history.push({command:rawCmd, output:out, ts:new Date()});
          await session.save();
          return { output: out, session };
        }
        const archivePath = archiveArg.startsWith('/') ? normalizePath(archiveArg) : normalizePath(session.cwd + '/' + archiveArg);
        const created = await tarExtract(archivePath);
        const out = created.length ? created.map(p => 'x ' + p).join('\n') : 'tar: nothing to extract';
        session.history.push({ command: rawCmd, output: out, ts: new Date() });
        await session.save();
        return { output: out, session };
      }
      case 'ps': case 'ps aux': case 'ps -ef': {
        const out = psAuxSample();
        session.history.push({ command: rawCmd, output: out, ts: new Date() });
        await session.save();
        return { output: out, session };
      }
      case 'kill': case 'kill -9': {
        if (!args[0]) {
          const out='kill: usage: kill -9 <PID>';
          session.history.push({command:rawCmd, output:out, ts:new Date()});
          await session.save();
          return { output: out, session };
        }
        const pid = args[0];
        if (['2143','3102','1','1399','1120','1278','1420','1501','1603','842'].includes(pid)) {
          const out = `[OK] Process ${pid} terminated`;
          session.history.push({ command: rawCmd, output: out, ts: new Date() });

          // Reactive story hooks (realistic)
          if (pid === '1399') {
            // the suspicious fs-replayd process
            session.history.push({ command: '[MONITOR]', output: 'Process 1399 terminated. Recent fs reads reduced. /tmp/.cache_replay may be stale.', ts: new Date() });
            session.score += 40;
            session.malwareFound = true;
            session.phase = session.phase === 'postfs' ? 'cleanup_pending' : session.phase;
          } else if (pid === '1120') {
            session.history.push({ command: '[MONITOR]', output: 'Process 1120 (audit-agent) terminated. Audit logs unaffected.', ts: new Date() });
          } else if (pid === '1278') {
            session.history.push({ command: '[MONITOR]', output: 'Process 1278 (metricsd) terminated. Metrics agent restarted by system.', ts: new Date() });
          } else {
            session.history.push({ command: '[MONITOR]', output: `Process ${pid} terminated.`, ts: new Date() });
          }

          await session.save();
          return { output: out, session };
        } else {
          const out = `kill: (${pid}) - No such process`;
          session.history.push({ command: rawCmd, output: out, ts: new Date() });
          await session.save();
          return { output: out, session };
        }
      }
      case 'chmod +x': {
        const target = args[0] ? (args[0].startsWith('/') ? normalizePath(args[0]) : normalizePath(session.cwd + '/' + args[0])) : null;
        if (!target) {
          const out='chmod: missing operand';
          session.history.push({command:rawCmd, output:out, ts:new Date()});
          await session.save();
          return { output: out, session };
        }
        const node = await getNode(target);
        if (!node) {
          const out=`chmod: cannot access '${target}': No such file or directory`;
          session.history.push({command:rawCmd, output:out, ts:new Date()});
          await session.save();
          return { output: out, session };
        }
        node.mode = '0755';
        await node.save();
        const out = '';
        session.history.push({ command: rawCmd, output: out, ts: new Date() });
        await session.save();
        return { output: out, session };
      }
      default:
        const out = `bash: ${cmd}: command not supported`;
        session.history.push({ command: rawCmd, output: out, ts: new Date() });
        await session.save();
        return { output: out, session };
    }
  } catch (err) {
    const out = err.msg || (err.message || 'Error executing command');
    session.history.push({ command: rawCmd, output: out, ts: new Date() });
    await session.save();
    return { output: out, session };
  }
}

module.exports = { runCommand, SUPPORTED };
