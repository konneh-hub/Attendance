import { NextResponse } from "next/server";

import { AuthorizationError, requireRole } from "@/lib/authorization";

export async function GET() {
  try {
    const user = await requireRole("STUDENT");
    return NextResponse.json({ success: true, role: user.role });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, message: "Unable to verify access." },
      { status: 500 },
    );
  }
}
