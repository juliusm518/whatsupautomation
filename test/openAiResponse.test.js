import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("server extracts text from Responses API output arrays", async () => {
  const source = await readFile(new URL("../server.js", import.meta.url), "utf8");
  assert.match(source, /function extractOpenAiText/);
  assert.match(source, /output_text/);
  assert.equal(source.includes("item.content"), true);
});

test("server does not let AI rewrite protected booking conflict replies", async () => {
  const source = await readFile(new URL("../server.js", import.meta.url), "utf8");

  assert.match(source, /function isProtectedEngineReply/);
  assert.match(source, /already booked/i);
  assert.match(source, /if \(!isProtectedEngineReply\(result\.reply\.text\)\)/);
});
