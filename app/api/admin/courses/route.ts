import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { courseSchema, pageQuerySchema } from "@/lib/admin-validations";
import { createCourse, isPrismaUniqueError, listCourses } from "@/services/admin/admin.service";

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
    const query = pageQuerySchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    return NextResponse.json({ success: true, data: await listCourses(query.search, query.page, query.pageSize) });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ success: false, message: "Invalid course data." }, { status: 400 });
    return NextResponse.json({ success: false, message: "Unable to load courses." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole("ADMIN");
    const input = courseSchema.parse(await request.json());
    return NextResponse.json({ success: true, data: await createCourse(admin.id, input) }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    if (error instanceof ZodError) return NextResponse.json({ success: false, message: "Invalid course data." }, { status: 400 });
    if (isPrismaUniqueError(error)) return NextResponse.json({ success: false, message: "Course code already exists." }, { status: 409 });
    if (error instanceof Error && error.message.includes("not found")) return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    return NextResponse.json({ success: false, message: "Unable to create course." }, { status: 500 });
  }
}
