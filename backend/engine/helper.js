const FileNode = require('../models/FileNode');

function basename(path) {
  return path.replace(/\/$/, '').split('/').pop();
}

function joinPath(cwd, target) {
  if (!target) return cwd;
  if (target.startsWith('/')) return target;
  if (target === '.') return cwd;
  if (target === '..') return cwd.split('/').slice(0,-1).join('/') || '/';
  // naive relative
  return (cwd.endsWith('/') ? cwd + target : cwd + '/' + target).replace(/\/+/g,'/');
}

// format ls -l style (very simple)
function modeToString(mode, type='file') {
  // mode is like '0644' stored as string
  // minimal mapping
  const perms = {
    '0':'---','1':'--x','2':'-w-','3':'-wx','4':'r--','5':'r-x','6':'rw-','7':'rwx'
  };
  const m = mode.padStart(4,'0');
  const perm = perms[m[1]] + perms[m[2]] + perms[m[3]];
  return (type === 'dir' ? 'd' : '-') + perm;
}

module.exports = { basename, joinPath, modeToString };
