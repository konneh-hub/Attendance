import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { sessionStatusUpdateSchema } from "@/lib/lecturer-validations";
import { updateLecturerSessionStatus } from "@/services/lecturer.service";

export async function PATCH(request: Request) {
  try {
    const lecturer = await requireRole("LECTURER");
    const input = sessionStatusUpdateSchema.parse(await request.json());
    const result = await updateLecturerSessionStatus(lecturer.id, input.sessionId, input.action);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, message: "Invalid session status payload." }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: "Unable to update session status." }, { status: 500 });
  }
}
