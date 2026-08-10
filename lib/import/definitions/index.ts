import type { ImportDefinition } from "@/lib/import/definitions/types";

import { usersImportDefinition } from "@/lib/import/definitions/users";
import { studentsImportDefinition } from "@/lib/import/definitions/students";
import { lecturersImportDefinition } from "@/lib/import/definitions/lecturers";
import { departmentsImportDefinition } from "@/lib/import/definitions/departments";
import { coursesImportDefinition } from "@/lib/import/definitions/courses";

export type { ImportDefinition } from "@/lib/import/definitions/types";

const definitions: Record<string, ImportDefinition> = {
  users: usersImportDefinition,
  students: studentsImportDefinition,
  lecturers: lecturersImportDefinition,
  departments: departmentsImportDefinition,
  courses: coursesImportDefinition,
};

export function getImportDefinition(moduleType: string) {
  return definitions[moduleType] ?? null;
}
