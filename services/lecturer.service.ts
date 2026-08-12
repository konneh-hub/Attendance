import "server-only";

import { createHash } from "node:crypto";
import {
  AttendanceSessionStatus,
  AttendanceStatus,
  VerificationMethod,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

async function getLecturerProfile(userId: string) {
  const lecturer = await prisma.lecturer.findUnique({ where: { userId } });

  if (!lecturer) {
    throw new Error("Lecturer profile not found.");
  }

  return lecturer;
}

export async function getLecturerDashboard(userId: string) {
  const lecturer = await getLecturerProfile(userId);

  const [courseCount, activeSessionCount, enrolledStudentCount] = await prisma.$transaction([
    prisma.course.count({ where: { lecturerId: lecturer.id, isActive: true } }),
    prisma.attendanceSession.count({
      where: {
        createdByLecturerId: lecturer.id,
        status: { in: [AttendanceSessionStatus.DRAFT, AttendanceSessionStatus.OPEN] },
      },
    }),
    prisma.courseEnrollment.count({ where: { course: { lecturerId: lecturer.id } } }),
  ]);

  return { courseCount, activeSessionCount, enrolledStudentCount };
}

export async function getLecturerCourses(userId: string) {
  const lecturer = await getLecturerProfile(userId);

  const courses = await prisma.course.findMany({
    where: { lecturerId: lecturer.id, isActive: true },
    orderBy: { code: "asc" },
    select: {
      id: true,
      code: true,
      title: true,
      department: { select: { code: true, name: true } },
      enrollments: { select: { studentId: true } },
      sessions: { where: { status: AttendanceSessionStatus.OPEN }, select: { id: true } },
    },
  });

  return courses.map((course) => ({
    id: course.id,
    code: course.code,
    title: course.title,
    department: course.department,
    enrolledCount: course.enrollments.length,
    openSessionCount: course.sessions.length,
  }));
}

export async function createLecturerSession(userId: string, input: {
  courseId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
  verificationMethods: VerificationMethod[];
  locationLatitude?: number | null;
  locationLongitude?: number | null;
  locationRadiusMeters?: number | null;
  qrToken?: string | null;
}) {
  const lecturer = await getLecturerProfile(userId);

  const course = await prisma.course.findFirst({
    where: { id: input.courseId, lecturerId: lecturer.id, isActive: true },
    select: { id: true },
  });

  if (!course) {
    throw new Error("Course not found or not assigned to you.");
  }

  if (input.endsAt <= input.startsAt) {
    throw new Error("End time must be after start time.");
  }

  if (input.verificationMethods.includes(VerificationMethod.GPS)) {
    if (input.locationLatitude == null || input.locationLongitude == null || input.locationRadiusMeters == null) {
      throw new Error("GPS verification requires latitude, longitude, and radius.");
    }
  }

  if (input.verificationMethods.includes(VerificationMethod.QR) && !input.qrToken) {
    throw new Error("QR verification requires a token.");
  }

  const qrTokenHash = input.qrToken
    ? createHash("sha256").update(input.qrToken).digest("hex")
    : null;

  const session = await prisma.attendanceSession.create({
    data: {
      courseId: course.id,
      createdByLecturerId: lecturer.id,
      title: input.title.trim(),
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      status: AttendanceSessionStatus.DRAFT,
      verificationMethods: input.verificationMethods,
      locationLatitude: input.locationLatitude ?? null,
      locationLongitude: input.locationLongitude ?? null,
      locationRadiusMeters: input.locationRadiusMeters ?? null,
      qrTokenHash,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: "SESSION_CREATED",
      entityType: "AttendanceSession",
      entityId: session.id,
      metadata: {
        courseId: input.courseId,
        verificationMethods: input.verificationMethods,
      },
    },
  });

  return session;
}

export async function updateLecturerSessionStatus(
  userId: string,
  sessionId: string,
  action: "OPEN" | "CLOSE",
) {
  const lecturer = await getLecturerProfile(userId);

  const session = await prisma.attendanceSession.findFirst({
    where: { id: sessionId, createdByLecturerId: lecturer.id },
    select: { id: true, status: true },
  });

  if (!session) {
    throw new Error("Attendance session not found or not assigned to you.");
  }

  if (action === "OPEN") {
    if (session.status !== AttendanceSessionStatus.DRAFT) {
      throw new Error("Only draft sessions can be opened.");
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { status: AttendanceSessionStatus.OPEN, openedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: "SESSION_OPENED",
        entityType: "AttendanceSession",
        entityId: session.id,
      },
    });

    return updated;
  }

  if (action === "CLOSE") {
    if (session.status !== AttendanceSessionStatus.OPEN) {
      throw new Error("Only open sessions can be closed.");
    }

    const updated = await prisma.attendanceSession.update({
      where: { id: session.id },
      data: { status: AttendanceSessionStatus.CLOSED, closedAt: new Date() },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: userId,
        action: "SESSION_CLOSED",
        entityType: "AttendanceSession",
        entityId: session.id,
      },
    });

    return updated;
  }

  throw new Error("Unsupported session action.");
}

