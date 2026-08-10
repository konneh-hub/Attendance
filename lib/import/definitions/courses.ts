import type { ImportDefinition } from "@/lib/import/definitions/types";
import { normalizeCode, normalizeText } from "@/lib/import/normalizer";

function resolveDepartmentId(row: Record<string, string>, context: Record<string, unknown>) {
  const code = normalizeCode(row.departmentcode ?? row.department_code ?? row.department);
  if (!code) return null;
  const departments = context.departments as Array<{ code: string; id: string }> | undefined;
  const match = departments?.find((item) => item.code.toLowerCase() === code.toLowerCase());
  return match?.id ?? null;
}

function resolveLecturerId(row: Record<string, string>, context: Record<string, unknown>) {
  const staffNumber = normalizeText(row.lecturerstaffnumber ?? row.staff_number ?? row.staffnumber ?? row.lecturer);
  if (!staffNumber) return null;
  const lecturers = context.lecturers as Array<{ staffNumber: string; id: string }> | undefined;
  const match = lecturers?.find((item) => item.staffNumber.toLowerCase() === staffNumber.toLowerCase());
  return match?.id ?? null;
}

export const coursesImportDefinition: ImportDefinition = {
  title: "Courses",
  requiredColumns: ["code", "title", "departmentCode", "lecturerStaffNumber"],
  templateColumns: ["code", "title", "description", "departmentCode", "lecturerStaffNumber"],
  getDuplicateValue: (row) => row.code || row.course_code || row.coursecode || "",
  validateRow: async (row, context) => {
    const errors: Array<{ message: string; severity: "error" | "warning" }> = [];
    const code = normalizeCode(row.code ?? row.course_code ?? row.coursecode);
    const existingCourses = context.existingCourses as string[] | undefined;
    const departmentId = resolveDepartmentId(row, context);
    const lecturerId = resolveLecturerId(row, context);

    if (!code) {
      errors.push({ message: "Course code is required.", severity: "error" });
    } else if (existingCourses?.some((item) => item === code.toLowerCase())) {
      errors.push({ message: `Course code already exists: ${code}`, severity: "error" });
    }

    if (!normalizeText(row.title)) {
      errors.push({ message: "Course title is required.", severity: "error" });
    }

    if (!departmentId) {
      errors.push({ message: `Department code does not exist: ${normalizeCode(row.departmentcode ?? row.department_code ?? row.department) || "(empty)"}`, severity: "error" });
    }

    if (!lecturerId) {
      errors.push({ message: `Lecturer staff number does not exist: ${normalizeText(row.lecturerstaffnumber ?? row.staff_number ?? row.staffnumber ?? row.lecturer) || "(empty)"}`, severity: "error" });
    }

    return errors;
  },
  buildPayload: async (row, context) => ({
    code: normalizeCode(row.code ?? row.course_code ?? row.coursecode),
    title: normalizeText(row.title),
    description: normalizeText(row.description),
    departmentId: resolveDepartmentId(row, context),
    lecturerId: resolveLecturerId(row, context),
  }),
};
