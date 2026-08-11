import "server-only";

import { Prisma, AttendanceSessionStatus, AttendanceStatus, VerificationMethod, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function getLecturerDashboard(userId: string) {
  const lecturer = await prisma.lecturer.findUnique({ where: { userId } });

  if (!lecturer) {
    throw new Error("Lecturer profile not found.");
  }

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

export async function getLecturerSessions(userId: string) {
  const lecturer = await prisma.lecturer.findUnique({ where: { userId } });

  if (!lecturer) {
    throw new Error("Lecturer profile not found.");
  }

  return prisma.attendanceSession.findMany({
    where: { createdByLecturerId: lecturer.id },
    orderBy: { startsAt: "desc" },
    select: {
      id: true,
      title: true,
      status: true,
      startsAt: true,
      course: { select: { code: true, title: true } },
      _count: { select: { attendances: true } },
    },
  });
}

export async function getLecturerOpenSessions(userId: string) {
  const lecturer = await prisma.lecturer.findUnique({ where: { userId } });

  if (!lecturer) {
    throw new Error("Lecturer profile not found.");
  }

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
  const lecturer = await prisma.lecturer.findUnique({ where: { userId } });

  if (!lecturer) {
    throw new Error("Lecturer profile not found.");
  }

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
  const lecturer = await prisma.lecturer.findUnique({ where: { userId } });

  if (!lecturer) {
    throw new Error("Lecturer profile not found.");
  }

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
  const lecturer = await prisma.lecturer.findUnique({ where: { userId } });

  if (!lecturer) {
    throw new Error("Lecturer profile not found.");
  }

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

  return {
    sessionId: session.id,
    recorded: result.length,
    present,
    absent,
    late,
  };
}
