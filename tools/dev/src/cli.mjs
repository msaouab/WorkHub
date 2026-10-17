#!/usr/bin/env node
/**
 * `pnpm dev` runs `check` first.
 * `pnpm dev:reset` frees WorkHub leftovers and clears the Next.js cache.
 *
 * Usage:
 *   node tools/dev/src/cli.mjs check
 *   node tools/dev/src/cli.mjs reset
 */
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import {
  DEV_PORTS,
  formatBusyPorts,
  nodeVersionError,
  planReset,
  shortCommand,
} from './dev.mjs';
import {
  clearNextCache,
  forceKillPid,
  inspectListeners,
  terminatePid,
} from './system.mjs';

const root = resolve(import.meta.dirname, '../../..');
const command = process.argv[2];

function sleep(seconds) {
  execFileSync('sleep', [String(seconds)]);
}

function runCheck() {
  const versionProblem = nodeVersionError();
  if (versionProblem) {
    console.error(versionProblem);
    process.exit(1);
  }

  const listeners = inspectListeners(DEV_PORTS);
  if (!listeners.length) {
    process.exit(0);
  }
  console.error(formatBusyPorts(listeners));
  process.exit(1);
}

function runReset() {
  const listeners = inspectListeners(DEV_PORTS);
  const { kill, refuse } = planReset(listeners, root);

  for (const { pid, port, command: cmd } of kill) {
    console.log(
      `Stopping WorkHub process on :${port} (pid ${pid})  ${shortCommand(cmd)}`
    );
    terminatePid(pid);
  }

  if (kill.length) {
    sleep(0.5);
    for (const { pid } of kill) {
      try {
        process.kill(pid, 0);
        forceKillPid(pid);
      } catch {
        // already gone
      }
    }
  }

  const cleared = clearNextCache(root);
  console.log(`Cleared ${cleared}`);

  if (refuse.length) {
    console.error('');
    console.error(
      'Left these non-WorkHub processes alone (free the port yourself if needed):'
    );
    for (const { port, pid, command: cmd } of refuse) {
      console.error(`  :${port}  pid ${pid}  ${shortCommand(cmd)}`);
    }
    process.exit(1);
  }

  const still = inspectListeners(DEV_PORTS);
  if (still.length) {
    console.error('');
    console.error('Ports still busy after reset:');
    console.error(formatBusyPorts(still));
    process.exit(1);
  }

  console.log('Ready. Start with:  pnpm dev');
  process.exit(0);
}

if (command === 'check') {
  runCheck();
} else if (command === 'reset') {
  runReset();
} else {
  console.error('Usage: node tools/dev/src/cli.mjs <check|reset>');
  process.exit(1);
}
