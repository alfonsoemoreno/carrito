-- Reactivating one occurrence must not reopen the rest of a place-wide suspension.
ALTER TABLE "shift_blocks" ADD COLUMN "excluded_shift_ids" UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];
