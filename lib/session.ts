import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import type { AccountStatus, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "attendance_session";
export const SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 30;

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: AccountStatus;
  lastLoginAt: Date | null;
};

export type CurrentSession = {
  id: string;
  userId: string;
  expiresAt: Date;
  user: AuthenticatedUser;
};

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_LIFETIME_SECONDS,
  };
}

async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function createSession(userId: string) {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_LIFETIME_SECONDS * 1000);
  const session = await prisma.session.create({
    data: {
      tokenHash: hashSessionToken(rawToken),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    rawToken,
    sessionCookieOptions(expiresAt),
  );

  return { id: session.id, expiresAt: session.expiresAt };
}

export async function getSession(): Promise<CurrentSession | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!rawToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(rawToken) },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          status: true,
          lastLoginAt: true,
        },
      },
    },
  });

  if (!session) {
    return null;
  }

  const expired = session.expiresAt <= new Date();
  const revoked = session.revokedAt !== null;
  const unavailable = session.user.status !== "ACTIVE";

  if (expired || revoked || unavailable) {
    if (!session.revokedAt) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: new Date() },
      });
    }
    return null;
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    id: session.id,
    userId: session.userId,
    expiresAt: session.expiresAt,
    user: session.user,
  };
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export async function revokeSession() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  try {
    if (rawToken) {
      await prisma.session.updateMany({
        where: {
          tokenHash: hashSessionToken(rawToken),
          revokedAt: null,
        },
        data: { revokedAt: new Date() },
      });
    }
  } finally {
    await clearSessionCookie();
  }
}

export async function revokeAllUserSessions(userId: string) {
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
