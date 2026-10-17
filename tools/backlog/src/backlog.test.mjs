import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { hookContext, markReviewed, parseTickets, pendingReviews, validate } from './backlog.mjs';

const ticket = (id, priority, status, extra = '') =>
  `### ${id} · Title ${id}\n- **Type:** bug · **Priority:** P${priority} · **Status:** ${status} · **Area:** client\n${extra}`;

function backlog({ tickets = [], tracker = [], before = [] } = {}) {
  return [
    '# Backlog',
    '## Workflow',
    ...before,
    '## Review tracker',
    '| Ticket | x |',
    '|---|---|',
    ...tracker.map((id) => `| ${id} · Title | x |`),
    '## Tickets',
    ...tickets,
  ].join('\n');
}

describe('parseTickets', () => {
  it('reads id, priority, status, section, open items and blocker', () => {
    const [t] = parseTickets(backlog({ tickets: [ticket('WH-001', 2, 'start', '  - [ ] a\n  - [x] b\n- **Blocked by:** WH-009')] }));
    assert.deepEqual(
      { id: t.id, priority: t.priority, status: t.status, section: t.section, openItems: t.openItems, blockedBy: t.blockedBy },
      { id: 'WH-001', priority: 2, status: 'start', section: 'Tickets', openItems: 1, blockedBy: 'WH-009' }
    );
  });
});

describe('validate', () => {
  it('accepts one list sorted by priority, then status (start → in progress → under-review)', () => {
    const md = backlog({
      tickets: [
        ticket('WH-005', 0, 'start'),
        ticket('WH-003', 1, 'start'),
        ticket('WH-006', 1, 'start'),
        ticket('WH-002', 1, 'in progress'),
        ticket('WH-001', 1, 'under-review'),
        ticket('WH-004', 3, 'start'),
      ],
      tracker: ['WH-001'],
    });
    assert.deepEqual(validate(md), []);
  });

  it('keeps the "next free" ID above every ticket ID', () => {
    const tickets = [ticket('WH-007', 1, 'start')];
    assert.deepEqual(validate(backlog({ before: ['next free is WH-008'], tickets })), []);
    const problems = validate(backlog({ before: ['next free is WH-007'], tickets }));
    assert.ok(problems.some((p) => p.includes('"next free is WH-007" is already used')));
  });

  it('rejects a list that is out of priority order', () => {
    const problems = validate(backlog({ tickets: [ticket('WH-001', 3, 'start'), ticket('WH-002', 1, 'start')] }));
    assert.ok(problems.some((p) => p.includes('WH-002 (P1, start) comes after WH-001 (P3, start)')));
  });

  it('rejects a list that is out of status order within the same priority', () => {
    const problems = validate(
      backlog({ tickets: [ticket('WH-001', 1, 'under-review'), ticket('WH-002', 1, 'in progress'), ticket('WH-003', 1, 'start')], tracker: ['WH-001'] })
    );
    assert.ok(problems.some((p) => p.includes('WH-002 (P1, in progress) comes after WH-001 (P1, under-review)')));
    assert.ok(problems.some((p) => p.includes('WH-003 (P1, start) comes after WH-002 (P1, in progress)')));
  });

  it('requires done tickets to be deleted, and rejects unknown statuses', () => {
    const problems = validate(backlog({ tickets: [ticket('WH-001', 1, 'done'), ticket('WH-002', 1, 'ready')] }));
    assert.ok(problems.some((p) => p.includes('WH-001') && p.includes('delete the ticket')));
    assert.ok(problems.some((p) => p.includes('unknown status "ready"')));
  });

  it('requires every ticket to be under ## Tickets', () => {
    const problems = validate(backlog({ before: [ticket('WH-009', 1, 'start')] }));
    assert.ok(problems.some((p) => p.includes('WH-009') && p.includes('must be under "## Tickets"')));
  });

  it('flags duplicates and a review tracker out of sync', () => {
    const problems = validate(
      backlog({
        tickets: [ticket('WH-001', 1, 'under-review'), ticket('WH-002', 1, 'start'), ticket('WH-002', 1, 'start')],
        tracker: ['WH-009'],
      })
    );
    assert.ok(problems.some((p) => p.includes('duplicate ticket ID')));
    assert.ok(problems.some((p) => p.includes('WH-001: under-review but missing')));
    assert.ok(problems.some((p) => p.includes('WH-009: in the Review tracker but not under-review')));
  });
});

describe('review tracking', () => {
  const tickets = parseTickets(
    backlog({ tickets: [ticket('WH-001', 1, 'under-review'), ticket('WH-002', 2, 'start')], tracker: ['WH-001'] })
  );

  it('flags an under-review ticket that was never reviewed', () => {
    assert.deepEqual(pendingReviews(tickets, 'c1').map((p) => [p.ticket.id, p.reason]), [['WH-001', 'never reviewed']]);
  });

  it('stays quiet after a review, until a new commit or a ticket edit', () => {
    const state = markReviewed({}, tickets, ['WH-001'], 'c1', '2026-10-17');
    assert.deepEqual(pendingReviews(tickets, 'c1', state), []);
    assert.equal(pendingReviews(tickets, 'c2', state)[0].reason, 'changed since review on 2026-10-17');

    const edited = parseTickets(backlog({ tickets: [ticket('WH-001', 1, 'under-review', '- [x] done now')], tracker: ['WH-001'] }));
    assert.equal(pendingReviews(edited, 'c1', state).length, 1);
  });

  it('ignores whitespace-only changes (re-sorting, blank lines)', () => {
    const state = markReviewed({}, tickets, ['WH-001'], 'c1', '2026-10-17');
    const reformatted = parseTickets(
      backlog({ tickets: [ticket('WH-002', 2, 'start'), `${ticket('WH-001', 1, 'under-review')}\n\n\n   `], tracker: ['WH-001'] })
    );
    assert.deepEqual(pendingReviews(reformatted, 'c1', state), []);
  });

  it('forgets tickets that left review', () => {
    const state = markReviewed({ reviewed: { 'WH-009': { fingerprint: 'x', at: 'old' } } }, tickets, ['WH-001'], 'c1', 'd');
    assert.deepEqual(Object.keys(state.reviewed), ['WH-001']);
  });

  it('hook text: silent on prompts with nothing to do, actionable otherwise', () => {
    const quiet = hookContext({ event: 'prompt', tickets, problems: [], pending: [] });
    assert.equal(quiet, null);
    const loud = hookContext({ event: 'prompt', tickets, problems: ['WH-005: bad'], pending: pendingReviews(tickets, 'c1') });
    assert.match(loud, /1 under-review ticket\(s\) need review/);
    assert.match(loud, /status to `in progress`/);
    assert.match(loud, /WH-005: bad/);
    assert.match(hookContext({ event: 'session-start', tickets, problems: [], pending: [] }), /all reviewed since their last change: WH-001/);
  });
});
