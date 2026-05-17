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
  assert.match(source, /Save business settings/);
});
