-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- AlterEnum
ALTER TYPE "Specialty" ADD VALUE 'GYNECOLOGIST';

-- DropIndex
DROP INDEX "clinics_id_idx";

-- DropIndex
DROP INDEX "patients_id_idx";

-- DropIndex
DROP INDEX "users_auth_id_idx";

-- DropIndex
DROP INDEX "users_dni_idx";

-- CreateTable
CREATE TABLE "appointments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "clinic_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "doctor_id" UUID NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "status" "AppointmentStatus" NOT NULL DEFAULT 'PENDING',
    "is_new_patient" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "appointments_clinic_id_doctor_id_start_time_idx" ON "appointments"("clinic_id", "doctor_id", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "unique_patient_clinic_time_appointment" ON "appointments"("patient_id", "clinic_id", "start_time");

-- CreateIndex
CREATE UNIQUE INDEX "appointments_patient_id_clinic_id_start_time_key" ON "appointments"("patient_id", "clinic_id", "start_time");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctor_id_fkey" FOREIGN KEY ("doctor_id") REFERENCES "doctors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_clinic_id_fkey" FOREIGN KEY ("clinic_id") REFERENCES "clinics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
