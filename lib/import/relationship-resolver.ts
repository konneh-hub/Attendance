import { prisma } from "@/lib/prisma";

export async function resolveDepartmentId(code: string) {
  const department = await prisma.department.findUnique({ where: { code: code.toUpperCase() }, select: { id: true } });
  return department?.id ?? null;
}

export async function resolveLecturerId(staffNumber: string) {
  const lecturer = await prisma.lecturer.findUnique({ where: { staffNumber }, select: { id: true } });
  return lecturer?.id ?? null;
}
