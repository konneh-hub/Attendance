import { read, utils } from "xlsx";

import { cleanHeader, normalizeRow } from "@/lib/import/normalizer";

export interface ParsedImportData {
  headers: string[];
  rows: Array<Record<string, string>>;
  fileName: string;
}

function parseCsvText(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        currentValue += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentValue);
      currentValue = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && text[index + 1] === "\n") {
        index += 1;
      }
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = "";
      continue;
    }

    currentValue += char;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows;
}

export async function parseSpreadsheet(file: File | Blob | Buffer, fileName: string): Promise<ParsedImportData> {
  let buffer: Buffer;

  if (file instanceof Buffer) {
    buffer = file;
  } else if (file instanceof File || file instanceof Blob) {
    buffer = Buffer.from(await file.arrayBuffer());
  } else {
    throw new Error("Unsupported file type.");
  }

  const extension = fileName.toLowerCase().split(".").pop();

  if (extension === "csv") {
    const text = buffer.toString("utf8");
    const rows = parseCsvText(text);
    const headers = rows[0]?.map((header) => cleanHeader(header)) ?? [];
    const dataRows = rows.slice(1).filter((row) => row.some((value) => value.trim().length > 0));
    return {
      fileName,
      headers,
      rows: dataRows.map((row) =>
        Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""]))
      ),
    };
  }

  const workbook = read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = utils.sheet_to_json<Record<string, unknown>>(sheet, { raw: false, defval: "" });
  const headers = Object.keys(rows[0] ?? {}).map((header) => cleanHeader(header));

  return {
    fileName,
    headers,
    rows: rows.map((row) => normalizeRow(row)),
  };
}
