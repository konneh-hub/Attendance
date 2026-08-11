import { NextResponse } from "next/server";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { getLecturerSessionDetails } from "@/services/lecturer.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const lecturer = await requireRole("LECTURER");
    const resolvedParams = await params;
    const data = await getLecturerSessionDetails(lecturer.id, resolvedParams.sessionId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { success: false, message: "Unable to load session attendance details." },
      { status: 500 },
    );
  }
}
