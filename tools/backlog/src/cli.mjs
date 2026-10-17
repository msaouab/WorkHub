#!/usr/bin/env node
/**
 * `pnpm backlog`: prints BACKLOG.md by status (review queue first) and fails on format mistakes.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseTickets, validate } from './backlog.mjs';

const file = resolve(import.meta.dirname, '../../../BACKLOG.md');
const markdown = readFileSync(file, 'utf8');
const tickets = parseTickets(markdown);

function list(status, limit = Infinity) {
  const rows = tickets.filter((t) => t.status === status);
  console.log(`\n${status.toUpperCase()} (${rows.length})`);
  for (const t of rows.slice(0, limit)) {
    const open = t.openItems ? ` · ${t.openItems} open item${t.openItems === 1 ? '' : 's'}` : '';
    const blocked = t.blockedBy ? ` · blocked by ${t.blockedBy}` : '';
    console.log(`  P${t.priority}  ${t.id}  ${t.title}${open}${blocked}`);
  }
  if (rows.length > limit) console.log(`  … ${rows.length - limit} more`);
}

list('under-review');
list('in progress');
list('start', 8);

const problems = validate(markdown);
if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s) in BACKLOG.md:`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log('\n✓ BACKLOG.md is valid');
