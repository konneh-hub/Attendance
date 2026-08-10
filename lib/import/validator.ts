import { prisma } from "@/lib/prisma";
import { cleanHeader, normalizeText } from "@/lib/import/normalizer";
import { collectDuplicates } from "@/lib/import/duplicate-checker";
import { getImportDefinition } from "@/lib/import/definitions";
import type { ParsedImportData } from "@/lib/import/parser";

export interface ImportIssue {
  row: number;
  message: string;
  severity: "error" | "warning";
}

export interface PreparedImportRow {
  rowNumber: number;
  payload: Record<string, unknown>;
}

export interface ImportValidationResult {
  valid: boolean;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicates: number;
  warnings: number;
  errors: ImportIssue[];
  warningsList: ImportIssue[];
  previewRows: Array<Record<string, string | number | boolean>>;
  validatedRows: PreparedImportRow[];
}

export async function validateImport(moduleType: string, parsedData: ParsedImportData): Promise<ImportValidationResult> {
  const definition = getImportDefinition(moduleType);

  if (!definition) {
    throw new Error(`Unsupported import module: ${moduleType}`);
  }

  const errors: ImportIssue[] = [];
  const warningsList: ImportIssue[] = [];
  const validatedRows: PreparedImportRow[] = [];
  const previewRows: Array<Record<string, string | number | boolean>> = [];

  const headers = parsedData.headers;
  const missingHeaders = definition.requiredColumns.filter((column) => !headers.includes(cleanHeader(column)));

  if (missingHeaders.length) {
    errors.push({ row: 1, message: `Missing required columns: ${missingHeaders.join(", ")}`, severity: "error" });
  }

  const normalizedRows = parsedData.rows.map((row) => {
    const normalized = Object.fromEntries(Object.entries(row).map(([key, value]) => [cleanHeader(key), normalizeText(value)]));
    return normalized;
  });

  const duplicateValues = collectDuplicates(
    normalizedRows.map((row) => definition.getDuplicateValue(row)),
  );

  if (duplicateValues.length) {
    errors.push({ row: 1, message: `Duplicate values found within uploaded file: ${duplicateValues.join(", ")}`, severity: "error" });
  }

  const context = await buildImportContext(moduleType);

  for (const [index, row] of normalizedRows.entries()) {
    const rowNumber = index + 2;
    const rowErrors: ImportIssue[] = [];

    definition.requiredColumns.forEach((column) => {
      if (!normalizeText(row[cleanHeader(column)])) {
        rowErrors.push({ row: rowNumber, message: `Missing required value for ${column}`, severity: "error" });
      }
    });

    if (rowErrors.length) {
      errors.push(...rowErrors);
      continue;
    }

    const rowWarnings = await definition.validateRow(row, context);
    rowWarnings.forEach((issue) => {
      if (issue.severity === "warning") {
        warningsList.push({ row: rowNumber, message: issue.message, severity: "warning" });
      } else {
        errors.push({ row: rowNumber, message: issue.message, severity: "error" });
      }
    });

    if (!rowWarnings.some((issue) => issue.severity === "error")) {
      const payload = await definition.buildPayload(row, context);
      validatedRows.push({ rowNumber, payload });
    }
  }

  const previewLimit = 10;
  for (const row of validatedRows.slice(0, previewLimit)) {
    previewRows.push(row.payload as Record<string, string | number | boolean>);
  }

  return {
    valid: !errors.length,
    totalRows: normalizedRows.length,
    validRows: validatedRows.length,
    invalidRows: normalizedRows.length - validatedRows.length,
    duplicates: duplicateValues.length,
    warnings: warningsList.length,
    errors,
    warningsList,
    previewRows,
    validatedRows,
  };
}

async function buildImportContext(moduleType: string) {
  const context: Record<string, unknown> = {};

  if (moduleType === "students" || moduleType === "lecturers" || moduleType === "courses" || moduleType === "departments") {
    const departments = await prisma.department.findMany({ select: { code: true, id: true } });
    context.departments = departments;
  }

  if (moduleType === "courses") {
    const lecturers = await prisma.lecturer.findMany({ select: { staffNumber: true, id: true } });
    context.lecturers = lecturers;
  }

  if (moduleType === "students") {
    const existingStudents = await prisma.student.findMany({ select: { studentNumber: true } });
    context.existingStudents = existingStudents.map((student) => student.studentNumber.toLowerCase());
  }

  if (moduleType === "lecturers") {
    const existingLecturers = await prisma.lecturer.findMany({ select: { staffNumber: true } });
    context.existingLecturers = existingLecturers.map((lecturer) => lecturer.staffNumber.toLowerCase());
  }

  if (moduleType === "departments") {
    const existingDepartments = await prisma.department.findMany({ select: { code: true } });
    context.existingDepartments = existingDepartments.map((department) => department.code.toLowerCase());
  }

  if (moduleType === "courses") {
    const existingCourses = await prisma.course.findMany({ select: { code: true } });
    context.existingCourses = existingCourses.map((course) => course.code.toLowerCase());
  }

  if (moduleType === "users") {
    const existingUsers = await prisma.user.findMany({ select: { email: true } });
    context.existingUsers = existingUsers.map((user) => user.email.toLowerCase());
  }

  return context;
}
