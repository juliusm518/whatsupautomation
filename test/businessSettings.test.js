import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("dashboard includes editable business settings controls", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(source, /id="settings"/);
  assert.match(source, /Business Settings/);
  assert.match(source, /name="whatsappNumber"/);
  assert.match(source, /name="appointmentLabel"/);
  assert.match(source, /Booking Calendar/);
  assert.match(source, /Google availability/);
  assert.match(source, /name="calendarId"/);
  assert.match(source, /buildAvailabilityPreview/);
  assert.match(source, /calendarForBusiness/);
  assert.match(source, /slot-chip/);
  assert.match(source, /data-faq-question-index/);
  assert.match(source, /add-faq-button/);
  assert.match(source, /data-delete-faq-index/);
  assert.match(source, /save-faqs-button/);
  assert.match(source, /Save knowledge base/);
  assert.match(source, /saveKnowledgeBase/);
  assert.match(source, /unsaved Knowledge Base changes/i);
  assert.match(source, /faqDirty/);
  assert.match(source, /saveBusinessSettings/);
  assert.match(source, /refreshWorkspaceFromServer/);
  assert.match(source, /refresh-workspace-button/);
  assert.match(source, /Refreshing from server/);
  assert.match(source, /reset-conversations-button/);
  assert.match(source, /resetBusinessConversations/);
  assert.match(source, /Demo conversations reset/);
  assert.match(source, /Reply Test/);
  assert.match(source, /reply-test-form/);
  assert.match(source, /Test reply/);
  assert.match(source, /reply-preview/);
  assert.match(source, /getAssistantReply/);
  assert.match(source, /\/api\/workspace/);
  assert.match(source, /Synced from server/);
  assert.match(source, /save-feedback/);
  assert.match(source, /Saving\.\.\./);
  assert.match(source, /Could not save to server/);
  assert.match(source, /businessSnapshot: business/);
  assert.match(source, /Save business settings/);
});

test("dashboard styles toast notifications", async () => {
  const styles = await readFile(new URL("../src/buttonFeedback.css", import.meta.url), "utf8");

  assert.match(styles, /fallback-toast-region/);
  assert.match(styles, /\.toast/);
  assert.match(styles, /toast-in/);
  assert.match(styles, /\.toast\.error/);
});

test("dashboard styles the booking calendar preview", async () => {
  const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

  assert.match(styles, /\.calendar-summary/);
  assert.match(styles, /\.slot-list/);
  assert.match(styles, /\.slot-chip/);
});

test("dashboard styles the pilot onboarding checklist", async () => {
  const styles = await readFile(new URL("../src/onboardingChecklist.css", import.meta.url), "utf8");

  assert.match(styles, /\.setup-panel/);
  assert.match(styles, /\.setup-checklist/);
  assert.match(styles, /\.setup-step\.done/);
  assert.match(styles, /\.setup-step\.pending/);
  assert.match(styles, /\.setup-actions/);
  assert.match(styles, /\.setup-action/);
  assert.match(styles, /repeat\(5, minmax\(0, 1fr\)\)/);
});

test("dashboard loads global button click feedback", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const script = await readFile(new URL("../src/buttonFeedback.js", import.meta.url), "utf8");
  const styles = await readFile(new URL("../src/buttonFeedback.css", import.meta.url), "utf8");

  assert.match(html, /buttonFeedback\.css/);
  assert.match(html, /buttonFeedback\.js/);
  assert.match(script, /button-clicked/);
  assert.match(script, /showToast/);
  assert.match(script, /Knowledge base saved/);
  assert.match(script, /Business settings saved/);
  assert.match(script, /Demo conversations reset/);
  assert.match(script, /Reply test generated/);
  assert.match(script, /Could not save knowledge base/);
  assert.match(styles, /button-clicked/);
});

test("dashboard loads the pilot onboarding checklist", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const script = await readFile(new URL("../src/onboardingChecklist.js", import.meta.url), "utf8");

  assert.match(html, /onboardingChecklist\.css/);
  assert.match(html, /onboardingChecklist\.js/);
  assert.match(script, /Pilot Onboarding/);
  assert.match(script, /Go-live checklist/);
  assert.match(script, /Business profile/);
  assert.match(script, /Knowledge base/);
  assert.match(script, /Reply test/);
  assert.match(script, /WhatsApp webhook/);
  assert.match(script, /Server sync/);
  assert.match(script, /Edit profile/);
  assert.match(script, /Edit FAQs/);
  assert.match(script, /Run test reply/);
  assert.match(script, /Copy webhook URL/);
  assert.match(script, /Open Meta setup/);
  assert.match(script, /Refresh server/);
  assert.match(script, /copyWebhookUrl/);
  assert.match(script, /hydrateChecklistActions/);
  assert.match(script, /existingPanel/);
  assert.match(script, /developers\.facebook\.com\/apps/);
});

test("server persists business settings for reply generation", async () => {
  const source = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.equal(source.includes("businessSettingsMatch"), true);
  assert.equal(source.includes("businessFaqsMatch"), true);
  assert.match(source, /saveBusinessSettingsToSupabase/);
  assert.match(source, /saveFaqsToSupabase/);
  assert.equal(source.includes("conversations\\/reset"), true);
  assert.match(source, /deleteBusinessConversationsFromSupabase/);
  assert.match(source, /createStarterConversation/);
  assert.match(source, /sanitizeBusinessSettings/);
  assert.match(source, /calendarForBusiness/);
  assert.match(source, /mergeCalendarSettings/);
  assert.match(source, /fallback\.busyWindows/);
  assert.match(source, /sanitizeFaqs/);
});
