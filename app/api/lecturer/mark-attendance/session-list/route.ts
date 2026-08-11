import { NextResponse } from "next/server";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { getLecturerOpenSessions } from "@/services/lecturer.service";

export async function GET() {
  try {
    const lecturer = await requireRole("LECTURER");
    const sessions = await getLecturerOpenSessions(lecturer.id);
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json({ success: false, message: "Unable to load open sessions." }, { status: 500 });
  }
}
