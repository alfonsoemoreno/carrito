ALTER TABLE "zones"
  ADD COLUMN "address" VARCHAR(250),
  ADD COLUMN "latitude" DOUBLE PRECISION,
  ADD COLUMN "longitude" DOUBLE PRECISION,
  ADD COLUMN "map_color" VARCHAR(7) NOT NULL DEFAULT '#2563eb';

ALTER TABLE "zones" ADD CONSTRAINT "zones_coordinates_check" CHECK (
  ("latitude" IS NULL AND "longitude" IS NULL) OR
  ("latitude" IS NOT NULL AND "longitude" IS NOT NULL AND
    "latitude" BETWEEN -90 AND 90 AND "longitude" BETWEEN -180 AND 180)
);
