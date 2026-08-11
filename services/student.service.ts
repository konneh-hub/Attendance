import "server-only";

import { createHash } from "node:crypto";
import { AttendanceStatus, AttendanceSessionStatus, Prisma, VerificationMethod } from "@prisma/client";

import { prisma } from "@/lib/prisma";

function computeDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(6371000 * c);
}

function hashVerificationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getStudentDashboard(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  const [enrolledCourseCount, openSessionCount, attendanceRecords, presentCount, absentCount, lateCount] = await prisma.$transaction([
    prisma.courseEnrollment.count({ where: { studentId: student.id } }),
    prisma.attendanceSession.count({
      where: {
        course: { enrollments: { some: { studentId: student.id } } },
        status: AttendanceSessionStatus.OPEN,
      },
    }),
    prisma.attendance.count({ where: { studentId: student.id } }),
    prisma.attendance.count({ where: { studentId: student.id, status: AttendanceStatus.PRESENT } }),
    prisma.attendance.count({ where: { studentId: student.id, status: AttendanceStatus.ABSENT } }),
    prisma.attendance.count({ where: { studentId: student.id, status: AttendanceStatus.LATE } }),
  ]);

  return {
    enrolledCourseCount,
    openSessionCount,
    attendanceRecords,
    presentCount,
    absentCount,
    lateCount,
  };
}

export async function getStudentOpenSessions(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  return prisma.attendanceSession.findMany({
    where: {
      status: AttendanceSessionStatus.OPEN,
      course: { enrollments: { some: { studentId: student.id } } },
    },
    orderBy: { startsAt: "asc" },
    select: {
      id: true,
      title: true,
      startsAt: true,
      verificationMethods: true,
      course: { select: { code: true, title: true } },
      courseId: true,
      createdByLecturer: { select: { user: { select: { fullName: true } } } },
    },
  }).then((sessions) =>
    sessions.map((session) => ({
      id: session.id,
      title: session.title,
      startsAt: session.startsAt,
      verificationMethods: session.verificationMethods,
      course: session.course,
      lecturerName: session.createdByLecturer.user.fullName,
    })),
  );
}

export async function getStudentSessionDetails(userId: string, sessionId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  const session = await prisma.attendanceSession.findFirst({
    where: {
      id: sessionId,
      status: AttendanceSessionStatus.OPEN,
      course: { enrollments: { some: { studentId: student.id } } },
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      verificationMethods: true,
      locationLatitude: true,
      locationLongitude: true,
      locationRadiusMeters: true,
      course: { select: { code: true, title: true } },
      createdByLecturer: { select: { user: { select: { fullName: true } } } },
      attendances: { select: { id: true } },
    },
  });

  if (!session) {
    throw new Error("Attendance session not found or is not open.");
  }

  return {
    id: session.id,
    title: session.title,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    verificationMethods: session.verificationMethods,
    locationLatitude: session.locationLatitude ? Number(session.locationLatitude) : null,
    locationLongitude: session.locationLongitude ? Number(session.locationLongitude) : null,
    locationRadiusMeters: session.locationRadiusMeters,
    course: session.course,
    lecturerName: session.createdByLecturer.user.fullName,
    alreadySubmitted: session.attendances.length > 0,
  };
}

