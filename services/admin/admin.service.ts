import "server-only";

import { Prisma, AccountStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const safeUserSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  status: true,
  lastLoginAt: true,
  createdAt: true,
  studentProfile: {
    select: { id: true, studentNumber: true, programme: true, level: true },
  },
  lecturerProfile: {
    select: { id: true, staffNumber: true, departmentId: true },
  },
} as const;

export function isPrismaUniqueError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

export async function getAdminDashboard() {
  const [users, students, lecturers, departments, courses, activeUsers, inactiveUsers] =
    await prisma.$transaction([
      prisma.user.count(),
      prisma.student.count(),
      prisma.lecturer.count(),
      prisma.department.count(),
      prisma.course.count(),
      prisma.user.count({ where: { status: AccountStatus.ACTIVE } }),
      prisma.user.count({ where: { status: { not: AccountStatus.ACTIVE } } }),
    ]);

  return { users, students, lecturers, departments, courses, activeUsers, inactiveUsers };
}

export async function listUsers(search: string, page: number, pageSize: number) {
  const normalizedRole = search.toUpperCase();
  const roleFilter = Object.values(UserRole).includes(normalizedRole as UserRole)
    ? [{ role: { equals: normalizedRole as UserRole } }]
    : [];
  const where: Prisma.UserWhereInput = search
    ? {
        OR: [
          { fullName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          ...roleFilter,
        ],
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: safeUserSelect,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.user.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function listStudents(search: string, page: number, pageSize: number) {
  const where: Prisma.StudentWhereInput = search
    ? {
        OR: [
          { studentNumber: { contains: search, mode: "insensitive" } },
          { programme: { contains: search, mode: "insensitive" } },
          { user: { fullName: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.student.findMany({
      where,
      select: {
        id: true,
        studentNumber: true,
        programme: true,
        level: true,
        user: { select: { id: true, fullName: true, email: true, status: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { studentNumber: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.student.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function listLecturers(search: string, page: number, pageSize: number) {
  const where: Prisma.LecturerWhereInput = search
    ? {
        OR: [
          { staffNumber: { contains: search, mode: "insensitive" } },
          { user: { fullName: { contains: search, mode: "insensitive" } } },
        ],
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.lecturer.findMany({
      where,
      select: {
        id: true,
        staffNumber: true,
        user: { select: { id: true, fullName: true, email: true, status: true } },
        department: { select: { id: true, name: true, code: true } },
      },
      orderBy: { staffNumber: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.lecturer.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function listDepartments(search: string) {
  return prisma.department.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }
      : {},
    include: { _count: { select: { students: true, lecturers: true, courses: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listCourses(search: string, page: number, pageSize: number) {
  const where: Prisma.CourseWhereInput = search
    ? {
        OR: [
          { code: { contains: search, mode: "insensitive" } },
          { title: { contains: search, mode: "insensitive" } },
        ],
      }
    : {};
  const [items, total] = await prisma.$transaction([
    prisma.course.findMany({
      where,
      select: {
        id: true,
        code: true,
        title: true,
        description: true,
        isActive: true,
        department: { select: { id: true, name: true, code: true } },
        lecturer: { select: { id: true, staffNumber: true, user: { select: { fullName: true } } } },
      },
      orderBy: { code: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.course.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function createAdminUser(input: {
  actorUserId: string;
  email: string;
  fullName: string;
  password: string;
  role: UserRole;
  status: AccountStatus;
  studentNumber?: string;
  programme?: string;
  level?: string;
  staffNumber?: string;
  departmentId?: string;
}) {
  const passwordHash = await hashPassword(input.password);
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.create({
      data: {
        email: input.email.trim().toLowerCase(),
        fullName: input.fullName.trim(),
        passwordHash,
        role: input.role,
        status: input.status,
      },
    });

    if (input.role === UserRole.STUDENT) {
      if (!input.studentNumber || !input.departmentId) throw new Error("Student profile fields are required.");
      await transaction.student.create({
        data: {
          userId: user.id,
          studentNumber: input.studentNumber.trim(),
          departmentId: input.departmentId,
          programme: input.programme?.trim() || null,
          level: input.level?.trim() || null,
        },
      });
    }

    if (input.role === UserRole.LECTURER) {
      if (!input.staffNumber || !input.departmentId) throw new Error("Lecturer profile fields are required.");
      await transaction.lecturer.create({
        data: {
          userId: user.id,
          staffNumber: input.staffNumber.trim(),
          departmentId: input.departmentId,
        },
      });
    }

    await transaction.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        action: "USER_CREATED",
        entityType: "User",
        entityId: user.id,
        metadata: { role: input.role },
      },
    });

    return transaction.user.findUniqueOrThrow({ where: { id: user.id }, select: safeUserSelect });
  });
}

export async function updateUserStatus(actorUserId: string, userId: string, status: AccountStatus) {
  return prisma.$transaction(async (transaction) => {
    const target = await transaction.user.findUnique({ where: { id: userId }, select: { id: true, role: true, status: true } });
    if (!target) throw new Error("User not found.");
    if (target.role === UserRole.ADMIN && status !== AccountStatus.ACTIVE) {
      const activeAdmins = await transaction.user.count({ where: { role: UserRole.ADMIN, status: AccountStatus.ACTIVE } });
      if (activeAdmins <= 1) throw new Error("The last active administrator cannot be deactivated.");
    }
    const user = await transaction.user.update({ where: { id: userId }, data: { status }, select: safeUserSelect });
    await transaction.auditLog.create({
      data: { actorUserId, action: `USER_${status}`, entityType: "User", entityId: userId, metadata: { status } },
    });
    if (status !== AccountStatus.ACTIVE) {
      await transaction.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
    return user;
  });
}

export async function createDepartment(actorUserId: string, input: { name: string; code: string }) {
  return prisma.$transaction(async (transaction) => {
    const department = await transaction.department.create({ data: { name: input.name.trim(), code: input.code.trim().toUpperCase() } });
    await transaction.auditLog.create({ data: { actorUserId, action: "DEPARTMENT_CREATED", entityType: "Department", entityId: department.id } });
    return department;
  });
}

export async function updateDepartment(actorUserId: string, id: string, input: { name: string; code: string }) {
  return prisma.$transaction(async (transaction) => {
    const department = await transaction.department.update({ where: { id }, data: { name: input.name.trim(), code: input.code.trim().toUpperCase() } });
    await transaction.auditLog.create({ data: { actorUserId, action: "DEPARTMENT_UPDATED", entityType: "Department", entityId: id } });
    return department;
  });
}

export async function createCourse(actorUserId: string, input: { code: string; title: string; description?: string; departmentId: string; lecturerId: string }) {
  return prisma.$transaction(async (transaction) => {
    const [department, lecturer] = await Promise.all([
      transaction.department.findUnique({ where: { id: input.departmentId } }),
      transaction.lecturer.findUnique({ where: { id: input.lecturerId } }),
    ]);
    if (!department || !lecturer) throw new Error("Department or lecturer not found.");
    const course = await transaction.course.create({ data: { code: input.code.trim().toUpperCase(), title: input.title.trim(), description: input.description?.trim() || null, departmentId: input.departmentId, lecturerId: input.lecturerId } });
    await transaction.auditLog.create({ data: { actorUserId, action: "COURSE_CREATED", entityType: "Course", entityId: course.id } });
    return course;
  });
}

export async function updateCourseStatus(actorUserId: string, id: string, isActive: boolean) {
  return prisma.$transaction(async (transaction) => {
    const course = await transaction.course.update({ where: { id }, data: { isActive } });
    await transaction.auditLog.create({ data: { actorUserId, action: "COURSE_UPDATED", entityType: "Course", entityId: id, metadata: { isActive } } });
    return course;
  });
}
