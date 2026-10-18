/**
 * Parses and checks BACKLOG.md: one `## Tickets` list sorted by priority, valid statuses,
 * and a review tracker that matches the tickets under review. Also decides which
 * `under-review` tickets need (re)review. Pure functions (no file or git access) so they
 * are easy to test.
 */
import { createHash } from 'node:crypto';

/**
 * Every status, in list order: within a priority, tickets are sorted
 * start → in progress → under-review → done. A ticket is deleted only after the
 * commit that carries it as `done` (see `committedDoneTickets`).
 */
export const STATUSES = ['start', 'in progress', 'under-review', 'done'];

/** Negative when `a` must come before `b`: priority first (P0 first), then status. */
export function compareOrder(a, b) {
  return a.priority - b.priority || STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status);
}

export const TICKETS_SECTION = 'Tickets';

/** Split the markdown into tickets, remembering the `## Section` each one sits in. */
export function parseTickets(markdown) {
  const tickets = [];
  let section = null;
  let current = null;

  for (const line of markdown.split('\n')) {
    const sectionMatch = /^## (.+)$/.exec(line);
    const ticketMatch = /^### (WH-\d+) · (.+)$/.exec(line);
    if (sectionMatch || ticketMatch) {
      if (current) tickets.push(current);
      current = null;
    }
    if (sectionMatch) {
      section = sectionMatch[1].trim();
      continue;
    }
    if (ticketMatch) {
      current = { id: ticketMatch[1], title: ticketMatch[2].trim(), section, lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) tickets.push(current);

  return tickets.map(({ lines, ...ticket }) => {
    const text = lines.join('\n');
    const meta = /\*\*Type:\*\* ([^·\n]+)·\s*\*\*Priority:\*\* P(\d)[^·\n]*·\s*\*\*Status:\*\* ([^·\n]+)/.exec(text);
    return {
      ...ticket,
      text,
      type: meta?.[1].trim() ?? null,
      priority: meta ? Number(meta[2]) : null,
      status: meta?.[3].trim() ?? null,
      openItems: (text.match(/^\s*- \[ \]/gm) ?? []).length,
      blockedBy: /\*\*Blocked by:\*\* (WH-\d+)/.exec(text)?.[1] ?? null,
    };
  });
}

/** Ticket IDs listed in the "Review tracker" table. */
export function parseReviewTracker(markdown) {
  const start = markdown.indexOf('## Review tracker');
  if (start === -1) return [];
  const end = markdown.indexOf('\n## ', start + 1);
  const table = markdown.slice(start, end === -1 ? undefined : end);
  return [...table.matchAll(/^\| (WH-\d+)/gm)].map((match) => match[1]);
}

/** Every rule the workflow depends on. Returns human-readable problems (empty = valid). */
export function validate(markdown) {
  const problems = [];
  const tickets = parseTickets(markdown);
  const seen = new Set();

  for (const ticket of tickets) {
    const label = `${ticket.id} (${ticket.title})`;
    if (seen.has(ticket.id)) problems.push(`${label}: duplicate ticket ID`);
    seen.add(ticket.id);

    if (ticket.section !== TICKETS_SECTION) {
      problems.push(`${label}: must be under "## ${TICKETS_SECTION}", found under "## ${ticket.section}"`);
    }
    if (ticket.priority === null) {
      problems.push(`${label}: missing Type/Priority/Status line`);
      continue;
    }
    if (!STATUSES.includes(ticket.status)) {
      problems.push(`${label}: unknown status "${ticket.status}" (use: ${STATUSES.join(', ')})`);
    }
  }

  const listed = tickets.filter(
    (t) => t.section === TICKETS_SECTION && t.priority !== null && STATUSES.includes(t.status)
  );
  listed.forEach((ticket, i) => {
    const previous = listed[i - 1];
    if (previous && compareOrder(ticket, previous) < 0) {
      problems.push(
        `${ticket.id} (P${ticket.priority}, ${ticket.status}) comes after ${previous.id} (P${previous.priority}, ${previous.status}): sort by priority, then status (${STATUSES.join(' → ')})`
      );
    }
  });

  const nextFree = /next free is WH-(\d+)/.exec(markdown);
  const highest = Math.max(0, ...tickets.map((t) => Number(t.id.slice(3))));
  if (nextFree && Number(nextFree[1]) <= highest) {
    problems.push(`"next free is WH-${nextFree[1]}" is already used (highest ID is WH-${String(highest).padStart(3, '0')}): bump it`);
  }

  const underReview = tickets.filter((t) => t.status === 'under-review').map((t) => t.id).sort();
  const tracked = [...new Set(parseReviewTracker(markdown))].sort();
  for (const id of underReview) {
    if (!tracked.includes(id)) problems.push(`${id}: under-review but missing from the Review tracker`);
  }
  for (const id of tracked) {
    if (!underReview.includes(id)) problems.push(`${id}: in the Review tracker but not under-review (delete its row)`);
  }

  return [...new Set(problems)];
}

/**
 * `done` tickets that are already committed as `done` (also `done` in HEAD's BACKLOG.md):
 * the commit carried them, so they can now be deleted. Their history stays in git.
 */
export function committedDoneTickets(tickets, headMarkdown) {
  if (!headMarkdown) return [];
  const doneAtHead = new Set(parseTickets(headMarkdown).filter((t) => t.status === 'done').map((t) => t.id));
  return tickets.filter((t) => t.status === 'done' && doneAtHead.has(t.id));
}

/**
 * The next implementation: the first `start` ticket(s) in list order (priority, then
 * planned order), moved to `in progress` right after a commit closes the done tickets.
 */
export function nextStartTickets(tickets, count = 1) {
  return tickets.filter((t) => t.status === 'start').slice(0, count);
}

/**
 * What a review of `ticket` was based on: its text plus the commit it was reviewed at.
 * A ticket needs review again when either changes: the user edited it (moved it to
 * under-review, ticked items, added notes), or new work was committed. Only committed
 * work can become `done`, so uncommitted edits alone don't re-trigger a review.
 */
export function ticketFingerprint(ticket, head) {
  // Ignore whitespace-only differences (blank lines, trailing spaces), so re-sorting or
  // reformatting the file doesn't look like a change to the ticket.
  const content = ticket.text.split('\n').map((line) => line.trimEnd()).filter(Boolean).join('\n');
  return createHash('sha256').update(`${head}\n${ticket.id}\n${content}`).digest('hex').slice(0, 16);
}

/**
 * `under-review` tickets whose fingerprint differs from the last recorded review.
 * `state.reviewed` maps ticket ID → { fingerprint, at }.
 */
export function pendingReviews(tickets, head, state = {}) {
  const reviewed = state.reviewed ?? {};
  return tickets
    .filter((t) => t.status === 'under-review')
    .flatMap((t) => {
      const last = reviewed[t.id];
      if (!last) return [{ ticket: t, reason: 'never reviewed' }];
      if (last.fingerprint !== ticketFingerprint(t, head)) {
        return [{ ticket: t, reason: `changed since review on ${last.at}` }];
      }
      return [];
    });
}

/** Record that `ids` were reviewed at `head`. Returns a new state object. */
export function markReviewed(state, tickets, ids, head, at) {
  const reviewed = { ...(state.reviewed ?? {}) };
  for (const t of tickets) {
    if (ids.includes(t.id)) reviewed[t.id] = { fingerprint: ticketFingerprint(t, head), at };
  }
  // Forget tickets that are no longer under review (done = deleted, or sent back).
  const active = new Set(tickets.filter((t) => t.status === 'under-review').map((t) => t.id));
  for (const id of Object.keys(reviewed)) if (!active.has(id)) delete reviewed[id];
  return { ...state, reviewed };
}

/**
 * Text injected into Claude's context by the Claude Code hooks, or null when there's
 * nothing to say (so `prompt` hooks stay silent on most turns).
 */
export function hookContext({ event, tickets, problems, pending, committedDone = [] }) {
  const queue = tickets.filter((t) => t.status === 'under-review');
  const quiet = pending.length === 0 && problems.length === 0 && committedDone.length === 0;
  if (event === 'prompt' && quiet) return null;
  if (event === 'session-start' && queue.length === 0 && quiet) return null;

  const lines = ['[WorkHub backlog tracker]'];
  if (pending.length) {
    lines.push(`${pending.length} under-review ticket(s) need review per BACKLOG.md "Review rules":`);
    for (const { ticket, reason } of pending) lines.push(`- ${ticket.id} (P${ticket.priority}) ${ticket.title}: ${reason}`);
    lines.push(
      'For each: check acceptance criteria + Definition of Done (code, `pnpm quality`, running app).',
      'Correct and passing with no feedback → set its status to `done` (keep it in the file until it is committed), delete its tracker row, and give the user a commit message for the done tickets.',
      'Otherwise → set its status to `in progress`, add a dated 🔁 Review entry with a checklist, and delete its tracker row.',
      'Then run `pnpm backlog` (must print ✓). Tell the user what you found.'
    );
  } else if (event === 'session-start' && queue.length) {
    lines.push(`${queue.length} ticket(s) under review, all reviewed since their last change: ${queue.map((t) => t.id).join(', ')}.`);
  }
  if (committedDone.length) {
    const next = nextStartTickets(tickets);
    lines.push(
      `${committedDone.length} done ticket(s) are committed (done in HEAD's BACKLOG.md): delete them from BACKLOG.md now: ${committedDone.map((t) => t.id).join(', ')}.`,
      `Then move the next implementation from \`start\` to \`in progress\` (first start ticket by priority and planned order${next.length ? `: ${next.map((t) => t.id).join(', ')}` : ''}), and tell the user what's next.`
    );
  }
  if (problems.length) {
    lines.push(`BACKLOG.md breaks ${problems.length} workflow rule(s); fix them:`);
    for (const problem of problems) lines.push(`- ${problem}`);
  }
  return lines.join('\n');
}
