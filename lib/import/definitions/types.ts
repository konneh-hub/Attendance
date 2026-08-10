export interface ImportDefinition {
  title: string;
  requiredColumns: string[];
  templateColumns: string[];
  getDuplicateValue: (row: Record<string, string>) => string;
  validateRow: (row: Record<string, string>, context: Record<string, unknown>) => Promise<Array<{ message: string; severity: "error" | "warning" }>>;
  buildPayload: (row: Record<string, string>, context: Record<string, unknown>) => Promise<Record<string, unknown>>;
}
