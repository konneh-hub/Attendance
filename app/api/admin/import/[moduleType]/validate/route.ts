import { NextResponse } from "next/server";

import { requireRole } from "@/lib/authorization";
import { validateImport } from "@/lib/import/validator";
import { parseSpreadsheet } from "@/lib/import/parser";

export async function POST(request: Request, { params }: { params: Promise<{ moduleType: string }> }) {
  const { moduleType } = await params;
  await requireRole("ADMIN");

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "A file is required." }, { status: 400 });
  }

  try {
    const parsed = await parseSpreadsheet(file, file.name);
    const validation = await validateImport(moduleType, parsed);
    return NextResponse.json(validation);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to validate file" }, { status: 400 });
  }
}
