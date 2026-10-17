import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEV_PORTS,
  commandMentionsRepo,
  formatBusyPorts,
  isWorkHubDevProcess,
  nodeVersionError,
  parseLsofListen,
  pathIsUnderRepo,
  planReset,
  shortCommand,
  uniqueListeners,
} from './dev.mjs';

const repo = '/Users/me/Projects/msaouab/WorkHub';

// Real `ps -ww -o command=` lines from a local `pnpm dev` (2026-10-17).
const NEXT_SERVER_PS = 'next-server (v16.1.7)';
const NX_SERVE_PS =
  '/Users/me/.nvm/versions/node/v22.12.0/bin/node --inspect=localhost:9229 ' +
  `${repo}/node_modules/@nx/js/dist/src/executors/node/node-with-esm-loader.js`;

describe('pathIsUnderRepo', () => {
  it('matches the root and nested paths only', () => {
    assert.equal(pathIsUnderRepo(repo, repo), true);
    assert.equal(pathIsUnderRepo(`${repo}/apps/client`, repo), true);
    assert.equal(pathIsUnderRepo('/Users/me/Projects/other', repo), false);
    assert.equal(pathIsUnderRepo(`${repo}-fork`, repo), false);
    assert.equal(pathIsUnderRepo('', repo), false);
  });
});

describe('commandMentionsRepo', () => {
  it('requires a path separator so sibling checkouts do not match', () => {
    assert.equal(
      commandMentionsRepo(`node ${repo}/node_modules/next/dist/bin/next dev`, repo),
      true
    );
    assert.equal(
      commandMentionsRepo(
        `node ${repo}-fork/node_modules/next/dist/bin/next dev`,
        repo
      ),
      false
    );
    assert.equal(commandMentionsRepo(`node ${repo}`, repo), false);
  });
});

describe('isWorkHubDevProcess', () => {
  it('accepts Next/Nx under this repo (including real ps lines)', () => {
    assert.equal(
      isWorkHubDevProcess({
        repoRoot: repo,
        cwd: `${repo}/apps/client`,
        command: `${repo}/apps/client/node_modules/next/dist/bin/next dev`,
      }),
      true
    );
    assert.equal(
      isWorkHubDevProcess({
        repoRoot: repo,
        cwd: repo,
        command: NEXT_SERVER_PS,
      }),
      true
    );
    assert.equal(
      isWorkHubDevProcess({
        repoRoot: repo,
        cwd: repo,
        command: NX_SERVE_PS,
      }),
      true
    );
    assert.equal(
      isWorkHubDevProcess({
        repoRoot: repo,
        cwd: '',
        command: NX_SERVE_PS,
      }),
      true
    );
  });

  it('refuses foreign listeners even when cwd is under the repo', () => {
    assert.equal(
      isWorkHubDevProcess({
        repoRoot: repo,
        cwd: repo,
        command: 'python3 -m http.server 3000',
      }),
      false
    );
  });

  it('refuses WorkHub-looking commands from another checkout', () => {
    assert.equal(
      isWorkHubDevProcess({
        repoRoot: repo,
        cwd: '/Users/me/Projects/other',
        command: '/Users/me/Projects/other/node_modules/next/dist/bin/next dev',
      }),
      false
    );
    assert.equal(
      isWorkHubDevProcess({
        repoRoot: repo,
        cwd: `${repo}-fork`,
        command: `node ${repo}-fork/node_modules/next/dist/bin/next dev`,
      }),
      false
    );
  });
});

describe('planReset', () => {
  it('kills only WorkHub listeners and lists the rest', () => {
    const { kill, refuse } = planReset(
      [
        {
          port: 3000,
          pid: 11,
          cwd: `${repo}/apps/client`,
          command: `${repo}/node_modules/next/dist/bin/next dev`,
        },
        {
          port: 3333,
          pid: 22,
          cwd: '/tmp',
          command: 'python3 -m http.server 3333',
        },
      ],
      repo
    );
    assert.deepEqual(
      kill.map((l) => l.pid),
      [11]
    );
    assert.deepEqual(
      refuse.map((l) => l.pid),
      [22]
    );
  });

  it('dedupes the same pid on several ports', () => {
    const { kill } = planReset(
      [
        {
          port: 3333,
          pid: 99,
          cwd: repo,
          command: `${repo}/node_modules/webpack/bin/webpack.js`,
        },
        {
          port: 9229,
          pid: 99,
          cwd: repo,
          command: `${repo}/node_modules/webpack/bin/webpack.js`,
        },
      ],
      repo
    );
    assert.equal(kill.length, 1);
    assert.equal(kill[0].pid, 99);
  });
});

