import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findUnusedMessageKeys, gateProblems, messageKeyPaths, pushGateProblems, summaryLine, ticketIdsInMessages } from './checks.mjs';

const ticket = (id, status) => ({ id, status });

describe('gateProblems', () => {
  it('passes when worked tickets are done', () => {
    assert.deepEqual(gateProblems([ticket('WH-001', 'start'), ticket('WH-002', 'done')]), []);
  });

  it('blocks on tickets in progress or still under review', () => {
    const problems = gateProblems([ticket('WH-001', 'in progress'), ticket('WH-002', 'under-review')]);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /WH-001 is in progress/);
    assert.match(problems[1], /WH-002 is under review/);
  });
});

describe('pushGateProblems', () => {
  const tickets = [ticket('WH-001', 'start'), ticket('WH-002', 'in progress'), ticket('WH-003', 'under-review')];

  it('blocks when an outgoing commit names a ticket that is not done', () => {
    const problems = pushGateProblems(tickets, ['WH-003', 'WH-009']);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^WH-003 is under-review/);
  });

  it('ignores unfinished tickets that no outgoing commit mentions', () => {
    assert.deepEqual(pushGateProblems(tickets, ['WH-009']), []);
  });
});

describe('ticketIdsInMessages', () => {
  it('finds unique ticket IDs in commit messages', () => {
    assert.deepEqual(ticketIdsInMessages('WH-073, WH-074: x\nRefs: WH-073, WH-016'), ['WH-073', 'WH-074', 'WH-016']);
  });
});

describe('messageKeyPaths', () => {
  it('flattens nested messages to dotted paths', () => {
    assert.deepEqual(messageKeyPaths({ A: { b: 'x', c: { d: 'y' } }, E: 'z' }), ['A.b', 'A.c.d', 'E']);
  });
});

describe('findUnusedMessageKeys', () => {
  const messages = {
    Shell: { soon: 'Soon', old: 'Old' },
    ComingSoon: { features: { leave: 'Leave', calendar: 'Calendar' } },
    Locale: { en: 'English' },
  };

  it('treats quoted leaves, dynamic parents and allowlisted prefixes as used', () => {
    const code = "t('soon'); t(`features.${feature}`); t(locale);";
    assert.deepEqual(findUnusedMessageKeys(messages, code, ['Locale']), ['Shell.old']);
  });

  it('treats a subtree as used when an ancestor is read with a dotted variable', () => {
    const perms = { Roles: { permissions: { space: { settings: { write: 'Edit' } }, members: { read: 'View' } } } };
    assert.deepEqual(findUnusedMessageKeys(perms, 't(`permissions.${permission}`)'), []);
  });

  it('matches a leaf inside a dotted key', () => {
    assert.deepEqual(findUnusedMessageKeys({ A: { b: 'x' } }, "t('A.b')"), []);
  });
});

describe('summaryLine', () => {
  it('shows an icon per status', () => {
    assert.match(summaryLine({ label: 'Lint', status: 'pass', seconds: 1 }), /^ {2}✓ Lint/);
    assert.match(summaryLine({ label: 'Lint', status: 'fail', seconds: 1 }), /^ {2}✗ Lint/);
    assert.match(summaryLine({ label: 'Lint', status: 'warn', seconds: 1 }), /^ {2}! Lint/);
  });
});
