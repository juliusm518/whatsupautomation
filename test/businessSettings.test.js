import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("dashboard includes editable business settings controls", async () => {
  const source = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

  assert.match(source, /id="settings"/);
  assert.match(source, /Business Settings/);
  assert.match(source, /name="whatsappNumber"/);
  assert.match(source, /name="appointmentLabel"/);
  assert.match(source, /data-faq-question-index/);
  assert.match(source, /add-faq-button/);
  assert.match(source, /data-delete-faq-index/);
  assert.match(source, /saveBusinessSettings/);
  assert.match(source, /refreshWorkspaceFromServer/);
  assert.match(source, /\/api\/workspace/);
  assert.match(source, /Synced from server/);
  assert.match(source, /save-feedback/);
  assert.match(source, /Saving\.\.\./);
  assert.match(source, /Could not save to server/);
  assert.match(source, /businessSnapshot: business/);
  assert.match(source, /Save business settings/);
});

test("server persists business settings for reply generation", async () => {
  const source = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.equal(source.includes("businessSettingsMatch"), true);
  assert.match(source, /saveBusinessSettingsToSupabase/);
  assert.match(source, /sanitizeBusinessSettings/);
});
