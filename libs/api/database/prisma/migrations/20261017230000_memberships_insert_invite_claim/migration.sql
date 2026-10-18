-- WH-010: stop self-insert into any workspace via app.user_id alone.
-- Accept claims a use first (uses incremented), then inserts membership under
-- app.invite_token_hash. Space create still uses app.space_id.

DROP POLICY memberships_insert ON "memberships";

CREATE POLICY memberships_insert ON "memberships"
  FOR INSERT
  WITH CHECK (
    space_id = NULLIF(current_setting('app.space_id', true), '')::uuid
    OR (
      NULLIF(current_setting('app.invite_token_hash', true), '') IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM "invites" i
        WHERE i.token_hash = NULLIF(current_setting('app.invite_token_hash', true), '')
          AND i.space_id = memberships.space_id
          AND i.role_id = memberships.role_id
          AND i.revoked_at IS NULL
          AND i.expires_at > now()
          AND i.uses >= 1
          AND i.uses <= i.max_uses
      )
    )
  );
