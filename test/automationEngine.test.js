import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAvailabilityPreview,
  calendarForBusiness,
  createDemoWorkspace,
  createStarterConversation,
  detectIntent,
  extractLead,
  handleIncomingMessage,
  isWithinBusinessHours,
  matchFaq
} from "../src/core/automationEngine.js";

const workspace = createDemoWorkspace();
const tuition = workspace.businesses[0];
const aircon = workspace.businesses[1];

test("matches FAQ answers with useful confidence", () => {
  const match = matchFaq("Where are you located?", tuition.faqs);

  assert.equal(match.answer.includes("Tampines"), true);
  assert.equal(match.confidence > 0.18, true);
});

test("detects appointment requests and composes booking reply", () => {
  const result = handleIncomingMessage({
    business: tuition,
    message: {
      from: "+65 9000 1111",
      text: "Can I book a trial lesson tomorrow morning for P5 math?"
    },
    now: new Date("2026-05-16T03:00:00.000Z")
  });

  assert.equal(result.intent, "appointment");
  assert.equal(result.conversation.status, "qualified-lead");
  assert.match(result.reply.text, /trial lesson/i);
  assert.equal(result.lead.preferredTime, "Tomorrow");
});

test("extracts lead details from natural WhatsApp copy", () => {
  const lead = extractLead("Hi, I'm Jasmine 9123 4567. Need aircon repair today.", "", aircon);

  assert.equal(lead.name, "Jasmine");
  assert.equal(lead.phone, "91234567");
  assert.equal(lead.preferredTime, "Today");
  assert.match(lead.service, /Aircon/i);
});

test("routes urgent conversations to humans", () => {
  const result = handleIncomingMessage({
    business: aircon,
    message: {
      from: "+65 9000 1111",
      text: "Urgent, my aircon is leaking badly. Need a human to call me."
    }
  });

  assert.equal(result.intent, "escalation");
  assert.equal(result.needsHuman, true);
  assert.equal(result.conversation.status, "needs-human");
  assert.match(result.reply.text, /human operator/i);
});

test("applies Singapore business-hour automation", () => {
  const duringHours = isWithinBusinessHours(new Date("2026-05-16T03:00:00.000Z"), tuition.businessHours);
  const afterHours = isWithinBusinessHours(new Date("2026-05-16T14:00:00.000Z"), tuition.businessHours);

  assert.equal(duringHours, true);
  assert.equal(afterHours, false);
});

test("keeps multi-business knowledge separated", () => {
  assert.equal(detectIntent("How much is aircon servicing?", aircon), "lead");
  assert.equal(matchFaq("How much is aircon servicing?", aircon.faqs).answer.includes("$35"), true);
  assert.equal(matchFaq("How much is aircon servicing?", tuition.faqs)?.answer.includes("$35"), undefined);
});

test("creates a clean starter conversation for a selected business", () => {
  const conversation = createStarterConversation(tuition, new Date("2026-05-18T02:00:00.000Z"));

  assert.equal(conversation.businessId, tuition.id);
  assert.equal(conversation.customerPhone, "+65 9000 1122");
  assert.equal(conversation.messages.length, 2);
  assert.match(conversation.summary, /Tuition|classes|located/i);
});

test("attaches BrightPath Tuition to the primary Google calendar for booking tests", () => {
  const calendar = calendarForBusiness(tuition);
  const availability = buildAvailabilityPreview(tuition, {
    now: new Date("2026-05-21T01:00:00.000Z"),
    slotLimit: 3
  });

  assert.equal(calendar.provider, "google");
  assert.equal(calendar.calendarId, "primary");
  assert.equal(calendar.connected, true);
  assert.equal(availability.openSlots.length, 3);
  assert.match(availability.openSlots[0].label, /Thu|May|9:00/i);
});

test("blocks a BrightPath booking request when the requested calendar slot is busy", () => {
  const result = handleIncomingMessage({
    business: tuition,
    message: {
      from: "+65 9000 1122",
      text: "Hi, I want to book the BrightPath trial lesson today at 11am."
    },
    now: new Date("2026-05-21T23:10:00.000Z")
  });

  assert.equal(result.intent, "appointment");
  assert.match(result.reply.text, /already booked/i);
  assert.doesNotMatch(result.reply.text, /11am.*available/i);
});

test("uses the latest customer message when contextual follow-ups include older timing", () => {
  const result = handleIncomingMessage({
    business: tuition,
    message: {
      from: "+65 9000 1122",
      text: [
        "Latest customer message: Sorry I mean today, 11am",
        "Previous chat context: Previous requested time: Tomorrow. Previous customer message: Can book tomorrow morning 11am?"
      ].join("\n")
    },
    now: new Date("2026-05-21T23:10:00.000Z")
  });

  assert.equal(result.intent, "appointment");
  assert.equal(result.lead.preferredTime, "Today");
  assert.match(result.reply.text, /already booked/i);
});
