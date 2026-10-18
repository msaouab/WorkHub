/**
 * Pure checks used by `pnpm quality`. No I/O here, so they're unit-tested.
 * Must run on the shell's default Node (git hooks don't use .nvmrc): no Node 21+ APIs.
 */

/**
 * Commit gate: every ticket we worked on must be finished and reviewed.
 * - no ticket may be `in progress` (finish it, or move it back to `start`);
 * - every `under-review` ticket must have been reviewed since its last change.
 */
export function gateProblems(tickets, pending) {
  const problems = [];
  for (const ticket of tickets) {
    if (ticket.status === 'in progress') {
      problems.push(`${ticket.id} is in progress: finish it (under-review + review) or move it back to start`);
    }
  }
  for (const { ticket, reason } of pending) {
    problems.push(`${ticket.id} is under review but not reviewed (${reason})`);
  }
  return problems;
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
