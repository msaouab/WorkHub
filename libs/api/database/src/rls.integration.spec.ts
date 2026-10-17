import { config } from 'dotenv';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import pg from 'pg';

const serverDir = resolve(import.meta.dirname, '../../../../apps/server');
config({
  path: [resolve(serverDir, '.env.local'), resolve(serverDir, '.env')],
  quiet: true,
});

const ownerUrl = process.env.DATABASE_MIGRATION_URL;
const appUrl = process.env.DATABASE_URL;

const describeRls =
  ownerUrl && appUrl ? describe : describe.skip;

describeRls('workspace RLS (workhub_app)', () => {
  const owner = new pg.Client({ connectionString: ownerUrl });
  const app = new pg.Client({ connectionString: appUrl });

  const spaceA = randomUUID();
  const spaceB = randomUUID();
  const roleA = randomUUID();
  const roleB = randomUUID();
  const userA = randomUUID();
  const userB = randomUUID();
  const membershipA = randomUUID();
  const membershipB = randomUUID();

  beforeAll(async () => {
    await owner.connect();
    await app.connect();

    // Owner has BYPASSRLS — seed two isolated workspaces.
    await owner.query(
      `INSERT INTO users (id, name, email, email_verified, locale)
       VALUES
         ($1, 'RLS User A', $2, true, 'en'),
         ($3, 'RLS User B', $4, true, 'en')
       ON CONFLICT (id) DO NOTHING`,
      [userA, `rls-a-${userA}@workhub.test`, userB, `rls-b-${userB}@workhub.test`]
    );

    await owner.query(
      `INSERT INTO spaces (id, name, slug) VALUES
         ($1, 'Space A', $2),
         ($3, 'Space B', $4)`,
      [spaceA, `rls-a-${spaceA.slice(0, 8)}`, spaceB, `rls-b-${spaceB.slice(0, 8)}`]
    );

    await owner.query(
      `INSERT INTO roles (id, space_id, name, permissions, is_system) VALUES
         ($1, $2, 'Member', ARRAY['members.read'], true),
         ($3, $4, 'Member', ARRAY['members.read'], true)`,
      [roleA, spaceA, roleB, spaceB]
    );

    await owner.query(
      `UPDATE spaces SET default_role_id = $1 WHERE id = $2`,
      [roleA, spaceA]
    );
    await owner.query(
      `UPDATE spaces SET default_role_id = $1 WHERE id = $2`,
      [roleB, spaceB]
    );

    await owner.query(
      `INSERT INTO memberships (id, space_id, user_id, role_id, status) VALUES
         ($1, $2, $3, $4, 'active'),
         ($5, $6, $7, $8, 'active')`,
      [
        membershipA,
        spaceA,
        userA,
        roleA,
        membershipB,
        spaceB,
        userB,
        roleB,
      ]
    );
  });

  afterAll(async () => {
    await owner.query(`DELETE FROM spaces WHERE id = ANY($1::uuid[])`, [
      [spaceA, spaceB],
    ]);
    await owner.query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [
      [userA, userB],
    ]);
    await owner.end();
    await app.end();
  });

  async function asApp<T>(
    settings: { spaceId?: string; userId?: string },
    fn: (client: pg.Client) => Promise<T>
  ): Promise<T> {
    await app.query('BEGIN');
    try {
      if (settings.spaceId) {
        await app.query(`SELECT set_config('app.space_id', $1, true)`, [
          settings.spaceId,
        ]);
      }
      if (settings.userId) {
        await app.query(`SELECT set_config('app.user_id', $1, true)`, [
          settings.userId,
        ]);
      }
      const result = await fn(app);
      await app.query('COMMIT');
      return result;
    } catch (error) {
      await app.query('ROLLBACK');
      throw error;
    }
  }

  it('returns 0 rows when no tenant settings are set (fails closed)', async () => {
    const spaces = await asApp({}, (c) =>
      c.query(`SELECT id FROM spaces WHERE id = ANY($1::uuid[])`, [
        [spaceA, spaceB],
      ])
    );
    const roles = await asApp({}, (c) =>
      c.query(`SELECT id FROM roles WHERE id = ANY($1::uuid[])`, [
        [roleA, roleB],
      ])
    );
    const memberships = await asApp({}, (c) =>
      c.query(`SELECT id FROM memberships WHERE id = ANY($1::uuid[])`, [
        [membershipA, membershipB],
      ])
    );

    expect(spaces.rowCount).toBe(0);
    expect(roles.rowCount).toBe(0);
    expect(memberships.rowCount).toBe(0);
  });

  it('with app.space_id = A, workspace B rows are invisible', async () => {
    const spaces = await asApp({ spaceId: spaceA }, (c) =>
      c.query(`SELECT id FROM spaces WHERE id = ANY($1::uuid[])`, [
        [spaceA, spaceB],
      ])
    );
    const roles = await asApp({ spaceId: spaceA }, (c) =>
      c.query(`SELECT id, space_id FROM roles WHERE space_id = ANY($1::uuid[])`, [
        [spaceA, spaceB],
      ])
    );
    const memberships = await asApp({ spaceId: spaceA }, (c) =>
      c.query(
        `SELECT id, space_id FROM memberships WHERE space_id = ANY($1::uuid[])`,
        [[spaceA, spaceB]]
      )
    );

    expect(spaces.rows.map((r) => r.id)).toEqual([spaceA]);
    expect(roles.rows.map((r) => r.space_id)).toEqual([spaceA]);
    expect(memberships.rows.map((r) => r.space_id)).toEqual([spaceA]);
  });

  it('with app.user_id, the user sees only their own memberships and spaces', async () => {
    const memberships = await asApp({ userId: userA }, (c) =>
      c.query(`SELECT space_id FROM memberships ORDER BY space_id`)
    );
    const spaces = await asApp({ userId: userA }, (c) =>
      c.query(`SELECT id FROM spaces WHERE id = ANY($1::uuid[])`, [
        [spaceA, spaceB],
      ])
    );

    expect(memberships.rows.map((r) => r.space_id)).toEqual([spaceA]);
    expect(spaces.rows.map((r) => r.id)).toEqual([spaceA]);
  });
});
