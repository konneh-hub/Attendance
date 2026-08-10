import assert from "node:assert/strict";
import test from "node:test";

import { programSchema } from "./admin-validations.ts";

test("program schema accepts valid administration program data", () => {
  const parsed = programSchema.parse({
    code: "CS",
    name: "Computer Science",
    description: "Bachelor of Science in Computer Science",
  });

  assert.equal(parsed.code, "CS");
  assert.equal(parsed.name, "Computer Science");
  assert.equal(parsed.description, "Bachelor of Science in Computer Science");
});
