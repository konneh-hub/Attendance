import type { ImportDefinition } from "@/lib/import/definitions/types";
import { normalizeCode, normalizeText } from "@/lib/import/normalizer";

export const departmentsImportDefinition: ImportDefinition = {
  title: "Departments",
  requiredColumns: ["name", "code"],
  templateColumns: ["name", "code"],
  getDuplicateValue: (row) => row.code || row.department_code || row.departmentcode || "",
  validateRow: async (row, context) => {
    const errors: Array<{ message: string; severity: "error" | "warning" }> = [];
    const name = normalizeText(row.name);
    const code = normalizeCode(row.code ?? row.department_code ?? row.departmentcode);
    const existingDepartments = context.existingDepartments as string[] | undefined;

    if (!name) {
      errors.push({ message: "Department name is required.", severity: "error" });
    }

    if (!code) {
      errors.push({ message: "Department code is required.", severity: "error" });
    } else if (existingDepartments?.some((item) => item === code.toLowerCase())) {
      errors.push({ message: `Department code already exists: ${code}`, severity: "error" });
    }

    return errors;
  },
  buildPayload: async (row) => ({
    name: normalizeText(row.name),
    code: normalizeCode(row.code ?? row.department_code ?? row.departmentcode),
  }),
};
