-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PersonGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "PersonStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('ADMIN', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "AdminStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('MARRIAGE', 'PARENT_CHILD', 'ADMIN_EXCEPTION');

-- CreateEnum
CREATE TYPE "RelationshipDirection" AS ENUM ('BIDIRECTIONAL', 'PARENT_TO_CHILD', 'CHILD_TO_PARENT');

-- CreateEnum
CREATE TYPE "ZoneStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TemplateStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('OPEN', 'BLOCKED', 'FULL', 'CLOSED');

-- CreateEnum
CREATE TYPE "ShiftBlockType" AS ENUM ('SPECIFIC_SHIFT', 'FULL_DATE', 'ZONE', 'DATE_RANGE');

-- CreateEnum
CREATE TYPE "ShiftRequestStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'REPLACED');

-- CreateEnum
CREATE TYPE "HistoryVisibility" AS ENUM ('THREE_MONTHS', 'SIX_MONTHS', 'ONE_YEAR', 'TWO_YEARS', 'UNLIMITED');

-- CreateEnum
CREATE TYPE "AuditActorType" AS ENUM ('ADMIN', 'PUBLIC_PERSON', 'SYSTEM');

-- CreateTable
CREATE TABLE "people" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "gender" "PersonGender" NOT NULL,
    "status" "PersonStatus" NOT NULL DEFAULT 'ACTIVE',
    "phone" VARCHAR(30),
    "email" VARCHAR(255),
    "notes" TEXT,
    "pin_hash" TEXT NOT NULL,
    "failed_pin_attempts" INTEGER NOT NULL DEFAULT 0,
    "pin_locked_until" TIMESTAMPTZ(6),
    "pin_updated_at" TIMESTAMPTZ(6),
    "last_participation_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_users" (
    "id" UUID NOT NULL,
    "auth_provider_id" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "status" "AdminStatus" NOT NULL DEFAULT 'ACTIVE',
    "display_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "admin_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" UUID NOT NULL,
    "person_a_id" UUID NOT NULL,
    "person_b_id" UUID NOT NULL,
    "type" "RelationshipType" NOT NULL,
    "direction" "RelationshipDirection" NOT NULL DEFAULT 'BIDIRECTIONAL',
    "notes" TEXT,
    "created_by_admin_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zones" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ZoneStatus" NOT NULL DEFAULT 'ACTIVE',
    "public_visible" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "zones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_templates" (
    "id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "status" "TemplateStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shift_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shifts" (
    "id" UUID NOT NULL,
    "zone_id" UUID NOT NULL,
    "template_id" UUID,
    "shift_date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "status" "ShiftStatus" NOT NULL DEFAULT 'OPEN',
    "generated" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "shifts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_blocks" (
    "id" UUID NOT NULL,
    "zone_id" UUID,
    "shift_id" UUID,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "block_type" "ShiftBlockType" NOT NULL,
    "reason" TEXT NOT NULL,
    "created_by_admin_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shift_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "availability_exceptions" (
    "id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "reason" TEXT NOT NULL,
    "notes" TEXT,
    "created_by_admin_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "availability_exceptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shift_requests" (
    "id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "person_id" UUID NOT NULL,
    "suggested_partner_id" UUID,
    "status" "ShiftRequestStatus" NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    "cancelled_at" TIMESTAMPTZ(6),
    "resolved_at" TIMESTAMPTZ(6),

    CONSTRAINT "shift_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "person_1_id" UUID NOT NULL,
    "person_2_id" UUID NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "rule_exception_used" BOOLEAN NOT NULL DEFAULT false,
    "exception_reason" TEXT,
    "decided_by_admin_id" UUID,
    "confirmed_at" TIMESTAMPTZ(6),
    "cancelled_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_configs" (
    "id" UUID NOT NULL,
    "config_key" TEXT NOT NULL DEFAULT 'default',
    "congregation_name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "system_name" TEXT NOT NULL,
    "visible_weeks" INTEGER NOT NULL DEFAULT 6,
    "generate_future_weeks" INTEGER NOT NULL DEFAULT 8,
    "pin_min_length" INTEGER NOT NULL DEFAULT 4,
    "pin_max_length" INTEGER NOT NULL DEFAULT 8,
    "pin_max_attempts" INTEGER NOT NULL DEFAULT 5,
    "pin_lock_minutes" INTEGER NOT NULL DEFAULT 15,
    "max_requests_per_week" INTEGER NOT NULL DEFAULT 4,
    "max_confirmed_per_week" INTEGER NOT NULL DEFAULT 2,
    "max_confirmed_per_month" INTEGER NOT NULL DEFAULT 6,
    "allow_consecutive_days" BOOLEAN NOT NULL DEFAULT false,
    "allow_multiple_per_day" BOOLEAN NOT NULL DEFAULT false,
    "allow_overlapping" BOOLEAN NOT NULL DEFAULT false,
    "allow_same_sex_pairing" BOOLEAN NOT NULL DEFAULT true,
    "history_visibility" "HistoryVisibility" NOT NULL DEFAULT 'ONE_YEAR',
    "show_participants_publicly" BOOLEAN NOT NULL DEFAULT false,
    "show_pending_requests_publicly" BOOLEAN NOT NULL DEFAULT false,
    "show_full_shifts_publicly" BOOLEAN NOT NULL DEFAULT true,
    "show_open_shifts_publicly" BOOLEAN NOT NULL DEFAULT true,
    "show_history_publicly" BOOLEAN NOT NULL DEFAULT false,
    "maintenance_mode_enabled" BOOLEAN NOT NULL DEFAULT false,
    "updated_by_admin_id" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "system_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "actor_type" "AuditActorType" NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "actor_admin_id" UUID,
    "actor_person_id" UUID,
    "before_data" JSONB,
    "after_data" JSONB,
    "meta" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "people_status_idx" ON "people"("status");

-- CreateIndex
CREATE INDEX "people_last_name_first_name_idx" ON "people"("last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_auth_provider_id_key" ON "admin_users"("auth_provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- CreateIndex
CREATE INDEX "admin_users_role_status_idx" ON "admin_users"("role", "status");

-- CreateIndex
CREATE INDEX "relationships_type_idx" ON "relationships"("type");

-- CreateIndex
CREATE UNIQUE INDEX "relationships_person_a_id_person_b_id_type_key" ON "relationships"("person_a_id", "person_b_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "zones_name_key" ON "zones"("name");

-- CreateIndex
CREATE INDEX "zones_status_public_visible_idx" ON "zones"("status", "public_visible");

-- CreateIndex
CREATE INDEX "shift_templates_zone_id_status_idx" ON "shift_templates"("zone_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "shift_templates_zone_id_day_of_week_start_time_end_time_key" ON "shift_templates"("zone_id", "day_of_week", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "shifts_shift_date_status_idx" ON "shifts"("shift_date", "status");

-- CreateIndex
CREATE INDEX "shifts_zone_id_shift_date_idx" ON "shifts"("zone_id", "shift_date");

-- CreateIndex
CREATE UNIQUE INDEX "shifts_zone_id_shift_date_start_time_end_time_key" ON "shifts"("zone_id", "shift_date", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "shift_blocks_block_type_start_date_end_date_idx" ON "shift_blocks"("block_type", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "shift_blocks_zone_id_start_date_idx" ON "shift_blocks"("zone_id", "start_date");

-- CreateIndex
CREATE INDEX "shift_blocks_shift_id_idx" ON "shift_blocks"("shift_id");

-- CreateIndex
CREATE INDEX "availability_exceptions_person_id_start_date_end_date_idx" ON "availability_exceptions"("person_id", "start_date", "end_date");

-- CreateIndex
CREATE INDEX "shift_requests_shift_id_status_idx" ON "shift_requests"("shift_id", "status");

-- CreateIndex
CREATE INDEX "shift_requests_person_id_status_idx" ON "shift_requests"("person_id", "status");

-- CreateIndex
CREATE INDEX "shift_requests_suggested_partner_id_idx" ON "shift_requests"("suggested_partner_id");

-- CreateIndex
CREATE INDEX "assignments_shift_id_status_idx" ON "assignments"("shift_id", "status");

-- CreateIndex
CREATE INDEX "assignments_person_1_id_idx" ON "assignments"("person_1_id");

-- CreateIndex
CREATE INDEX "assignments_person_2_id_idx" ON "assignments"("person_2_id");

-- CreateIndex
CREATE UNIQUE INDEX "system_configs_config_key_key" ON "system_configs"("config_key");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_type_created_at_idx" ON "audit_logs"("actor_type", "created_at");

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_person_a_id_fkey" FOREIGN KEY ("person_a_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_person_b_id_fkey" FOREIGN KEY ("person_b_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_templates" ADD CONSTRAINT "shift_templates_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "shift_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_blocks" ADD CONSTRAINT "shift_blocks_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "zones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_blocks" ADD CONSTRAINT "shift_blocks_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_blocks" ADD CONSTRAINT "shift_blocks_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_exceptions" ADD CONSTRAINT "availability_exceptions_created_by_admin_id_fkey" FOREIGN KEY ("created_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_requests" ADD CONSTRAINT "shift_requests_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_requests" ADD CONSTRAINT "shift_requests_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shift_requests" ADD CONSTRAINT "shift_requests_suggested_partner_id_fkey" FOREIGN KEY ("suggested_partner_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "shifts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_person_1_id_fkey" FOREIGN KEY ("person_1_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_person_2_id_fkey" FOREIGN KEY ("person_2_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_decided_by_admin_id_fkey" FOREIGN KEY ("decided_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_configs" ADD CONSTRAINT "system_configs_updated_by_admin_id_fkey" FOREIGN KEY ("updated_by_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_admin_id_fkey" FOREIGN KEY ("actor_admin_id") REFERENCES "admin_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_person_id_fkey" FOREIGN KEY ("actor_person_id") REFERENCES "people"("id") ON DELETE SET NULL ON UPDATE CASCADE;
