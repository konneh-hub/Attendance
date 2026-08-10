import "server-only";

import type { UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, type AuthenticatedUser } from "@/lib/session";

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 401 | 403,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export class UnauthenticatedError extends AuthorizationError {
  constructor() {
    super("Authentication is required.", 401);
    this.name = "UnauthenticatedError";
  }
}

export class ForbiddenError extends AuthorizationError {
  constructor() {
    super("You do not have permission to access this resource.", 403);
    this.name = "ForbiddenError";
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new UnauthenticatedError();
  }

  return user;
}

export function hasRole(user: AuthenticatedUser | null, role: UserRole) {
  return user?.role === role;
}

export async function requireRole(role: UserRole) {
  const user = await requireAuth();

  if (!hasRole(user, role)) {
    throw new ForbiddenError();
  }

  return user;
}

export async function requireRoles(roles: readonly UserRole[]) {
  const user = await requireAuth();

  if (!roles.includes(user.role)) {
    throw new ForbiddenError();
  }

  return user;
}

export function ensureOwnsUser(user: AuthenticatedUser, userId: string) {
  if (user.id !== userId) {
    throw new ForbiddenError();
  }

  return user;
}

export async function ensureOwnsStudentProfile(
  user: AuthenticatedUser,
  studentId: string,
) {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { userId: true },
  });

  if (!student || student.userId !== user.id) {
    throw new ForbiddenError();
  }

  return user;
}

export async function ensureLecturerOwnsCourse(
  user: AuthenticatedUser,
  courseId: string,
) {
  if (user.role !== "LECTURER") {
    throw new ForbiddenError();
  }

  const lecturer = await prisma.lecturer.findFirst({
    where: { userId: user.id, courses: { some: { id: courseId } } },
    select: { id: true },
  });

  if (!lecturer) {
    throw new ForbiddenError();
  }

  return user;
}