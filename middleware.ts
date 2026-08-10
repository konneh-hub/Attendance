import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = ["/admin", "/lecturer", "/student"];

export function middleware(request: NextRequest) {
	const requiresAuthentication = protectedPrefixes.some((prefix) =>
		request.nextUrl.pathname.startsWith(prefix),
	);

	if (!requiresAuthentication || request.cookies.has("attendance_session")) {
		return NextResponse.next();
	}

	const loginUrl = new URL("/login", request.url);
	loginUrl.searchParams.set(
		"next",
		`${request.nextUrl.pathname}${request.nextUrl.search}`,
	);

	return NextResponse.redirect(loginUrl);
}
