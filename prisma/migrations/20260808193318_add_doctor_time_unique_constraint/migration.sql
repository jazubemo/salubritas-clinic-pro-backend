/*
  Warnings:

  - A unique constraint covering the columns `[doctor_id,start_time]` on the table `appointments` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "unique_doctor_time_appointment" ON "appointments"("doctor_id", "start_time");
