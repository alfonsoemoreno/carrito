-- Existing recurring schedules remain unbounded and all generated shifts retain their IDs.
ALTER TABLE "shift_templates"
  ADD COLUMN "valid_from" DATE NOT NULL DEFAULT '1970-01-01',
  ADD COLUMN "valid_to" DATE;
DROP INDEX "shift_templates_zone_id_day_of_week_start_time_end_time_key";
CREATE UNIQUE INDEX "shift_templates_schedule_period_key"
  ON "shift_templates"("zone_id", "day_of_week", "start_time", "end_time", "valid_from");
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_valid_period"
  CHECK ("valid_to" IS NULL OR "valid_to" >= "valid_from");
