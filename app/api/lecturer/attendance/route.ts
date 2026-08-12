import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { attendanceSubmissionSchema } from "@/lib/lecturer-validations";
import { recordLecturerAttendance } from "@/services/lecturer.service";

export async function POST(request: Request) {
  try {
    const lecturer = await requireRole("LECTURER");
    const input = attendanceSubmissionSchema.parse(await request.json());
    const result = await recordLecturerAttendance(lecturer.id, input.sessionId, input.attendances);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: error.statusCode },
      );
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, message: "Invalid attendance payload." },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { success: false, message: "Unable to record attendance." },
      { status: 500 },
    );
  }
}
