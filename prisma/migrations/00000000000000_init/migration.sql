-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'LECTURER', 'STUDENT');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('QR', 'GPS', 'FACE', 'MANUAL');

-- CreateEnum
CREATE TYPE "AttendanceSessionStatus" AS ENUM ('DRAFT', 'OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(160) NOT NULL,
    "role" "UserRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "studentNumber" VARCHAR(40) NOT NULL,
    "programme" VARCHAR(160),
    "level" VARCHAR(40),
    "departmentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lecturer" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "staffNumber" VARCHAR(40) NOT NULL,
    "departmentId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lecturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" UUID NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "description" TEXT,
    "departmentId" UUID NOT NULL,
    "lecturerId" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CourseEnrollment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CourseEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceSession" (
    "id" UUID NOT NULL,
    "courseId" UUID NOT NULL,
    "createdByLecturerId" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "AttendanceSessionStatus" NOT NULL DEFAULT 'DRAFT',
    "verificationMethods" "VerificationMethod"[],
    "locationLatitude" DECIMAL(9,6),
    "locationLongitude" DECIMAL(9,6),
    "locationRadiusMeters" INTEGER,
    "qrTokenHash" VARCHAR(128),
    "openedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "verificationMethod" "VerificationMethod" NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceVerification" (
    "id" UUID NOT NULL,
    "attendanceId" UUID NOT NULL,
    "method" "VerificationMethod" NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "distanceMeters" INTEGER,
    "qrCodeHash" VARCHAR(128),
    "metadata" JSONB,

    CONSTRAINT "AttendanceVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorUserId" UUID,
    "action" VARCHAR(80) NOT NULL,
    "entityType" VARCHAR(80) NOT NULL,
    "entityId" VARCHAR(80),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_isActive_idx" ON "User"("role", "isActive");

-- CreateIndex
CREATE INDEX "User_fullName_idx" ON "User"("fullName");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Department_code_key" ON "Department"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentNumber_key" ON "Student"("studentNumber");

-- CreateIndex
CREATE INDEX "Student_departmentId_idx" ON "Student"("departmentId");

-- CreateIndex
CREATE INDEX "Student_departmentId_level_idx" ON "Student"("departmentId", "level");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_userId_key" ON "Lecturer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Lecturer_staffNumber_key" ON "Lecturer"("staffNumber");

-- CreateIndex
CREATE INDEX "Lecturer_departmentId_idx" ON "Lecturer"("departmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Course_code_key" ON "Course"("code");

-- CreateIndex
CREATE INDEX "Course_departmentId_isActive_idx" ON "Course"("departmentId", "isActive");

-- CreateIndex
CREATE INDEX "Course_lecturerId_isActive_idx" ON "Course"("lecturerId", "isActive");

-- CreateIndex
CREATE INDEX "Course_title_idx" ON "Course"("title");

-- CreateIndex
CREATE INDEX "CourseEnrollment_courseId_idx" ON "CourseEnrollment"("courseId");

-- CreateIndex
CREATE INDEX "CourseEnrollment_studentId_idx" ON "CourseEnrollment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CourseEnrollment_studentId_courseId_key" ON "CourseEnrollment"("studentId", "courseId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceSession_qrTokenHash_key" ON "AttendanceSession"("qrTokenHash");

-- CreateIndex
CREATE INDEX "AttendanceSession_courseId_startsAt_idx" ON "AttendanceSession"("courseId", "startsAt");

-- CreateIndex
CREATE INDEX "AttendanceSession_createdByLecturerId_status_idx" ON "AttendanceSession"("createdByLecturerId", "status");

-- CreateIndex
CREATE INDEX "AttendanceSession_status_startsAt_endsAt_idx" ON "AttendanceSession"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "Attendance_studentId_recordedAt_idx" ON "Attendance"("studentId", "recordedAt");

-- CreateIndex
CREATE INDEX "Attendance_sessionId_status_idx" ON "Attendance"("sessionId", "status");

-- CreateIndex
CREATE INDEX "Attendance_status_recordedAt_idx" ON "Attendance"("status", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Attendance_sessionId_studentId_key" ON "Attendance"("sessionId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceVerification_attendanceId_key" ON "AttendanceVerification"("attendanceId");

-- CreateIndex
CREATE INDEX "AuditLog_actorUserId_createdAt_idx" ON "AuditLog"("actorUserId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_createdAt_idx" ON "AuditLog"("action", "createdAt");

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecturer" ADD CONSTRAINT "Lecturer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lecturer" ADD CONSTRAINT "Lecturer_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Course" ADD CONSTRAINT "Course_lecturerId_fkey" FOREIGN KEY ("lecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CourseEnrollment" ADD CONSTRAINT "CourseEnrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceSession" ADD CONSTRAINT "AttendanceSession_createdByLecturerId_fkey" FOREIGN KEY ("createdByLecturerId") REFERENCES "Lecturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceVerification" ADD CONSTRAINT "AttendanceVerification_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "Attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
