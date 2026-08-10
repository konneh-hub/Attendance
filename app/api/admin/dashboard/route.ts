import { NextResponse } from "next/server";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { getAdminDashboard } from "@/services/admin/admin.service";

export async function GET() {
  try {
    await requireRole("ADMIN");
    return NextResponse.json({ success: true, data: await getAdminDashboard() });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ success: false, message: "Unable to load dashboard." }, { status: 500 });
  }
}
