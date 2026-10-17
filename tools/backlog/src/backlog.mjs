/**
 * Parses and checks BACKLOG.md: ticket statuses, section placement, priority order,
 * and the review tracker. Pure functions (no file access) so they are easy to test.
 */

export const STATUSES = ['start', 'in progress', 'under-review', 'done'];

/** Which `## Section` each active status must live in. `done` tickets live in the Done table only. */
export const SECTION_FOR_STATUS = {
  'under-review': 'Under review',
  'in progress': 'In progress',
  start: 'Start',
};

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

/** Ticket IDs already recorded as done in the "Done" table. */
export function parseDoneTable(markdown) {
  const start = markdown.indexOf('## Done');
  if (start === -1) return [];
  return [...markdown.slice(start).matchAll(/^\| (WH-\d+)/gm)].map((match) => match[1]);
}

/** Every rule the workflow depends on. Returns a list of human-readable problems (empty = valid). */
export function validate(markdown) {
  const problems = [];
  const tickets = parseTickets(markdown);
  const done = new Set(parseDoneTable(markdown));
  const seen = new Set();

  for (const ticket of tickets) {
    const label = `${ticket.id} (${ticket.title})`;
    if (seen.has(ticket.id)) problems.push(`${label}: duplicate ticket ID`);
    seen.add(ticket.id);

    if (!STATUSES.includes(ticket.status)) {
      problems.push(`${label}: unknown status "${ticket.status}" (use: ${STATUSES.join(', ')})`);
      continue;
    }
    if (ticket.status === 'done') {
      problems.push(`${label}: status is done; remove the ticket and add a row to the Done table`);
      continue;
    }
    if (done.has(ticket.id)) {
      problems.push(`${label}: listed in the Done table but still active`);
    }
    const expected = SECTION_FOR_STATUS[ticket.status];
    if (ticket.section !== expected) {
      problems.push(`${label}: status "${ticket.status}" belongs in "## ${expected}", found in "## ${ticket.section}"`);
    }
    if (ticket.priority === null) problems.push(`${label}: missing Type/Priority/Status line`);
  }

  for (const section of Object.values(SECTION_FOR_STATUS)) {
    const priorities = tickets.filter((t) => t.section === section).map((t) => t.priority);
    priorities.forEach((priority, i) => {
      if (i > 0 && priority < priorities[i - 1]) {
        problems.push(`"## ${section}" is not ordered by priority (P${priority} after P${priorities[i - 1]})`);
      }
    });
  }

  const underReview = tickets.filter((t) => t.status === 'under-review').map((t) => t.id).sort();
  const tracked = [...new Set(parseReviewTracker(markdown))].sort();
  for (const id of underReview) {
    if (!tracked.includes(id)) problems.push(`${id}: under-review but missing from the Review tracker`);
  }
  for (const id of tracked) {
    if (!underReview.includes(id)) problems.push(`${id}: in the Review tracker but not under-review`);
  }

  return [...new Set(problems)];
}
