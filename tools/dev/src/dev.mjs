/**
 * Pure helpers for `pnpm dev` / `pnpm dev:reset`.
 * No process kills or filesystem access here — those stay in the CLI.
 */

/** Ports WorkHub's local client, API, and Nest inspector use. */
export const DEV_PORTS = [3000, 3333, 9229];

/** Matches root `package.json` engines.node. */
export const MIN_NODE = { major: 22, minor: 12 };

/** Command-line fragments that mark a WorkHub client/API/nx process. */
export const WORKHUB_MARKERS = [
  'next-server',
  '/next/',
  ' next ',
  'next dev',
  '/@nx/',
  '/nx/',
  ' nx ',
  'nx.js',
  '@work-hub',
  'apps/client',
  'apps/server',
  'webpack',
  'nest',
];

/** Strip a trailing slash so `${root}/` matching is stable. */
function normalizeRepoRoot(repoRoot) {
  return repoRoot.endsWith('/') ? repoRoot.slice(0, -1) : repoRoot;
}

/** Absolute path under `repoRoot`, or the root itself. */
export function pathIsUnderRepo(path, repoRoot) {
  if (!path) return false;
  const root = normalizeRepoRoot(repoRoot);
  return path === root || path.startsWith(`${root}/`);
}

/**
 * True when `command` embeds this checkout's path as a directory prefix.
 * Requires `${root}/` so a sibling like `WorkHub-fork` does not match `WorkHub`.
 */
export function commandMentionsRepo(command, repoRoot) {
  if (!command) return false;
  const root = normalizeRepoRoot(repoRoot);
  return command.includes(`${root}/`);
}

/**
 * True only when the process both belongs to this checkout and looks like
 * our local Next / Nest / Nx tooling — never a random app on the same port.
 */
export function isWorkHubDevProcess({ command = '', cwd = '', repoRoot }) {
  const underRepo =
    pathIsUnderRepo(cwd, repoRoot) || commandMentionsRepo(command, repoRoot);
  if (!underRepo) return false;
  return WORKHUB_MARKERS.some((marker) => command.includes(marker));
}

/**
 * Decide what `dev:reset` may kill. Foreign listeners are listed, never killed.
 * @param {Array<{ port: number, pid: number, command: string, cwd: string }>} listeners
 */
export function planReset(listeners, repoRoot) {
  const kill = [];
  const refuse = [];
  const seen = new Set();

  for (const listener of listeners) {
    if (seen.has(listener.pid)) continue;
    seen.add(listener.pid);

    if (isWorkHubDevProcess({ ...listener, repoRoot })) {
      kill.push(listener);
    } else {
      refuse.push(listener);
    }
  }

  return { kill, refuse };
}

/** Short label for busy-port / reset output (full argv is usually unreadable). */
export function shortCommand(command) {
  const cmd = command?.trim() ?? '';
  if (!cmd) return '(unknown command)';
  if (cmd.includes('next-server') || /\bnext(\/|\s).*dev\b/.test(cmd) || cmd.includes('next dev')) {
    return 'node (next dev)';
  }
  if (
    (cmd.includes('nx.js') || cmd.includes('/@nx/')) &&
    /\bserve\b/.test(cmd)
  ) {
    return 'node (nx serve server)';
  }
  if ((cmd.includes('nx.js') || cmd.includes('/@nx/')) && /\bdev\b/.test(cmd)) {
    return 'node (nx dev)';
  }
  if (cmd.includes('/@nx/') && cmd.includes('node-with-esm-loader')) {
    return 'node (nx serve server)';
  }
  if (cmd.includes('webpack')) {
    return 'node (webpack / Nest API)';
  }
  if (cmd.includes('nest')) {
    return 'node (Nest API)';
  }
  const base = cmd.split(/\s+/)[0]?.split('/').pop() || 'process';
  return base.length > 48 ? `${base.slice(0, 45)}…` : base;
}

/** Human message when `pnpm dev` finds a busy port. */
export function formatBusyPorts(listeners) {
  const lines = [
    'Cannot start `pnpm dev`: these ports are already in use.',
    '',
  ];
  for (const { port, pid, command } of uniqueListeners(listeners)) {
    lines.push(`  :${port}  pid ${pid}  ${shortCommand(command)}`);
  }
  lines.push(
    '',
    'If those are leftover WorkHub processes, run:  pnpm dev:reset',
    'Then start again with:                       pnpm dev'
  );
  return lines.join('\n');
}

/** Drop IPv4+IPv6 double listings of the same pid on the same port. */
export function uniqueListeners(listeners) {
  const seen = new Set();
  const unique = [];
  for (const listener of listeners) {
    const key = `${listener.pid}:${listener.port}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(listener);
  }
  return unique;
}

/** Parse `lsof -nP -iTCP:… -sTCP:LISTEN` into { port, pid } rows (deduped). */
export function parseLsofListen(stdout) {
  const rows = [];
  const seen = new Set();
  for (const line of stdout.split('\n')) {
    if (!line || line.startsWith('COMMAND')) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 9) continue;
    const pid = Number(parts[1]);
    const last = parts[parts.length - 1];
    // NAME looks like *:3000 or 127.0.0.1:3333; lsof appends "(LISTEN)".
    const name = last === '(LISTEN)' ? parts[parts.length - 2] : last;
    const portMatch = /:(\d+)$/.exec(name);
    if (!Number.isInteger(pid) || pid <= 0 || !portMatch) continue;
    const port = Number(portMatch[1]);
    const key = `${pid}:${port}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ pid, port });
  }
  return rows;
}

/**
 * @returns {string | null} error message when Node is too old, else null
 */
export function nodeVersionError(version = process.versions.node) {
  const match = /^(\d+)\.(\d+)\./.exec(version);
  if (!match) {
    return `Cannot start \`pnpm dev\`: could not parse Node version "${version}". Need >= ${MIN_NODE.major}.${MIN_NODE.minor}.`;
  }
  const major = Number(match[1]);
  const minor = Number(match[2]);
  const ok =
    major > MIN_NODE.major ||
    (major === MIN_NODE.major && minor >= MIN_NODE.minor);
  if (ok) return null;
  return [
    `Cannot start \`pnpm dev\`: Node ${version} is too old (need >= ${MIN_NODE.major}.${MIN_NODE.minor}).`,
    '',
    '  nvm install 22',
    '  nvm alias default 22',
    '  nvm use 22',
  ].join('\n');
}
