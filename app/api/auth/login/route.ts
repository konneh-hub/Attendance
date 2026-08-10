import { NextResponse } from "next/server";

import { loginSchema } from "@/lib/validations";
import {
  AccountUnavailableError,
  AuthenticationError,
  authenticateCredentials,
} from "@/services/auth.service";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid login request." },
      { status: 400 },
    );
  }

  const result = loginSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: "Enter a valid login identifier and password." },
      { status: 400 },
    );
  }

  try {
    const user = await authenticateCredentials(
      result.data.identifier,
      result.data.password,
    );

    return NextResponse.json({ success: true, user });
  } catch (error) {
    if (error instanceof AccountUnavailableError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode },
      );
    }

    console.error("Authentication request failed.");
    return NextResponse.json(
      { success: false, message: "Authentication is temporarily unavailable." },
      { status: 500 },
    );
  }
}
