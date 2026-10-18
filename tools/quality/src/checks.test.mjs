import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { findUnusedMessageKeys, gateProblems, messageKeyPaths, summaryLine } from './checks.mjs';

const ticket = (id, status) => ({ id, status });

describe('gateProblems', () => {
  it('passes when nothing is in progress and every review is done', () => {
    assert.deepEqual(gateProblems([ticket('WH-001', 'start'), ticket('WH-002', 'under-review')], []), []);
  });

  it('blocks on tickets in progress and on unreviewed tickets', () => {
    const problems = gateProblems(
      [ticket('WH-001', 'in progress'), ticket('WH-002', 'under-review')],
      [{ ticket: ticket('WH-002', 'under-review'), reason: 'never reviewed' }]
    );
    assert.equal(problems.length, 2);
    assert.match(problems[0], /WH-001 is in progress/);
    assert.match(problems[1], /WH-002 is under review but not reviewed \(never reviewed\)/);
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
