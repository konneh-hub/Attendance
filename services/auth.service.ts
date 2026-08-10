import "server-only";

import { AccountStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { createSession, revokeSession, revokeAllUserSessions } from "@/lib/session";

export class AuthenticationError extends Error {
	constructor(
		message = "Invalid credentials.",
		public readonly statusCode = 401,
	) {
		super(message);
		this.name = "AuthenticationError";
	}
}

export class AccountUnavailableError extends AuthenticationError {
	constructor() {
		super("This account is unavailable.", 403);
		this.name = "AccountUnavailableError";
	}
}

const safeUserSelect = {
	id: true,
	email: true,
	fullName: true,
	role: true,
	status: true,
	lastLoginAt: true,
} as const;

export async function authenticateCredentials(identifier: string, password: string) {
	const email = identifier.trim().toLowerCase();
	const user = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		throw new AuthenticationError();
	}

	if (user.status !== AccountStatus.ACTIVE) {
		throw new AccountUnavailableError();
	}

	const passwordMatches = await verifyPassword(password, user.passwordHash);

	if (!passwordMatches) {
		throw new AuthenticationError();
	}

	const updatedUser = await prisma.user.update({
		where: { id: user.id },
		data: { lastLoginAt: new Date() },
		select: safeUserSelect,
	});

	await createSession(user.id);

	return updatedUser;
}

export { revokeSession, revokeAllUserSessions };
