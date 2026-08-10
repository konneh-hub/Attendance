import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ success: true, authenticated: false, user: null });
    }

    return NextResponse.json({ success: true, authenticated: true, user });
  } catch {
    return NextResponse.json(
      {
        success: false,
        authenticated: false,
        user: null,
        message: "Unable to validate the session.",
      },
      { status: 500 },
    );
  }
}
