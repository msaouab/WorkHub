import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseTickets, validate } from './backlog.mjs';

const ticket = (id, priority, status, extra = '') =>
  `### ${id} · Title ${id}\n- **Type:** bug · **Priority:** P${priority} · **Status:** ${status} · **Area:** client\n${extra}`;

function backlog({ underReview = [], inProgress = [], start = [], tracker = [], done = [] } = {}) {
  return [
    '# Backlog',
    '## Review tracker',
    '| Ticket | x |',
    '|---|---|',
    ...tracker.map((id) => `| ${id} · Title | x |`),
    '## Under review',
    ...underReview,
    '## In progress',
    ...inProgress,
    '## Start',
    ...start,
    '## Done',
    '| Ticket | What | Commit |',
    ...done.map((id) => `| ${id} | x | abc |`),
  ].join('\n');
}

describe('parseTickets', () => {
  it('reads id, priority, status, section and open checklist items', () => {
    const [t] = parseTickets(backlog({ start: [ticket('WH-001', 2, 'start', '  - [ ] a\n  - [x] b\n- **Blocked by:** WH-009')] }));
    assert.deepEqual(
      { id: t.id, priority: t.priority, status: t.status, section: t.section, openItems: t.openItems, blockedBy: t.blockedBy },
      { id: 'WH-001', priority: 2, status: 'start', section: 'Start', openItems: 1, blockedBy: 'WH-009' }
    );
  });
});

describe('validate', () => {
  it('accepts a well-formed backlog', () => {
    const md = backlog({
      underReview: [ticket('WH-002', 1, 'under-review')],
      inProgress: [ticket('WH-003', 1, 'in progress')],
      start: [ticket('WH-004', 1, 'start'), ticket('WH-005', 3, 'start')],
      tracker: ['WH-002'],
      done: ['WH-001'],
    });
    assert.deepEqual(validate(md), []);
  });

  it('rejects unknown statuses and tickets in the wrong section', () => {
    const problems = validate(backlog({ start: [ticket('WH-001', 1, 'ready'), ticket('WH-002', 1, 'in progress')] }));
    assert.ok(problems.some((p) => p.includes('unknown status "ready"')));
    assert.ok(problems.some((p) => p.includes('WH-002') && p.includes('## In progress')));
  });

  it('requires done tickets to leave the active sections', () => {
    const problems = validate(backlog({ start: [ticket('WH-001', 1, 'done')] }));
    assert.ok(problems.some((p) => p.includes('add a row to the Done table')));
  });

  it('flags duplicates, wrong priority order and a stale review tracker', () => {
    const problems = validate(
      backlog({
        underReview: [ticket('WH-001', 1, 'under-review')],
        start: [ticket('WH-002', 3, 'start'), ticket('WH-003', 1, 'start'), ticket('WH-002', 3, 'start')],
        tracker: ['WH-009'],
      })
    );
    assert.ok(problems.some((p) => p.includes('duplicate ticket ID')));
    assert.ok(problems.some((p) => p.includes('not ordered by priority')));
    assert.ok(problems.some((p) => p.includes('WH-001: under-review but missing')));
    assert.ok(problems.some((p) => p.includes('WH-009: in the Review tracker but not under-review')));
  });

  it('flags a ticket that is both active and in the Done table', () => {
    const problems = validate(backlog({ start: [ticket('WH-001', 1, 'start')], done: ['WH-001'] }));
    assert.ok(problems.some((p) => p.includes('listed in the Done table but still active')));
  });
});
