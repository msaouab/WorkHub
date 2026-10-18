#!/usr/bin/env node
/**
 * `pnpm backlog`                         review queue + every ticket by priority; exit 1 on rule violations
 * `pnpm backlog --mark-reviewed WH-001…` record that Claude reviewed these tickets (or `all`)
 * `node …/cli.mjs --hook session-start|prompt`
 *                                        Claude Code hook mode: prints hook JSON when there's something to
 *                                        review or fix, nothing otherwise; never fails the hook
 *
 * Must run on the shell's default Node (hooks don't use .nvmrc), so no Node 21+ APIs.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { committedDoneTickets, hookContext, markReviewed, parseTickets, pendingReviews, validate } from './backlog.mjs';

const root = resolve(import.meta.dirname, '../../..');
const backlogFile = resolve(root, 'BACKLOG.md');
/** Local, gitignored: which ticket version Claude last reviewed. */
const stateFile = resolve(root, '.claude/backlog-review-state.json');

function currentHead() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  } catch {
    return 'no-commit';
  }
}

/** BACKLOG.md as of the last commit, to know which `done` tickets are committed. */
function headBacklog() {
  try {
    return execFileSync('git', ['show', 'HEAD:BACKLOG.md'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return '';
  }
}

function readState() {
  try {
    return JSON.parse(readFileSync(stateFile, 'utf8'));
  } catch {
    return {};
  }
}

const args = process.argv.slice(2);
const markdown = readFileSync(backlogFile, 'utf8');
const tickets = parseTickets(markdown);
const head = currentHead();

// --- Hook mode: Claude Code injects the printed JSON into Claude's context.
const hookIndex = args.indexOf('--hook');
if (hookIndex !== -1) {
  try {
    const event = args[hookIndex + 1] === 'session-start' ? 'session-start' : 'prompt';
    const context = hookContext({
      event,
      tickets,
      problems: validate(markdown),
      pending: pendingReviews(tickets, head, readState()),
      committedDone: committedDoneTickets(tickets, headBacklog()),
    });
    if (context) {
      const hookEventName = event === 'session-start' ? 'SessionStart' : 'UserPromptSubmit';
      process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName, additionalContext: context } }));
    }
  } catch {
    // A broken tracker must never block the user's prompt.
  }
  process.exit(0);
}

// --- Record a review.
const markIndex = args.indexOf('--mark-reviewed');
if (markIndex !== -1) {
  const requested = args.slice(markIndex + 1);
  const underReview = tickets.filter((t) => t.status === 'under-review').map((t) => t.id);
  const ids = requested.includes('all') ? underReview : requested;
  const unknown = ids.filter((id) => !underReview.includes(id));
  if (!ids.length || unknown.length) {
    console.error(`Usage: pnpm backlog --mark-reviewed <WH-ids…|all>. Not under-review: ${unknown.join(', ') || '(none given)'}`);
    process.exit(1);
  }
  const state = markReviewed(readState(), tickets, ids, head, new Date().toISOString().slice(0, 10));
  if (!existsSync(dirname(stateFile))) mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`);
  console.log(`Marked reviewed at ${head.slice(0, 7)}: ${ids.join(', ')}`);
  process.exit(0);
}

// --- Default: human-readable overview.
const pending = new Set(pendingReviews(tickets, head, readState()).map((p) => p.ticket.id));

function line(t) {
  const open = t.openItems ? ` · ${t.openItems} open` : '';
  const blocked = t.blockedBy ? ` · blocked by ${t.blockedBy}` : '';
  const flag = pending.has(t.id) ? '  ⟳ needs review' : '';
  return `  P${t.priority}  ${t.id}  [${t.status}]  ${t.title}${open}${blocked}${flag}`;
}

const queue = tickets.filter((t) => t.status === 'under-review');
console.log(`\nREVIEW QUEUE (${queue.length}, ${pending.size} need review)`);
queue.forEach((t) => console.log(line(t)));

const counts = {};
for (const t of tickets) counts[t.status] = (counts[t.status] ?? 0) + 1;
const summary = Object.entries(counts).map(([status, n]) => `${n} ${status}`).join(' · ');
console.log(`\nALL TICKETS BY PRIORITY, THEN STATUS (${tickets.length}: ${summary})`);
tickets.forEach((t) => console.log(line(t)));

const committedDone = committedDoneTickets(tickets, headBacklog());
if (committedDone.length) {
  console.log(`\nCOMMITTED AS DONE, delete from BACKLOG.md: ${committedDone.map((t) => t.id).join(', ')}`);
}

const problems = validate(markdown);
if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s) in BACKLOG.md:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('\n✓ BACKLOG.md is valid');
