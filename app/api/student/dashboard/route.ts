import { NextResponse } from "next/server";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { getStudentDashboard } from "@/services/student.service";

export async function GET() {
  try {
    const user = await requireRole("STUDENT");
    return NextResponse.json({ success: true, data: await getStudentDashboard(user.id) });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ success: false, message: "Unable to load student dashboard." }, { status: 500 });
  }
}
