import { NextResponse } from "next/server";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { pageQuerySchema } from "@/lib/admin-validations";
import { listStudents } from "@/services/admin/admin.service";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
    const url = new URL(request.url);
    const query = pageQuerySchema.parse(Object.fromEntries(url.searchParams));
    return NextResponse.json({ success: true, data: await listStudents(query.search, query.page, query.pageSize) });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    return NextResponse.json({ success: false, message: "Unable to load students." }, { status: 500 });
  }
}
