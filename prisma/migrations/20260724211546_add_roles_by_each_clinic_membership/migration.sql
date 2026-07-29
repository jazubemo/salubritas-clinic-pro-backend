-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DOCTOR', 'PATIENT');

-- AlterTable
ALTER TABLE "clinic_memberships" ADD COLUMN     "roles" "UserRole"[],
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "clinic_memberships_roles_idx" ON "clinic_memberships" USING GIN ("roles");