export async function submitStudentAttendance(
  userId: string,
  input: {
    sessionId: string;
    verificationMethod: VerificationMethod;
    qrToken?: string;
    latitude?: number;
    longitude?: number;
    faceImageData?: string;
    notes?: string;
  },
) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  const session = await prisma.attendanceSession.findFirst({
    where: {
      id: input.sessionId,
      status: AttendanceSessionStatus.OPEN,
      course: { enrollments: { some: { studentId: student.id } } },
    },
    select: {
      id: true,
      title: true,
      startsAt: true,
      endsAt: true,
      verificationMethods: true,
      locationLatitude: true,
      locationLongitude: true,
      locationRadiusMeters: true,
      qrTokenHash: true,
    },
  });

  if (!session) {
    throw new Error("Attendance session not found or is not open.");
  }

  const now = new Date();
  if (session.startsAt > now || session.endsAt < now) {
    throw new Error("Attendance session is not currently active.");
  }

  if (!session.verificationMethods.includes(input.verificationMethod)) {
    throw new Error("Selected verification method is not available for this session.");
  }

  if (input.verificationMethod === VerificationMethod.QR) {
    if (!input.qrToken) {
      throw new Error("QR verification code is required.");
    }

    if (!session.qrTokenHash) {
      throw new Error("This session is not configured for QR verification.");
    }

    const providedHash = hashVerificationToken(input.qrToken.trim());
    if (providedHash !== session.qrTokenHash) {
      throw new Error("Invalid QR verification token.");
    }
  }

  let distanceMeters: number | null = null;

  if (input.verificationMethod === VerificationMethod.GPS) {
    if (
      session.locationLatitude == null ||
      session.locationLongitude == null ||
      session.locationRadiusMeters == null
    ) {
      throw new Error("This session is not configured for GPS verification.");
    }

    if (input.latitude == null || input.longitude == null) {
      throw new Error("GPS coordinates are required for location verification.");
    }

    distanceMeters = computeDistanceMeters(
      input.latitude,
      input.longitude,
      Number(session.locationLatitude),
      Number(session.locationLongitude),
    );

    if (distanceMeters > session.locationRadiusMeters) {
      throw new Error("You are outside the allowed attendance radius for this session.");
    }
  }

  const existing = await prisma.attendance.findUnique({
    where: {
      sessionId_studentId: {
        sessionId: session.id,
        studentId: student.id,
      },
    },
  });

  if (existing) {
    throw new Error("Attendance has already been submitted for this session.");
  }

  const verificationPayload: {
    method: VerificationMethod;
    latitude?: number | null;
    longitude?: number | null;
    distanceMeters?: number | null;
    qrCodeHash?: string | null;
    metadata?: Prisma.JsonObject | null;
  } = {
    method: input.verificationMethod,
  };

  if (input.verificationMethod === VerificationMethod.GPS) {
    verificationPayload.latitude = input.latitude!;
    verificationPayload.longitude = input.longitude!;
    verificationPayload.distanceMeters = distanceMeters;
  }

  if (input.verificationMethod === VerificationMethod.QR) {
    verificationPayload.qrCodeHash = hashVerificationToken(input.qrToken!.trim());
  }

  if (input.verificationMethod === VerificationMethod.FACE) {
    verificationPayload.metadata = {
      faceImageCaptured: Boolean(input.faceImageData),
      faceImageData: input.faceImageData ?? null,
    };
  }

  const attendance = await prisma.attendance.create({
    data: {
      sessionId: session.id,
      studentId: student.id,
      status: AttendanceStatus.PRESENT,
      verificationMethod: input.verificationMethod,
      notes: input.notes ?? null,
      verification: {
        create: {
          method: verificationPayload.method,
          latitude: verificationPayload.latitude ?? null,
          longitude: verificationPayload.longitude ?? null,
          distanceMeters: verificationPayload.distanceMeters ?? null,
          qrCodeHash: verificationPayload.qrCodeHash ?? null,
          metadata: verificationPayload.metadata ?? undefined,
        },
      },
    },
  });

  return {
    attendanceId: attendance.id,
    sessionId: attendance.sessionId,
    studentId: attendance.studentId,
    verificationMethod: attendance.verificationMethod,
    recordedAt: attendance.recordedAt,
  };
}

export async function getStudentAttendanceHistory(userId: string) {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!student) {
    throw new Error("Student profile not found.");
  }

  return prisma.attendance.findMany({
    where: { studentId: student.id },
    orderBy: { recordedAt: "desc" },
    select: {
      id: true,
      status: true,
      recordedAt: true,
      notes: true,
      session: {
        select: {
          title: true,
          course: { select: { code: true, title: true } },
        },
      },
    },
  });
}
