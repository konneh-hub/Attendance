import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { studentAttendanceSubmissionSchema } from "@/lib/student-validations";
import { submitStudentAttendance } from "@/services/student.service";

export async function POST(request: Request) {
  try {
    const student = await requireRole("STUDENT");
    const input = studentAttendanceSubmissionSchema.parse(await request.json());
    const result = await submitStudentAttendance(student.id, input);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    }

    if (error instanceof ZodError) {
      return NextResponse.json({ success: false, message: "Invalid attendance submission." }, { status: 400 });
    }

    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: false, message: "Unable to submit attendance." }, { status: 500 });
  }
}
