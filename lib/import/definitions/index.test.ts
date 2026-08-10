import test from "node:test";
import assert from "node:assert/strict";

import { getImportDefinition } from "./index";

test("import definitions support admin modules", () => {
  assert.ok(getImportDefinition("users"), "users definition should exist");
  assert.ok(getImportDefinition("students"), "students definition should exist");
  assert.ok(getImportDefinition("lecturers"), "lecturers definition should exist");
  assert.ok(getImportDefinition("departments"), "departments definition should exist");
  assert.ok(getImportDefinition("courses"), "courses definition should exist");
  assert.equal(getImportDefinition("programmes"), null, "programmes should not be invented without a schema model");
});
