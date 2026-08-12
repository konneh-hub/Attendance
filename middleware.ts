import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPagePrefixes = ["/admin", "/lecturer", "/student"];
const protectedApiPrefixes = ["/api/admin", "/api/lecturer", "/api/student"];
const SESSION_COOKIE_NAME = "attendance_session";

export function middleware(request: NextRequest) {
	const pathname = request.nextUrl.pathname;
	const requiresAuthentication =
		protectedPagePrefixes.some((prefix) => pathname.startsWith(prefix)) ||
		protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix));

	if (!requiresAuthentication) {
		return NextResponse.next();
	}

	if (request.cookies.has(SESSION_COOKIE_NAME)) {
		return NextResponse.next();
	}

	if (pathname.startsWith("/api/")) {
		return NextResponse.json(
			{ success: false, message: "Authentication required." },
			{ status: 401 },
		);
	}

	const loginUrl = new URL("/login", request.url);
	loginUrl.searchParams.set("next", `${pathname}${request.nextUrl.search}`);

	return NextResponse.redirect(loginUrl);
}
