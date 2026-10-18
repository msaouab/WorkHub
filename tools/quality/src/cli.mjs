#!/usr/bin/env node
/**
 * `pnpm quality`        run every check and print a summary (exit 1 if a check fails)
 * `pnpm quality --gate` the same, plus the commit gate; used by the git pre-commit hook
 * `pnpm quality --push` the same, plus the push gate (outgoing commits name only done tickets); pre-push hook
 *
 * Steps:
 *   1. backlog rules       BACKLOG.md structure (same rules as `pnpm backlog`)
 *   2. commit gate         no ticket in progress or under review: reviewed work is `done` (--gate)
 *   3. nx sync             tsconfig project references up to date
 *   4. typecheck/lint/test every project (Nx cache keeps reruns fast)
 *   5. unused code         knip: unused files, exports and dependencies
 *   6. unused messages     translation keys no code reads
 *
 * Must run on the shell's default Node (git hooks don't use .nvmrc): no Node 21+ APIs.
 */
import { spawnSync, execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseTickets, validate } from '@work-hub/backlog';
import { findUnusedMessageKeys, gateProblems, pushGateProblems, summaryLine, ticketIdsInMessages } from './checks.mjs';

const root = resolve(import.meta.dirname, '../../..');
const push = process.argv.includes('--push');
const gate = push || process.argv.includes('--gate');

/** Message keys read with a variable (e.g. `t(locale)`), which the key check can't see. */
const DYNAMIC_MESSAGE_PREFIXES = ['Locale'];

/** Messages of the commits not on the upstream yet (what `git push` would send). */
function outgoingCommitMessages() {
  for (const base of ['@{upstream}', 'origin/main']) {
    try {
      return execFileSync('git', ['log', `${base}..HEAD`, '--format=%B'], {
        cwd: root,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      // try the next base
    }
  }
  return '';
}

function sourceFiles(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      if (name !== 'messages') files.push(...sourceFiles(path));
    } else if (/\.(tsx?|mjs)$/.test(name)) {
      files.push(path);
    }
  }
  return files;
}

/** Runs a command, returns its result; output is kept for the failure report. */
function command(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  return { ok: result.status === 0, output };
}

const markdown = readFileSync(resolve(root, 'BACKLOG.md'), 'utf8');

const steps = [
  {
    label: 'Backlog rules',
    run: () => {
      const problems = validate(markdown);
      return { ok: problems.length === 0, output: problems.join('\n') };
    },
  },
  {
    label: push
      ? 'Push gate (outgoing tickets done)'
      : gate
        ? 'Commit gate (worked tickets done)'
        : 'Commit gate (report only)',
    advisory: !gate,
    run: () => {
      const tickets = parseTickets(markdown);
      const problems = push
        ? pushGateProblems(tickets, ticketIdsInMessages(outgoingCommitMessages()))
        : gateProblems(tickets);
      return { ok: problems.length === 0, output: problems.join('\n') };
    },
  },
  { label: 'Nx project references (nx sync)', run: () => command('pnpm', ['exec', 'nx', 'sync:check']) },
  {
    label: 'Typecheck, lint, test (all projects)',
    run: () =>
      command('pnpm', ['exec', 'nx', 'run-many', '-t', 'typecheck', 'lint', 'test', '--outputStyle=static', '--skip-sync']),
  },
  { label: 'Unused files, exports, dependencies (knip)', run: () => command('pnpm', ['exec', 'knip', '--no-progress']) },
  {
    label: 'Unused translation keys',
    run: () => {
      const clientRoot = resolve(root, 'apps/client');
      const messages = JSON.parse(readFileSync(join(clientRoot, 'src/messages/en.json'), 'utf8'));
      const code = sourceFiles(join(clientRoot, 'src'))
        .map((file) => readFileSync(file, 'utf8'))
        .join('\n');
      const unused = findUnusedMessageKeys(messages, code, DYNAMIC_MESSAGE_PREFIXES);
      return {
        ok: unused.length === 0,
        output: unused.map((key) => `${key} (en/fr/ar.json)`).join('\n'),
      };
    },
  },
];

const results = [];
for (const step of steps) {
  process.stdout.write(`→ ${step.label}…\n`);
  const started = Date.now();
  const { ok, output } = step.run();
  const status = ok ? 'pass' : step.advisory ? 'warn' : 'fail';
  results.push({ ...step, status, seconds: (Date.now() - started) / 1000, output });
}

for (const result of results.filter((r) => r.status !== 'pass')) {
  const lines = result.output.trim().split('\n');
  console.log(`\n${result.status === 'fail' ? '✗' : '!'} ${result.label}`);
  console.log(lines.slice(-40).map((line) => `    ${line}`).join('\n'));
}

console.log('\nQuality summary');
for (const result of results) console.log(summaryLine(result));

const failed = results.filter((r) => r.status === 'fail');
if (failed.length > 0) {
  console.log(`\n✗ ${failed.length} check(s) failed.${push ? ' Push blocked.' : gate ? ' Commit blocked.' : ''}`);
  process.exit(1);
}
console.log(`\n✓ All checks passed.${push ? ' Push allowed.' : gate ? ' Commit allowed.' : ''}`);
