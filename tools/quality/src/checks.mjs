/**
 * Pure checks used by `pnpm quality`. No I/O here, so they're unit-tested.
 * Must run on the shell's default Node (git hooks don't use .nvmrc): no Node 21+ APIs.
 */

/**
 * Commit gate (flow: start → in progress → under-review → done → commit → delete):
 * every ticket we worked on must be reviewed and `done` before the commit, so no
 * ticket may still be `in progress` or `under-review`.
 */
export function gateProblems(tickets) {
  const problems = [];
  for (const ticket of tickets) {
    if (ticket.status === 'in progress') {
      problems.push(`${ticket.id} is in progress: finish it and set it to under-review, or move it back to start`);
    } else if (ticket.status === 'under-review') {
      problems.push(`${ticket.id} is under review: wait for the review (done, or back to in progress with feedback)`);
    }
  }
  return problems;
}

/**
 * Push gate: only finished work leaves the machine. Tickets are deleted from
 * BACKLOG.md once done, so a commit being pushed must not name a ticket that is
 * still `in progress` or `under-review` (commit → review closes it → push).
 * Work not in the outgoing commits (e.g. tickets just started) doesn't block.
 */
export function pushGateProblems(tickets, outgoingTicketIds) {
  const outgoing = new Set(outgoingTicketIds);
  return tickets
    .filter((ticket) => outgoing.has(ticket.id))
    .filter((ticket) => ticket.status === 'in progress' || ticket.status === 'under-review')
    .map((ticket) => `${ticket.id} is ${ticket.status} but an outgoing commit names it: push once it's reviewed and done (deleted from BACKLOG.md)`);
}

/** Ticket IDs (`WH-123`) mentioned in commit messages. */
export function ticketIdsInMessages(messages) {
  return [...new Set(messages.match(/\bWH-\d{3,}\b/g) ?? [])];
}

/** Every leaf key path of a next-intl messages object, e.g. `Shell.spaceNav.home`. */
export function messageKeyPaths(messages, prefix = []) {
  const paths = [];
  for (const [key, value] of Object.entries(messages)) {
    const path = [...prefix, key];
    if (value !== null && typeof value === 'object') {
      paths.push(...messageKeyPaths(value, path));
    } else {
      paths.push(path.join('.'));
    }
  }
  return paths;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Keys whose last segment never appears as a quoted string in the code.
 * A key also counts as used when its parent is read dynamically (`t(\`parent.${x}\`)`)
 * or when it matches an allowlisted prefix (keys read with a variable, e.g. `t(locale)`).
 * Heuristic by design: it can miss an unused key, but it doesn't flag a used one.
 */
export function findUnusedMessageKeys(messages, code, allowPrefixes = []) {
  return messageKeyPaths(messages).filter((path) => {
    if (allowPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}.`))) {
      return false;
    }
    const segments = path.split('.');
    const leaf = escapeRegExp(segments[segments.length - 1]);
    const quoted = new RegExp(`['"\`]([\\w.]*\\.)?${leaf}['"\`]`);
    if (quoted.test(code)) {
      return false;
    }
    const parent = segments[segments.length - 2];
    if (parent) {
      const dynamic = new RegExp(`['"\`]([\\w.]*\\.)?${escapeRegExp(parent)}\\.\\$\\{`);
      if (dynamic.test(code)) {
        return false;
      }
    }
    return true;
  });
}

/** One line per step, for the final summary. */
export function summaryLine({ label, status, seconds }) {
  const icon = status === 'pass' ? '✓' : status === 'warn' ? '!' : '✗';
  return `  ${icon} ${label.padEnd(44)} ${seconds.toFixed(1).padStart(5)}s`;
}
