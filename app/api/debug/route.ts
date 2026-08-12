import { NextResponse } from "next/server";

import { AuthorizationError, requireRole } from "@/lib/authorization";

export async function GET() {
  try {
    const admin = await requireRole("ADMIN");

    return NextResponse.json({
      success: true,
      currentUser: { id: admin.id, email: admin.email, role: admin.role },
      nodeEnv: process.env.NODE_ENV,
      nextRoot: process.env.NEXT_PUBLIC_APP_URL ?? null,
      databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error("Debug endpoint failed.", error);
    return NextResponse.json(
      { success: false, message: "Unable to load debug data." },
      { status: 500 },
    );
  }
}
