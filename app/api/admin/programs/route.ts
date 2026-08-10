import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { pageQuerySchema, programSchema } from "@/lib/admin-validations";
import { createProgram, isPrismaUniqueError, listPrograms } from "@/services/admin/admin.service";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
    const query = pageQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json({ success: true, data: await listPrograms(query.search) });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ success: false, message: "Invalid program data." }, { status: 400 });
    return NextResponse.json({ success: false, message: "Unable to load programs." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole("ADMIN");
    const input = programSchema.parse(await request.json());
    return NextResponse.json({ success: true, data: await createProgram(admin.id, input) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ success: false, message: "Invalid program data." }, { status: 400 });
    if (isPrismaUniqueError(error)) return NextResponse.json({ success: false, message: "Program code already exists." }, { status: 409 });
    return NextResponse.json({ success: false, message: "Unable to create program." }, { status: 500 });
  }
}
