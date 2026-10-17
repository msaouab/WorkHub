/**
 * OS side effects for the WorkHub dev helper (lsof / ps / kill / rm).
 * Kept separate so the decision logic in `dev.mjs` stays unit-testable.
 */
import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { DEV_PORTS, parseLsofListen, uniqueListeners } from './dev.mjs';

export function listListeningPids(ports = DEV_PORTS) {
  const args = ['-nP', '-sTCP:LISTEN', ...ports.map((p) => `-iTCP:${p}`)];
  try {
    const stdout = execFileSync('lsof', args, { encoding: 'utf8' });
    return parseLsofListen(stdout);
  } catch (error) {
    // lsof exits 1 when nothing matches.
    if (error?.status === 1) {
      return error.stdout ? parseLsofListen(String(error.stdout)) : [];
    }
    throw error;
  }
}

export function readProcessCommand(pid) {
  try {
    return execFileSync('ps', ['-ww', '-p', String(pid), '-o', 'command='], {
      encoding: 'utf8',
    }).trim();
  } catch {
    return '';
  }
}

export function readProcessCwd(pid) {
  try {
    const stdout = execFileSync('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], {
      encoding: 'utf8',
    });
    for (const line of stdout.split('\n')) {
      if (line.startsWith('n')) return line.slice(1);
    }
  } catch {
    // process may have exited
  }
  return '';
}

/** Enrich port listeners with command line and cwd (one row per pid+port). */
export function inspectListeners(ports = DEV_PORTS) {
  const rows = uniqueListeners(listListeningPids(ports));
  return rows.map(({ port, pid }) => ({
    port,
    pid,
    command: readProcessCommand(pid),
    cwd: readProcessCwd(pid),
  }));
}

export function terminatePid(pid) {
  try {
    process.kill(pid, 'SIGTERM');
  } catch (error) {
    if (error?.code === 'ESRCH') return;
    throw error;
  }
}

export function forceKillPid(pid) {
  try {
    process.kill(pid, 'SIGKILL');
  } catch (error) {
    if (error?.code === 'ESRCH') return;
    throw error;
  }
}

/** Next's corrupted-cache directory (full `.next` is fine and simplest). */
export function clearNextCache(repoRoot) {
  const nextDir = resolve(repoRoot, 'apps/client/.next');
  rmSync(nextDir, { recursive: true, force: true });
  return nextDir;
}
