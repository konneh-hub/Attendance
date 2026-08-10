import type { ImportDefinition } from "@/lib/import/definitions/types";
import { normalizeCode, normalizeText } from "@/lib/import/normalizer";

function resolveDepartmentId(row: Record<string, string>, context: Record<string, unknown>) {
  const code = normalizeCode(row.departmentcode ?? row.department_code ?? row.department);
  if (!code) return null;
  const departments = context.departments as Array<{ code: string; id: string }> | undefined;
  const match = departments?.find((item) => item.code.toLowerCase() === code.toLowerCase());
  return match?.id ?? null;
}

export const usersImportDefinition: ImportDefinition = {
  title: "Users",
  requiredColumns: ["email", "fullName", "password", "role", "status"],
  templateColumns: ["email", "fullName", "password", "role", "status", "studentNumber", "staffNumber", "departmentCode", "programme", "level"],
  getDuplicateValue: (row) => row.email || row.fullname || row.full_name || "",
  validateRow: async (row, context) => {
    const errors: Array<{ message: string; severity: "error" | "warning" }> = [];
    const email = normalizeText(row.email ?? row.e_mail);
    const role = normalizeText(row.role).toUpperCase();
    const status = normalizeText(row.status).toUpperCase();
    const existingUsers = context.existingUsers as string[] | undefined;
    const departmentId = resolveDepartmentId(row, context);

    if (!email) {
      errors.push({ message: "Email is required.", severity: "error" });
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ message: `Email is invalid: ${email}`, severity: "error" });
    } else if (existingUsers?.some((item) => item === email.toLowerCase())) {
      errors.push({ message: `User email already exists: ${email}`, severity: "error" });
    }

    if (!["ADMIN", "LECTURER", "STUDENT"].includes(role)) {
      errors.push({ message: `Unsupported role: ${role || "(empty)"}`, severity: "error" });
    }

    if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(status)) {
      errors.push({ message: `Unsupported status: ${status || "(empty)"}`, severity: "error" });
    }

    if (role === "STUDENT") {
      if (!normalizeText(row.studentnumber ?? row.student_number)) {
        errors.push({ message: "Student number is required for student accounts.", severity: "error" });
      }
      if (!departmentId) {
        errors.push({ message: `Department code does not exist: ${normalizeCode(row.departmentcode ?? row.department_code ?? row.department) || "(empty)"}`, severity: "error" });
      }
    }

    if (role === "LECTURER") {
      if (!normalizeText(row.staffnumber ?? row.staff_number)) {
        errors.push({ message: "Staff number is required for lecturer accounts.", severity: "error" });
      }
      if (!departmentId) {
        errors.push({ message: `Department code does not exist: ${normalizeCode(row.departmentcode ?? row.department_code ?? row.department) || "(empty)"}`, severity: "error" });
      }
    }

    return errors;
  },
  buildPayload: async (row, context) => {
    const role = normalizeText(row.role).toUpperCase();
    return {
      email: normalizeText(row.email ?? row.e_mail).toLowerCase(),
      fullName: normalizeText(row.fullname ?? row.full_name ?? row.name),
      password: normalizeText(row.password),
      role,
      status: normalizeText(row.status).toUpperCase(),
      departmentId: resolveDepartmentId(row, context),
      studentNumber: normalizeText(row.studentnumber ?? row.student_number),
      staffNumber: normalizeText(row.staffnumber ?? row.staff_number),
      programme: normalizeText(row.programme),
      level: normalizeText(row.level),
    };
  },
};
