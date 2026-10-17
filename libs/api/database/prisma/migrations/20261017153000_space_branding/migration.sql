-- WH-047: workspace logo + cover branding
ALTER TABLE "spaces" ADD COLUMN "logo_key" TEXT;
ALTER TABLE "spaces" ADD COLUMN "cover_key" TEXT;
ALTER TABLE "spaces" ADD COLUMN "cover_preset" TEXT;
ALTER TABLE "spaces" ADD COLUMN "cover_position_y" SMALLINT NOT NULL DEFAULT 50;

ALTER TABLE "spaces" ADD CONSTRAINT "spaces_cover_position_y_check"
  CHECK ("cover_position_y" >= 0 AND "cover_position_y" <= 100);

ALTER TABLE "spaces" ADD CONSTRAINT "spaces_cover_xor_check"
  CHECK (NOT ("cover_key" IS NOT NULL AND "cover_preset" IS NOT NULL));
