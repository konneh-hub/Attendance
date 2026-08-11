import { NextResponse } from "next/server";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { getLecturerDashboard } from "@/services/lecturer.service";

export async function GET() {
  try {
    const lecturer = await requireRole("LECTURER");
    return NextResponse.json({ success: true, data: await getLecturerDashboard(lecturer.id) });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ success: false, message: "Unable to load lecturer dashboard." }, { status: 500 });
  }
}