describe('parseLsofListen', () => {
  it('reads pid and port from macOS lsof LISTEN lines', () => {
    const stdout = [
      'COMMAND   PID    USER   FD   TYPE             DEVICE SIZE/OFF NODE NAME',
      'node    50013 msaouab   16u  IPv6 0xabc      0t0  TCP *:3000 (LISTEN)',
      'node     8936 msaouab   21u  IPv4 0xdef      0t0  TCP 127.0.0.1:3333 (LISTEN)',
    ].join('\n');
    assert.deepEqual(parseLsofListen(stdout), [
      { pid: 50013, port: 3000 },
      { pid: 8936, port: 3333 },
    ]);
  });

  it('dedupes the same pid+port on IPv4 and IPv6', () => {
    const stdout = [
      'COMMAND  PID USER FD TYPE DEVICE SIZE/OFF NODE NAME',
      'node    3158 me   22u IPv6 0x1 0t0 TCP *:9229 (LISTEN)',
      'node    3158 me   23u IPv4 0x2 0t0 TCP *:9229 (LISTEN)',
    ].join('\n');
    assert.deepEqual(parseLsofListen(stdout), [{ pid: 3158, port: 9229 }]);
  });
});

describe('uniqueListeners', () => {
  it('keeps one row per pid and port', () => {
    assert.deepEqual(
      uniqueListeners([
        { pid: 1, port: 9229, command: 'a' },
        { pid: 1, port: 9229, command: 'a' },
        { pid: 1, port: 3333, command: 'a' },
      ]),
      [
        { pid: 1, port: 9229, command: 'a' },
        { pid: 1, port: 3333, command: 'a' },
      ]
    );
  });
});

describe('shortCommand', () => {
  it('summarises Next, Nx and webpack lines', () => {
    assert.equal(shortCommand(NEXT_SERVER_PS), 'node (next dev)');
    assert.equal(
      shortCommand(
        '/Users/me/.nvm/versions/node/v20.19.4/bin/node -r source-map-support/register .../next/dist/bin/next dev'
      ),
      'node (next dev)'
    );
    assert.equal(
      shortCommand('node .../nx/dist/bin/nx.js serve server'),
      'node (nx serve server)'
    );
    assert.equal(shortCommand(NX_SERVE_PS), 'node (nx serve server)');
    assert.equal(
      shortCommand('node -r .../source-map-support/register .../webpack.js'),
      'node (webpack / Nest API)'
    );
  });
});

describe('formatBusyPorts', () => {
  it('tells the user to run dev:reset with a short command', () => {
    const text = formatBusyPorts([
      {
        port: 9229,
        pid: 3158,
        command:
          '/Users/me/.nvm/versions/node/v20.19.4/bin/node -r .../source-map-support/register .../nx.js serve server',
      },
      {
        port: 9229,
        pid: 3158,
        command:
          '/Users/me/.nvm/versions/node/v20.19.4/bin/node -r .../source-map-support/register .../nx.js serve server',
      },
    ]);
    assert.match(text, /:9229 {2}pid 3158 {2}node \(nx serve server\)/);
    assert.equal([...text.matchAll(/:9229/g)].length, 1);
    assert.match(text, /pnpm dev:reset/);
  });
});

describe('nodeVersionError', () => {
  it('accepts Node 22.12+ and rejects older versions', () => {
    assert.equal(nodeVersionError('22.12.0'), null);
    assert.equal(nodeVersionError('23.0.0'), null);
    assert.match(nodeVersionError('20.19.4'), /too old/);
    assert.match(nodeVersionError('22.11.0'), /too old/);
  });
});

describe('DEV_PORTS', () => {
  it('covers client, API and the Nest inspector', () => {
    assert.deepEqual(DEV_PORTS, [3000, 3333, 9229]);
  });
});
