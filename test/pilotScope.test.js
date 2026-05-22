import test from "node:test";
import assert from "node:assert/strict";
import {
  createDemoWorkspace,
  createStarterConversation,
  handleIncomingMessage,
  matchFaq
} from "../src/core/automationEngine.js";

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

test("pilot templates answer realistic FAQ, booking, escalation, and starter flows", () => {
  const workspace = createDemoWorkspace();
  const scenarios = {
    "tuition-hub": {
      faq: "How much are classes?",
      booking: "Hi, I am Template Test 9123 4567. Can I book a trial lesson tomorrow at 2pm?",
      escalation: "Urgent, can a human call me about class placement now?",
      faqAnswer: "$180",
      appointmentLabel: "trial lesson"
    },
    "aircon-pro": {
      faq: "How much is aircon servicing for 3 units?",
      booking: "Hi, I am Template Test 9123 4567. Can I book aircon servicing tomorrow at 2pm?",
      escalation: "Urgent, my aircon is leaking badly. Can a human call me now?",
      faqAnswer: "$35",
      appointmentLabel: "service slot"
    },
    "plumbing-care": {
      faq: "How much is plumbing repair for a clogged sink?",
      booking: "Hi, I am Template Test 9123 4567. Can I book a plumbing repair visit tomorrow at 2pm?",
      escalation: "Urgent, my kitchen pipe is leaking badly. Can a human call me now?",
      faqAnswer: "$40",
      appointmentLabel: "repair visit"
    },
    "reno-studio": {
      faq: "Do you provide renovation quotes?",
      booking: "Hi, I am Template Test 9123 4567. Can I schedule a renovation consultation tomorrow at 2pm?",
      escalation: "Urgent, can a human call me about a renovation issue now?",
      faqAnswer: "floor plan",
      appointmentLabel: "renovation consultation"
    },
    "hawker-kitchen": {
      faq: "Can I place a bulk order?",
      booking: "Hi, I am Template Test 9123 4567. Can I book a bulk order pickup tomorrow at 12pm?",
      escalation: "Urgent, can a human call me about a large lunch order now?",
      faqAnswer: "one day's notice",
      appointmentLabel: "bulk order pickup"
    },
    "bakery-bites": {
      faq: "Do you make custom cakes and how much are cakes?",
      booking: "Hi, I am Template Test 9123 4567. Can I book a cake order tomorrow at 2pm?",
      escalation: "Urgent, can a human call me about a cake order change now?",
      faqAnswer: "custom birthday",
      appointmentLabel: "cake order"
    }
  };

  for (const business of workspace.businesses) {
    const scenario = scenarios[business.id];
    const faq = matchFaq(scenario.faq, business.faqs);
    assert.match(faq.answer, new RegExp(escapeRegExp(scenario.faqAnswer), "i"), `${business.id} FAQ should answer realistic customer question`);

    const booking = handleIncomingMessage({
      business,
      message: {
        from: "+65 9000 0001",
        text: scenario.booking
      },
      now: new Date("2026-05-23T02:00:00.000Z")
    });
    assert.equal(booking.intent, "appointment", `${business.id} booking should be an appointment`);
    assert.match(booking.reply.text, new RegExp(escapeRegExp(scenario.appointmentLabel), "i"));
    assert.equal(booking.conversation.status, "qualified-lead");

    const escalation = handleIncomingMessage({
      business,
      message: {
        from: "+65 9000 0001",
        text: scenario.escalation
      },
      now: new Date("2026-05-23T02:00:00.000Z")
    });
    assert.equal(escalation.intent, "escalation", `${business.id} escalation should reach a human`);
    assert.equal(escalation.conversation.status, "needs-human");

    const starter = createStarterConversation(business, new Date("2026-05-23T02:00:00.000Z"));
    assert.equal(starter.businessId, business.id);
    assert.equal(starter.messages.length, 2);
    assert.match(starter.messages[1].text, new RegExp(escapeRegExp(business.name), "i"));
  }
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
