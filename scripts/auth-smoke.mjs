import { createHash, randomBytes } from "node:crypto";
import { PrismaClient, AccountStatus } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = "http://localhost:3100";
const password = process.env.SEED_ADMIN_PASSWORD;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function request(path, options = {}) {
  return fetch(`${baseUrl}${path}`, options);
}

function cookieFrom(response) {
  return response.headers.getSetCookie()[0]?.split(";", 1)[0] ?? "";
}

async function login(identifier, expectedRole) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const body = await response.json();
  assert(response.status === 200 && body.success, `${identifier} login failed`);
  assert(body.user.role === expectedRole, `${identifier} role mismatch`);
  assert(!JSON.stringify(body).includes("passwordHash"), "passwordHash leaked from login");
  assert(!JSON.stringify(body).includes("attendance_session"), "session secret leaked from login");
  return cookieFrom(response);
}

async function main() {
  assert(password, "SEED_ADMIN_PASSWORD is required");

  for (const [identifier, role] of [
    ["admin@example.edu", "ADMIN"],
    ["lecturer@example.edu", "LECTURER"],
    ["student@example.edu", "STUDENT"],
  ]) {
    const cookie = await login(identifier, role);
    const sessionResponse = await request("/api/auth/session", { headers: { cookie } });
    const sessionBody = await sessionResponse.json();
    assert(sessionBody.authenticated === true, `${identifier} session lookup failed`);
    assert(!JSON.stringify(sessionBody).includes("passwordHash"), "passwordHash leaked from session");
    const logoutResponse = await request("/api/auth/logout", {
      method: "POST",
      headers: { cookie },
    });
    assert(logoutResponse.status === 200, `${identifier} logout failed`);
    const revokedResponse = await request("/api/auth/session", { headers: { cookie } });
    assert((await revokedResponse.json()).authenticated === false, `${identifier} session remained valid after logout`);
  }

  const invalidResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: "admin@example.edu", password: "wrong-password" }),
  });
  assert(invalidResponse.status === 401, "incorrect password was accepted");

  const unknownResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: "unknown@example.edu", password }),
  });
  assert(unknownResponse.status === 401, "unknown identifier was accepted");

  const inactiveUser = await prisma.user.update({
    where: { email: "student@example.edu" },
    data: { status: AccountStatus.INACTIVE },
  });
  const inactiveResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: inactiveUser.email, password }),
  });
  assert(inactiveResponse.status === 403, "inactive account was accepted");
  await prisma.user.update({ where: { id: inactiveUser.id }, data: { status: AccountStatus.ACTIVE } });

  const suspendedUser = await prisma.user.update({
    where: { email: "lecturer@example.edu" },
    data: { status: AccountStatus.SUSPENDED },
  });
  const suspendedResponse = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier: suspendedUser.email, password }),
  });
  assert(suspendedResponse.status === 403, "suspended account was accepted");
  await prisma.user.update({ where: { id: suspendedUser.id }, data: { status: AccountStatus.ACTIVE } });

  const token = randomBytes(32).toString("hex");
  const expiredSession = await prisma.session.create({
    data: {
      tokenHash: createHash("sha256").update(token).digest("hex"),
      userId: inactiveUser.id,
      expiresAt: new Date(Date.now() - 60_000),
    },
  });
  const expiredResponse = await request("/api/auth/session", {
    headers: { cookie: `attendance_session=${token}` },
  });
  assert((await expiredResponse.json()).authenticated === false, "expired session was accepted");
  const revokedExpired = await prisma.session.findUnique({ where: { id: expiredSession.id } });
  assert(revokedExpired?.revokedAt, "expired session was not revoked");

  console.log("Authentication smoke tests passed.");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
