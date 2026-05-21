import test from "node:test";
import assert from "node:assert/strict";
import { createDemoWorkspace } from "../src/core/automationEngine.js";

test("ships pilot templates for the first six target business types", () => {
  const workspace = createDemoWorkspace();
  const businessTypes = workspace.businesses.map((business) => business.type);

  assert.deepEqual(businessTypes, [
    "Tuition Centre",
    "Aircon Servicing",
    "Plumbing",
    "Renovation",
    "Hawker Stall",
    "Bakery"
  ]);
  assert.equal(workspace.businesses.every((business) => business.faqs.length >= 3), true);
  assert.equal(workspace.businesses.every((business) => business.appointmentLabel), true);
  assert.equal(workspace.businesses.find((business) => business.id === "tuition-hub").calendar.calendarId, "primary");

  const conversationBusinessIds = new Set(workspace.conversations.map((conversation) => conversation.businessId));
  for (const business of workspace.businesses) {
    assert.equal(conversationBusinessIds.has(business.id), true);
  }
});
