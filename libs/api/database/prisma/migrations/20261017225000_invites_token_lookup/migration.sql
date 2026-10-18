-- Allow reading an invite by token hash for preview/accept (no space membership).
-- The API sets app.invite_token_hash for the transaction; plaintext never hits the DB.

CREATE POLICY invites_select_by_token ON "invites"
  FOR SELECT
  USING (
    token_hash = NULLIF(current_setting('app.invite_token_hash', true), '')
  );

-- Accept increments uses under the same token-hash context.
CREATE POLICY invites_update_by_token ON "invites"
  FOR UPDATE
  USING (
    token_hash = NULLIF(current_setting('app.invite_token_hash', true), '')
  )
  WITH CHECK (
    token_hash = NULLIF(current_setting('app.invite_token_hash', true), '')
  );

-- Preview/accept need space name and role name without prior membership.
CREATE POLICY spaces_select_by_invite_token ON "spaces"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM "invites" i
      WHERE i.space_id = spaces.id
        AND i.token_hash = NULLIF(current_setting('app.invite_token_hash', true), '')
    )
  );

CREATE POLICY roles_select_by_invite_token ON "roles"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM "invites" i
      WHERE i.role_id = roles.id
        AND i.token_hash = NULLIF(current_setting('app.invite_token_hash', true), '')
    )
  );
