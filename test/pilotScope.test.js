import test from "node:test";
import assert from "node:assert/strict";
import { createDemoWorkspace } from "../src/core/automationEngine.js";

test("ships pilot templates for tuition center and aircon servicing", () => {
  const workspace = createDemoWorkspace();
  const businessTypes = workspace.businesses.map((business) => business.type);

  assert.deepEqual(businessTypes, ["Tuition Centre", "Aircon Servicing"]);
  assert.equal(workspace.businesses.every((business) => business.faqs.length >= 3), true);
});
