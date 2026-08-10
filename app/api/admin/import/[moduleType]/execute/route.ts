import { NextResponse } from "next/server";

import { requireRole } from "@/lib/authorization";
import { executeImport } from "@/lib/import/importer";
import { parseSpreadsheet } from "@/lib/import/parser";
import { validateImport } from "@/lib/import/validator";

export async function POST(request: Request, { params }: { params: Promise<{ moduleType: string }> }) {
  const { moduleType } = await params;
  const actor = await requireRole("ADMIN");

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  try {
    const parsed = await parseSpreadsheet(file, file.name);
    const validation = await validateImport(moduleType, parsed);

    if (!validation.valid || validation.errors.length > 0) {
      return NextResponse.json({ error: "Validation failed", validation }, { status: 400 });
    }

    const result = await executeImport(moduleType, validation.validatedRows.map((row) => row.payload), actor.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to import file" }, { status: 400 });
  }
}
