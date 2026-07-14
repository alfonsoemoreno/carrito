ALTER TABLE "system_configs"
ALTER COLUMN "allow_multiple_per_day" SET DEFAULT true;

UPDATE "system_configs"
SET "allow_multiple_per_day" = true
WHERE "allow_multiple_per_day" = false;
