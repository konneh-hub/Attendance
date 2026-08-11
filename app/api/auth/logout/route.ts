import { NextResponse } from "next/server";

import { revokeSession } from "@/services/auth.service";

export async function POST() {
  try {
    await revokeSession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout request failed.", error);
    return NextResponse.json(
      { success: false, message: "Unable to complete logout." },
      { status: 500 },
    );
  }
}
