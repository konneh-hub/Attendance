const baseUrl = "http://localhost:3000";
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

async function login(identifier) {
  const response = await request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  assert(response.status === 200, `${identifier} login failed`);
  return cookieFrom(response);
}

async function access(path, cookie) {
  const response = await request(path, cookie ? { headers: { cookie } } : {});
  return response.status;
}

async function logout(cookie) {
  await request("/api/auth/logout", { method: "POST", headers: { cookie } });
}

async function main() {
  assert(password, "SEED_ADMIN_PASSWORD is required");

  assert(await access("/api/admin/access") === 401, "anonymous admin access was not rejected");
  assert(await access("/api/lecturer/access") === 401, "anonymous lecturer access was not rejected");
  assert(await access("/api/student/access") === 401, "anonymous student access was not rejected");

  const adminCookie = await login("admin@example.edu");
  assert(await access("/api/admin/access", adminCookie) === 200, "admin could not access admin boundary");
  assert(await access("/api/lecturer/access", adminCookie) === 403, "admin unexpectedly passed lecturer equality boundary");
  assert(await access("/api/student/access", adminCookie) === 403, "admin unexpectedly passed student equality boundary");
  await logout(adminCookie);

  const lecturerCookie = await login("lecturer@example.edu");
  assert(await access("/api/admin/access", lecturerCookie) === 403, "lecturer accessed admin boundary");
  assert(await access("/api/lecturer/access", lecturerCookie) === 200, "lecturer could not access lecturer boundary");
  assert(await access("/api/student/access", lecturerCookie) === 403, "lecturer accessed student boundary");
  await logout(lecturerCookie);

  const studentCookie = await login("student@example.edu");
  assert(await access("/api/admin/access", studentCookie) === 403, "student accessed admin boundary");
  assert(await access("/api/lecturer/access", studentCookie) === 403, "student accessed lecturer boundary");
  assert(await access("/api/student/access", studentCookie) === 200, "student could not access student boundary");
  await logout(studentCookie);

  console.log("Authorization smoke tests passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
