import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';

// command list for completion
const COMMANDS = [
  'ls','ls -a','ls -l','cd','pwd','cat','less','find',
  'tar -xvzf','ps aux','ps -ef','kill -9','chmod +x'
];

export default function Terminal({ sessionId }) {
  // lines: mixed objects -> { type: 'cmd', cwd, cmd } | { type: 'out', text }
  const [lines, setLines] = useState([]);
  const [cwd, setCwd] = useState('/system/root');
  const [score, setScore] = useState(0);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState([]);
  const [histIndex, setHistIndex] = useState(null);

  const outRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // focus input on mount
    inputRef.current && inputRef.current.focus();
  }, []);

  // autoscroll whenever lines change
  useEffect(() => {
    if (outRef.current) {
      outRef.current.scrollTop = outRef.current.scrollHeight;
    }
  }, [lines]);

  // helpers to push different line types
  const pushCmd = (cwdVal, cmd) => setLines(l => [...l, { type: 'cmd', cwd: cwdVal, cmd }]);
  const pushOut = (text) => setLines(l => [...l, { type: 'out', text }]);

  // initial session fetch
  useEffect(() => {
    (async () => {
      const s = await api.getSession(sessionId);
      if (s) {
        setCwd(s.cwd);
        setScore(s.score);
      }
      pushOut(`Connected. Score: ${s ? s.score : 0}`);
      inputRef.current && inputRef.current.focus();
    })();
    // eslint-disable-next-line
  }, [sessionId]);

  const run = async (cmd) => {
    pushCmd(cwd, cmd);
    const res = await api.execCommand(sessionId, cmd);
    if (res.output) pushOut(res.output);
    if (res.session) {
      setCwd(res.session.cwd);
      setScore(res.session.score);
      if (res.session.roundCompleted) pushOut('[SYSTEM] Round completed!');
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const t = input.trim();
    if (!t) return;
    setHistory(h => [...h, t]);
    setHistIndex(null);
    await run(t);
    setInput('');
    inputRef.current && inputRef.current.focus();
  };

  // Utility: naive joinPath (frontend copy, matches backend joinPath semantics)
  const joinPath = (base, target) => {
    if (!target) return base;
    if (target.startsWith('/')) return target.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
    if (target === '.') return base;
    if (target === '..') return base.split('/').slice(0, -1).join('/') || '/';
    return (base + '/' + target).replace(/\/+/g, '/').replace(/\/$/, '') || '/';
  };

  // Get directory entries from backend for a given directory path.
  // Returns array of names (hidden included).
  const listDirEntries = async (dirPath) => {
    try {
      // call backend ls -a to get all files (space-separated in your engine)
      const cmd = `ls -a ${dirPath}`;
      const r = await api.execCommand(sessionId, cmd);
      const out = r.output || '';
      // backend returns 'No results' or nothing sometimes
      if (!out) return [];
      // split by whitespace but preserve names with spaces? seed doesn't have spaces; simple split is fine
      // also handle newline-separated
      const tokens = out.split(/\s+/).filter(Boolean);
      return tokens;
    } catch (err) {
      return [];
    }
  };

  // Tab completion core:
  // - If first token being typed (i.e. before first space) -> complete commands
  // - Else -> complete filenames in directory of the token (resolve relative/absolute)
  const handleTabCompletion = async () => {
    const raw = input;
    // if input is empty, show top-level commands
    if (raw.trim() === '') {
      pushOut(COMMANDS.join(' '));
      return;
    }

    // split by spaces, but we want to know last token (the one being completed)
    // preserve everything before last token to reassemble
    const parts = raw.split(' ');
    const last = parts[parts.length - 1];
    const firstToken = parts[0];

    // Determine if we're completing the command name (no space after first token yet)
    const isCompletingCmd = (parts.length === 1);

    if (isCompletingCmd) {
      // match against COMMANDS (case-insensitive)
      const q = last.toLowerCase();
      const matches = COMMANDS.filter(c => c.toLowerCase().startsWith(q));
      if (matches.length === 0) {
        // no matches — do nothing
        return;
      } else if (matches.length === 1) {
        // single match: replace input with match (preserve trailing space)
        setInput(matches[0] + (matches[0].endsWith(' ') ? '' : ' '));
      } else {
        // multiple matches: show suggestions
        pushOut(matches.join(' '));
      }
      return;
    }

    // Otherwise, complete file/directory names for the last token.
    // Support possible path prefix like dir/sub<tab>
    const token = last;
    let dirPart = '';
    let basePart = token;

    if (token.includes('/')) {
      const idx = token.lastIndexOf('/');
      dirPart = token.slice(0, idx + 1); // keep trailing slash for reassembly
      basePart = token.slice(idx + 1);
    }

    // Resolve directory to list: if dirPart starts with '/', absolute; otherwise relative to cwd
    const dirToList = dirPart.startsWith('/') ? dirPart.replace(/\/+$/, '') || '/' : joinPath(cwd, dirPart.replace(/\/+$/, '') || '.');

    // get entries
    const entries = await listDirEntries(dirToList);

    // filter by basePart prefix (case-sensitive like Linux)
    const matches = entries.filter(name => name.startsWith(basePart));

    if (matches.length === 0) {
      // no matches, do nothing
      return;
    } else if (matches.length === 1) {
      // single match: insert it
      const completion = matches[0];
      // if the completion is a directory in output, we can't be sure; backend ls shows directories with trailing '/'
      // we will append a '/' if user typed dirPart + completion/exists in fs as dir: try calling ls <dirToList>/<completion>
      // but to keep it simple, append a space after completion (so user can type next token)
      const prefix = parts.slice(0, -1).join(' ');
      const newToken = dirPart + completion;
      const newInput = (prefix ? prefix + ' ' : '') + newToken + ' ';
      setInput(newInput);
    } else {
      // many matches -> list them
      pushOut(matches.join(' '));
    }
  };

  // keyboard handling for hidden input
  const onKeyDown = async (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHistIndex(i => {
        const newI = (i === null ? history.length - 1 : Math.max(0, i - 1));
        if (history[newI]) setInput(history[newI]);
        return newI;
      });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHistIndex(i => {
        if (i === null) return null;
        const newI = i + 1;
        if (newI >= history.length) { setInput(''); return null; }
        setInput(history[newI]);
        return newI;
      });
    } else if (e.key === 'Tab') {
      e.preventDefault();
      await handleTabCompletion();
    } else if (e.key === 'Enter') {
      // let onSubmit handle it via form submit
    }
  };

  // click to focus input
  const onTerminalClick = () => inputRef.current && inputRef.current.focus();

  return (
    <div className="terminal" onClick={onTerminalClick}>
      <div className="term-header">
        <div className="term-buttons">
          <div className="term-dot close" />
          <div className="term-dot min" />
          <div className="term-dot max" />
        </div>
        <div className="right">Score: {score}</div>
      </div>

      <div className="output" ref={outRef}>
        {lines.map((item, i) => {
          if (item.type === 'cmd') {
            return (
              <div className="line" key={i}>
                <span className="prompt-inline">{item.cwd}$</span>
                <span className="cmd-text"> {item.cmd}</span>
              </div>
            );
          } else {
            return (
              <pre className="line out-text" key={i} style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {item.text}
              </pre>
            );
          }
        })}
      </div>

      {/* sticky input area */}
      <form onSubmit={onSubmit} className="input-line" role="search">
        <div className="prompt">{cwd}$</div>

        {/* the invisible input receives real keystrokes */}
        <input
          ref={inputRef}
          className="hidden-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          autoFocus
          spellCheck={false}
          aria-label="Terminal input"
        />

        {/* visible fake input */}
        <div className="fake-input" aria-hidden>
          {input || <span style={{ opacity: 0.5 }}>Type a command...</span>}
          <span className="caret" />
        </div>
      </form>

      <div className="tty-footer">
        <div>Connected</div>
        <div style={{ opacity: 0.8 }}>OS Escape — Round 1</div>
      </div>
    </div>
  );
}
