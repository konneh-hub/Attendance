import { AccountStatus, UserRole } from "@prisma/client";

import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export async function executeImport(moduleType: string, rows: Array<Record<string, unknown>>, actorUserId: string) {
  return prisma.$transaction(async (transaction) => {
    const created: Array<Record<string, unknown>> = [];

    for (const row of rows) {
      if (moduleType === "users") {
        const passwordHash = await hashPassword(String(row.password));
        const role = String(row.role).toUpperCase() as UserRole;
        const status = String(row.status).toUpperCase() as AccountStatus;
        const user = await transaction.user.create({
          data: {
            email: String(row.email).trim().toLowerCase(),
            fullName: String(row.fullName).trim(),
            passwordHash,
            role,
            status,
          },
        });

        if (role === UserRole.STUDENT) {
          await transaction.student.create({
            data: {
              userId: user.id,
              studentNumber: String(row.studentNumber).trim(),
              departmentId: String(row.departmentId),
              programme: String(row.programme || "").trim() || null,
              level: String(row.level || "").trim() || null,
            },
          });
        }

        if (role === UserRole.LECTURER) {
          await transaction.lecturer.create({
            data: {
              userId: user.id,
              staffNumber: String(row.staffNumber).trim(),
              departmentId: String(row.departmentId),
            },
          });
        }

        created.push({ id: user.id, email: user.email, role: user.role });
      }

      if (moduleType === "students") {
        const user = await transaction.user.create({
          data: {
            email: String(row.email).trim().toLowerCase(),
            fullName: String(row.fullName).trim(),
            passwordHash: await hashPassword(String(row.password)),
            role: UserRole.STUDENT,
            status: AccountStatus.ACTIVE,
          },
        });
        await transaction.student.create({
          data: {
            userId: user.id,
            studentNumber: String(row.studentNumber).trim(),
            departmentId: String(row.departmentId),
            programme: String(row.programme || "").trim() || null,
            level: String(row.level || "").trim() || null,
          },
        });
        created.push({ id: user.id, studentNumber: row.studentNumber });
      }

      if (moduleType === "lecturers") {
        const user = await transaction.user.create({
          data: {
            email: String(row.email).trim().toLowerCase(),
            fullName: String(row.fullName).trim(),
            passwordHash: await hashPassword(String(row.password)),
            role: UserRole.LECTURER,
            status: AccountStatus.ACTIVE,
          },
        });
        await transaction.lecturer.create({
          data: {
            userId: user.id,
            staffNumber: String(row.staffNumber).trim(),
            departmentId: String(row.departmentId),
          },
        });
        created.push({ id: user.id, staffNumber: row.staffNumber });
      }

      if (moduleType === "departments") {
        const department = await transaction.department.create({
          data: { name: String(row.name).trim(), code: String(row.code).trim().toUpperCase() },
        });
        created.push({ id: department.id, code: department.code });
      }

      if (moduleType === "courses") {
        const course = await transaction.course.create({
          data: {
            code: String(row.code).trim().toUpperCase(),
            title: String(row.title).trim(),
            description: String(row.description || "").trim() || null,
            departmentId: String(row.departmentId),
            lecturerId: String(row.lecturerId),
          },
        });
        created.push({ id: course.id, code: course.code });
      }
    }

    await transaction.auditLog.create({
      data: {
        actorUserId,
        action: "BULK_IMPORT_COMPLETED",
        entityType: moduleType.toUpperCase(),
        entityId: actorUserId,
        metadata: { moduleType, count: created.length },
      },
    });

    return { created, importedCount: created.length };
  });
}
