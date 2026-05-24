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
  assert.match(source, /dashboardViewFromHash/);
  assert.match(source, /#dashboard/);
  assert.match(source, /view-hidden/);
  assert.match(source, /Prospect Demo Mode/);
  assert.match(source, /Six ready-to-test WhatsApp automation templates/);
  assert.match(source, /copy-demo-link-button/);
  assert.match(source, /Copy demo link/);
  assert.match(source, /copyDemoLink/);
  assert.match(source, /navigator\.clipboard/);
  assert.match(source, /demo-run-pilot-tests-button/);
  assert.match(source, /demo-export-pilot-report-button/);
  assert.match(source, /renderProspectDemo/);
  assert.match(source, /bindProspectDemoEvents/);
  assert.match(source, /demoBusinessCard/);
  assert.match(source, /pilotResultSummary/);
  assert.match(source, /reset-conversations-button/);
  assert.match(source, /resetBusinessConversations/);
  assert.match(source, /Demo conversations reset/);
  assert.match(source, /showPilotConversations/);
  assert.match(source, /show-pilot-conversations-toggle/);
  assert.match(source, /Show tests/);
  assert.match(source, /Test Mode/);
  assert.match(source, /currentInboxConversations/);
  assert.match(source, /inboxEmptyState/);
  assert.match(source, /Reply Test/);
  assert.match(source, /reply-test-form/);
  assert.match(source, /Test reply/);
  assert.match(source, /reply-preview/);
  assert.match(source, /Test inbox/);
  assert.match(source, /Message Testing/);
  assert.match(source, /Customer reply checks/);
  assert.match(source, /Pilot Validation/);
  assert.match(source, /Template test suite/);
  assert.doesNotMatch(source, /FAQ Answering/);
  assert.match(source, /test-inbox-form/);
  assert.match(source, /testInboxScenarios/);
  assert.match(source, /testScenarioProfile/);
  assert.match(source, /data-test-phone/);
  assert.match(source, /data-test-scenario/);
  assert.match(source, /Send test message/);
  assert.match(source, /Test message sent/);
  assert.match(source, /upsertLocalConversation/);
  assert.match(source, /Pilot Testing/);
  assert.match(source, /Test results/);
  assert.match(source, /run-pilot-tests-button/);
  assert.match(source, /Run pilot tests/);
  assert.match(source, /export-pilot-report-button/);
  assert.match(source, /Export report/);
  assert.match(source, /buildPilotTestReport/);
  assert.match(source, /downloadPilotTestReport/);
  assert.match(source, /ReplyPilot Pilot Test Report/);
  assert.match(source, /clear-pilot-tests-button/);
  assert.match(source, /Clear pilot tests/);
  assert.match(source, /clearPilotTestConversations/);
  assert.match(source, /isPilotConversation/);
  assert.match(source, /Refreshing workspace before pilot checks/);
  assert.match(source, /pilotChecksForBusiness/);
  assert.match(source, /runPilotCheck/);
  assert.match(source, /testSuiteStateFromResults/);
  assert.match(source, /pilot-/);
  assert.match(source, /how much is aircon servicing/);
  assert.match(source, /plumbing repair visit/);
  assert.match(source, /renovation consultation/);
  assert.match(source, /bulk order pickup/);
  assert.match(source, /cake order/);
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
  assert.match(styles, /\.test-inbox-panel/);
  assert.match(styles, /\.automation-section-header/);
  assert.match(styles, /\.pilot-validation-header/);
  assert.match(styles, /\.scenario-grid/);
  assert.match(styles, /\.phone-chip/);
  assert.match(styles, /\.test-reply-card/);
  assert.match(styles, /\.test-mode-toggle/);
  assert.match(styles, /\.conversation-item\.test-mode/);
  assert.match(styles, /\.test-mode-badge/);
  assert.match(styles, /\.conversation-labels/);
  assert.match(styles, /\.view-hidden/);
  assert.match(styles, /display: none/);
  assert.match(styles, /\.demo-shell/);
  assert.match(styles, /\.demo-template-grid/);
  assert.match(styles, /\.demo-template-card/);
  assert.match(styles, /\.demo-status-panel/);
  assert.match(styles, /\.demo-actions/);
  assert.match(styles, /\.demo-summary/);
  assert.match(styles, /\.demo-header-actions/);
  assert.match(styles, /\.pilot-test-panel/);
  assert.match(styles, /\.pilot-test-actions/);
  assert.match(styles, /\.pilot-test-results/);
  assert.match(styles, /\.pilot-test-result\.passed/);
  assert.match(styles, /\.pilot-test-result\.failed/);
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
  assert.match(source, /pilot-tests\/cleanup/);
  assert.match(source, /isPilotConversation/);
  assert.match(source, /deleteConversationsFromSupabase/);
  assert.match(source, /deleteBusinessConversationsFromSupabase/);
  assert.match(source, /createStarterConversation/);
  assert.match(source, /sanitizeBusinessSettings/);
  assert.match(source, /calendarForBusiness/);
  assert.match(source, /mergeCalendarSettings/);
  assert.match(source, /fallback\.busyWindows/);
  assert.match(source, /sanitizeFaqs/);
  assert.match(source, /hydrateBusinessCalendarBusyWindows/);
  assert.match(source, /hydrateBusinessCalendarForIncoming/);
  assert.doesNotMatch(source, /booking-confirmed/);
});

test("server seeds missing Supabase pilot templates from code defaults", async () => {
  const store = await readFile(new URL("../src/storage/supabaseStore.js", import.meta.url), "utf8");

  assert.match(store, /createDemoWorkspace/);
  assert.match(store, /ensureDemoTemplatesInSupabase/);
  assert.match(store, /on_conflict=id/);
  assert.match(store, /on_conflict=business_id,question/);
  assert.match(store, /resolution=ignore-duplicates/);
  assert.match(store, /appointment_label/);
});

test("server continues chats by business and phone number", async () => {
  const source = await readFile(new URL("../server.js", import.meta.url), "utf8");
  const store = await readFile(new URL("../src/storage/supabaseStore.js", import.meta.url), "utf8");

  assert.match(source, /function normalizePhone/);
  assert.match(source, /function findLatestConversationForIncoming/);
  assert.match(source, /function buildContextualIncoming/);
  assert.match(source, /function mergeConversation/);
  assert.match(source, /Latest customer message/);
  assert.match(source, /Previous chat context/);
  assert.match(source, /messagesToSave/);
  assert.match(source, /upsertWorkspaceConversation/);
  assert.match(store, /options = \{\}/);
  assert.match(store, /options\.messages/);
  assert.match(store, /on_conflict=id/);
  assert.match(store, /on_conflict=conversation_id/);
  assert.match(store, /resolution=merge-duplicates/);
  assert.match(store, /deleteConversationsFromSupabase/);
  assert.match(store, /conversation_id=in/);
});
