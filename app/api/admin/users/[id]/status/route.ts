import { NextResponse } from "next/server";

import { AuthorizationError, requireRole } from "@/lib/authorization";
import { statusSchema } from "@/lib/admin-validations";
import { isPrismaUniqueError, updateUserStatus } from "@/services/admin/admin.service";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole("ADMIN");
    const { id } = await context.params;
    const input = statusSchema.parse(await request.json());
    return NextResponse.json({ success: true, data: await updateUserStatus(admin.id, id, input.status) });
  } catch (error) {
    if (error instanceof AuthorizationError) return NextResponse.json({ success: false, message: error.message }, { status: error.statusCode });
    if (isPrismaUniqueError(error)) return NextResponse.json({ success: false, message: "The requested value is already in use." }, { status: 409 });
    if (error instanceof Error && error.message.includes("last active administrator")) return NextResponse.json({ success: false, message: error.message }, { status: 409 });
    return NextResponse.json({ success: false, message: "Unable to update user status." }, { status: 500 });
  }
}