export async function getLecturerSessions(userId: string) {
  const lecturer = await getLecturerProfile(userId);

  return prisma.attendanceSession.findMany({
    where: { createdByLecturerId: lecturer.id },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      endsAt: true,
      course: { select: { id: true, code: true, title: true } },
      _count: { select: { attendances: true } },
    },
  });
}

export async function getLecturerOpenSessions(userId: string) {
  const lecturer = await getLecturerProfile(userId);

  return prisma.attendanceSession.findMany({
    where: {
      createdByLecturerId: lecturer.id,
      status: AttendanceSessionStatus.OPEN,
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      startsAt: true,
      course: { select: { code: true, title: true } },
    },
  });
}

export async function getLecturerAttendanceHistory(userId: string) {
  const lecturer = await getLecturerProfile(userId);

  return prisma.attendanceSession.findMany({
    where: {
      createdByLecturerId: lecturer.id,
      status: AttendanceSessionStatus.CLOSED,
    },
    orderBy: { closedAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      endsAt: true,
      closedAt: true,
      course: { select: { code: true, title: true } },
      _count: { select: { attendances: true } },
    },
  });
}

export async function getLecturerSessionDetails(userId: string, sessionId: string) {
  const lecturer = await getLecturerProfile(userId);

  const session = await prisma.attendanceSession.findFirst({
    where: {
      id: sessionId,
      createdByLecturerId: lecturer.id,
      status: AttendanceSessionStatus.OPEN,
    },
    select: {
      id: true,
      courseId: true,
      title: true,
      startsAt: true,
      course: {
        select: {
          code: true,
          title: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Attendance session not found or is not open.");
  }

  const [enrollments, existingAttendances] = await prisma.$transaction([
    prisma.courseEnrollment.findMany({
      where: { courseId: session.courseId },
      orderBy: { student: { studentNumber: "asc" } },
      select: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            user: { select: { fullName: true } },
          },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { sessionId: session.id },
      select: { studentId: true, status: true, notes: true },
    }),
  ]);

  const attendanceByStudent = new Map(
    existingAttendances.map((attendance) => [attendance.studentId, attendance]),
  );

  return {
    id: session.id,
    title: session.title,
    startsAt: session.startsAt,
    course: session.course,
    students: enrollments.map(({ student }) => ({
      id: student.id,
      studentNumber: student.studentNumber,
      fullName: student.user.fullName,
      status: attendanceByStudent.get(student.id)?.status ?? null,
      notes: attendanceByStudent.get(student.id)?.notes ?? null,
    })),
  };
}

export async function recordLecturerAttendance(
  userId: string,
  sessionId: string,
  attendances: Array<{ studentId: string; status: AttendanceStatus; notes?: string }>,
) {
  const lecturer = await getLecturerProfile(userId);

  const session = await prisma.attendanceSession.findFirst({
    where: {
      id: sessionId,
      createdByLecturerId: lecturer.id,
      status: AttendanceSessionStatus.OPEN,
    },
    select: { id: true, courseId: true },
  });

  if (!session) {
    throw new Error("Attendance session not found or is not open.");
  }

  const enrolledStudentIds = new Set(
    (await prisma.courseEnrollment.findMany({
      where: { courseId: session.courseId },
      select: { studentId: true },
    })).map((item) => item.studentId),
  );

  let present = 0;
  let absent = 0;
  let late = 0;

  const attendanceCreates = attendances.map((attendance) => {
    if (!enrolledStudentIds.has(attendance.studentId)) {
      throw new Error("One or more students are not enrolled in this course.");
    }

    if (attendance.status === AttendanceStatus.PRESENT) present += 1;
    if (attendance.status === AttendanceStatus.ABSENT) absent += 1;
    if (attendance.status === AttendanceStatus.LATE) late += 1;

    return prisma.attendance.upsert({
      where: {
        sessionId_studentId: {
          sessionId: session.id,
          studentId: attendance.studentId,
        },
      },
      create: {
        sessionId: session.id,
        studentId: attendance.studentId,
        status: attendance.status,
        verificationMethod: VerificationMethod.MANUAL,
        notes: attendance.notes ?? null,
      },
      update: {
        status: attendance.status,
        notes: attendance.notes ?? null,
      },
    });
  });

  const result = await prisma.$transaction(attendanceCreates);

  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action: "ATTENDANCE_RECORDED",
      entityType: "AttendanceSession",
      entityId: session.id,
      metadata: { recorded: result.length, present, absent, late },
    },
  });

  return {
    sessionId: session.id,
    recorded: result.length,
    present,
    absent,
    late,
  };
}
