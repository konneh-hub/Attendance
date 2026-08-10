import { NextResponse } from "next/server";

import { requireRole } from "@/lib/authorization";
import { getImportDefinition } from "@/lib/import/definitions";

export async function GET(request: Request, { params }: { params: Promise<{ moduleType: string }> }) {
  const { moduleType } = await params;
  await requireRole("ADMIN");
  const definition = getImportDefinition(moduleType);

  if (!definition) {
    return NextResponse.json({ error: "Unsupported module" }, { status: 404 });
  }

  const headerRow = definition.templateColumns.join(",");
  const csv = `${headerRow}\n`;
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${moduleType}-template.csv"`,
    },
  });
}
