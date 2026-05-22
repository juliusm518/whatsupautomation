import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("build artifact includes dashboard assets and server integration modules", async () => {
  const buildScript = await readFile(new URL("../scripts/build.js", import.meta.url), "utf8");

  assert.match(buildScript, /src\/buttonFeedback\.css/);
  assert.match(buildScript, /privacy\.html/);
  assert.match(buildScript, /terms\.html/);
  assert.match(buildScript, /src\/buttonFeedback\.js/);
  assert.match(buildScript, /src\/onboardingChecklist\.css/);
  assert.match(buildScript, /src\/onboardingChecklist\.js/);
  assert.match(buildScript, /src\/integrations\/whatsappCloud\.js/);
  assert.match(buildScript, /listJavaScriptFiles\(join\("dist", "src"\)\)/);
  assert.match(buildScript, /!path\.endsWith\("buttonFeedback\.js"\)/);
  assert.match(buildScript, /!path\.endsWith\("onboardingChecklist\.js"\)/);
});
