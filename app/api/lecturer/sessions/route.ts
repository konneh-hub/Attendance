import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { createSessionSchema } from "@/lib/lecturer-validations";
import { createLecturerSession, getLecturerSessions } from "@/services/lecturer.service";

export async function GET() {
  try {
    const lecturer = await requireRole("LECTURER");
    return NextResponse.json({ success: true, data: await getLecturerSessions(lecturer.id) });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }

    return NextResponse.json({ success: false, message: "Unable to load lecturer sessions." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const lecturer = await requireRole("LECTURER");
    const input = createSessionSchema.parse(await request.json());
    const session = await createLecturerSession(lecturer.id, input);

    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, message: "Invalid session payload." }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: "Unable to create attendance session." }, { status: 500 });
  }
}
