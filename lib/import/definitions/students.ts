import type { ImportDefinition } from "@/lib/import/definitions/types";
import { normalizeCode, normalizeText } from "@/lib/import/normalizer";

function resolveDepartmentId(row: Record<string, string>, context: Record<string, unknown>) {
  const code = normalizeCode(row.departmentcode ?? row.department_code ?? row.department);
  if (!code) return null;
  const departments = context.departments as Array<{ code: string; id: string }> | undefined;
  const match = departments?.find((item) => item.code.toLowerCase() === code.toLowerCase());
  return match?.id ?? null;
}

export const studentsImportDefinition: ImportDefinition = {
  title: "Students",
  requiredColumns: ["email", "fullName", "password", "studentNumber", "departmentCode"],
  templateColumns: ["email", "fullName", "password", "studentNumber", "departmentCode", "programme", "level"],
  getDuplicateValue: (row) => row.studentnumber || row.student_number || row.studentnumber_ || "",
  validateRow: async (row, context) => {
    const errors: Array<{ message: string; severity: "error" | "warning" }> = [];
    const studentNumber = normalizeText(row.studentnumber ?? row.student_number);
    const email = normalizeText(row.email ?? row.e_mail);
    const existingStudents = context.existingStudents as string[] | undefined;
    const departmentId = resolveDepartmentId(row, context);

    if (!studentNumber) {
      errors.push({ message: "Student number is required.", severity: "error" });
    } else if (existingStudents?.some((item) => item === studentNumber.toLowerCase())) {
      errors.push({ message: `Student number already exists: ${studentNumber}`, severity: "error" });
    }

    if (!email) {
      errors.push({ message: "Email is required.", severity: "error" });
    }

    if (!departmentId) {
      errors.push({ message: `Department code does not exist: ${normalizeCode(row.departmentcode ?? row.department_code ?? row.department) || "(empty)"}`, severity: "error" });
    }

    return errors;
  },
  buildPayload: async (row, context) => ({
    email: normalizeText(row.email ?? row.e_mail).toLowerCase(),
    fullName: normalizeText(row.fullname ?? row.full_name ?? row.name),
    password: normalizeText(row.password),
    studentNumber: normalizeText(row.studentnumber ?? row.student_number),
    departmentId: resolveDepartmentId(row, context),
    programme: normalizeText(row.programme),
    level: normalizeText(row.level),
  }),
};
