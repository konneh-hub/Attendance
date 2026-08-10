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

async function main() {
  assert(password, "SEED_ADMIN_PASSWORD is required");

  const endpoints = [
    "/api/admin/dashboard",
    "/api/admin/users",
    "/api/admin/students",
    "/api/admin/lecturers",
    "/api/admin/departments",
    "/api/admin/courses",
  ];

  for (const endpoint of endpoints) {
    const anonymous = await request(endpoint);
    assert(anonymous.status === 401, `${endpoint} did not reject anonymous access`);
  }

  const studentCookie = await login("student@example.edu");
  const studentAdminAttempt = await request("/api/admin/users", {
    method: "POST",
    headers: { cookie: studentCookie, "content-type": "application/json" },
    body: JSON.stringify({ role: "ADMIN", email: "spoof@example.edu" }),
  });
  assert(studentAdminAttempt.status === 403, "student role spoof reached admin API");

  const adminCookie = await login("admin@example.edu");
  for (const endpoint of endpoints) {
    const response = await request(endpoint, { headers: { cookie: adminCookie } });
    assert(response.status === 200, `${endpoint} rejected admin access`);
  }

  const invalidUser = await request("/api/admin/users", {
    method: "POST",
    headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ role: "NOT_A_ROLE" }),
  });
  assert(invalidUser.status === 400, "invalid user input did not return 400");

  const invalidDepartment = await request("/api/admin/departments", {
    method: "POST",
    headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ name: "", code: "" }),
  });
  assert(invalidDepartment.status === 400, "invalid department input did not return 400");

  const invalidCourse = await request("/api/admin/courses", {
    method: "POST",
    headers: { cookie: adminCookie, "content-type": "application/json" },
    body: JSON.stringify({ code: "bad" }),
  });
  assert(invalidCourse.status === 400, "invalid course input did not return 400");

  console.log("Admin smoke tests passed.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
