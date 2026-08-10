import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { pageQuerySchema, userCreateSchema } from "@/lib/admin-validations";
import { isPrismaUniqueError, createAdminUser, listUsers } from "@/services/admin/admin.service";

function errorResponse(error: unknown, fallback: string) {
  if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
  if (error instanceof ZodError) return NextResponse.json({ success: false, message: "Invalid user data." }, { status: 400 });
  if (isPrismaUniqueError(error)) return NextResponse.json({ success: false, message: "A record with that unique value already exists." }, { status: 409 });
  return NextResponse.json({ success: false, message: fallback }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    await requireRole("ADMIN");
    const url = new URL(request.url);
    const query = pageQuerySchema.parse(Object.fromEntries(url.searchParams));
    return NextResponse.json({ success: true, data: await listUsers(query.search, query.page, query.pageSize) });
  } catch (error) {
    return errorResponse(error, "Unable to load users.");
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole("ADMIN");
    const input = userCreateSchema.parse(await request.json());
    const user = await createAdminUser({ ...input, actorUserId: admin.id });
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error) {
    return errorResponse(error, "Unable to create user.");
  }
}
