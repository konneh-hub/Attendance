import type { ImportDefinition } from "@/lib/import/definitions/types";
import { normalizeCode, normalizeText } from "@/lib/import/normalizer";

function resolveDepartmentId(row: Record<string, string>, context: Record<string, unknown>) {
  const code = normalizeCode(row.departmentcode ?? row.department_code ?? row.department);
  if (!code) return null;
  const departments = context.departments as Array<{ code: string; id: string }> | undefined;
  const match = departments?.find((item) => item.code.toLowerCase() === code.toLowerCase());
  return match?.id ?? null;
}

export const lecturersImportDefinition: ImportDefinition = {
  title: "Lecturers",
  requiredColumns: ["email", "fullName", "password", "staffNumber", "departmentCode"],
  templateColumns: ["email", "fullName", "password", "staffNumber", "departmentCode"],
  getDuplicateValue: (row) => row.staffnumber || row.staff_number || row.staffnumber_ || "",
  validateRow: async (row, context) => {
    const errors: Array<{ message: string; severity: "error" | "warning" }> = [];
    const staffNumber = normalizeText(row.staffnumber ?? row.staff_number);
    const email = normalizeText(row.email ?? row.e_mail);
    const existingLecturers = context.existingLecturers as string[] | undefined;
    const departmentId = resolveDepartmentId(row, context);

    if (!staffNumber) {
      errors.push({ message: "Staff number is required.", severity: "error" });
    } else if (existingLecturers?.some((item) => item === staffNumber.toLowerCase())) {
      errors.push({ message: `Staff number already exists: ${staffNumber}`, severity: "error" });
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
    staffNumber: normalizeText(row.staffnumber ?? row.staff_number),
    departmentId: resolveDepartmentId(row, context),
  }),
};
