import { NextResponse } from "next/server";

import { loginSchema } from "@/lib/validations";
import {
  AccountUnavailableError,
  AuthenticationError,
  authenticateCredentials,
} from "@/services/auth.service";

export async function POST(request: Request) {
  let payload: unknown;

  const rawBody = await request.text();
  const rawBodyLength = rawBody?.length ?? 0;

  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error(
      `Login payload parse failed. method=${request.method} contentType=${request.headers.get(
        "content-type",
      )} contentLength=${request.headers.get("content-length")} rawBodyLength=${rawBodyLength}`,
      rawBody ? rawBody.slice(0, 200) : "<empty>",
      {
        error: error instanceof Error ? error.message : String(error),
      },
    );

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

    console.error("Authentication request failed.", error);
    return NextResponse.json(
      { success: false, message: "Authentication is temporarily unavailable." },
      { status: 500 },
    );
  }
}
