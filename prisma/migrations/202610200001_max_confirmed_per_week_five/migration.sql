ALTER TABLE "system_configs"
ALTER COLUMN "max_confirmed_per_week" SET DEFAULT 5;

UPDATE "system_configs"
SET "max_confirmed_per_week" = 5, "updated_at" = CURRENT_TIMESTAMP
WHERE "max_confirmed_per_week" <> 5;
