import { apiURL, baseURL } from './env.js';

async function probe(
  url: string,
  options: { requireOk?: boolean } = {}
): Promise<boolean> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(2_000),
      redirect: 'follow',
    });
    if (options.requireOk) {
      return response.ok;
    }
    // Any response means the process is listening (404/307 still count).
    return response.status > 0;
  } catch {
    return false;
  }
}

async function waitUntil(
  url: string,
  label: string,
  options: { requireOk?: boolean } = {},
  attempts = 10
): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    if (await probe(url, options)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `${label} is not reachable at ${url}. Start \`pnpm dev\` first.`
  );
}

/**
 * Local e2e expects `pnpm dev` (client + API). Do not auto-start a second
 * Nest process beside an already-running stack (WH-072).
 */
export async function assertDevStackReachable(): Promise<void> {
  await waitUntil(`${apiURL}/health/live`, 'API', { requireOk: true });
  await waitUntil(baseURL, 'Web app');
}
