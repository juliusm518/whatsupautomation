import test from "node:test";
import assert from "node:assert/strict";
import {
  extractWhatsAppMessages,
  sendWhatsAppText,
  verifyWhatsAppWebhook
} from "../src/integrations/whatsappCloud.js";

test("verifies Meta webhook challenge with the configured token", () => {
  const url = new URL("https://example.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=brightpath-test&hub.challenge=12345");

  assert.deepEqual(verifyWhatsAppWebhook(url, "brightpath-test"), {
    verified: true,
    challenge: "12345"
  });
  assert.deepEqual(verifyWhatsAppWebhook(url, "wrong-token"), { verified: false });
});

test("extracts text messages from WhatsApp Cloud API webhook payloads", () => {
  const messages = extractWhatsAppMessages({
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              contacts: [
                {
                  wa_id: "6591234567",
                  profile: { name: "Jamie" }
                }
              ],
              messages: [
                {
                  id: "wamid.test",
                  from: "6591234567",
                  timestamp: "1778923200",
                  type: "text",
                  text: { body: "Hi, how much is P5 Math?" }
                }
              ]
            }
          }
        ]
      }
    ]
  }, "tuition-hub");

  assert.equal(messages.length, 1);
  assert.equal(messages[0].businessId, "tuition-hub");
  assert.equal(messages[0].customerName, "Jamie");
  assert.equal(messages[0].text, "Hi, how much is P5 Math?");
});

test("skips WhatsApp delivery when credentials are not configured", async () => {
  const delivery = await sendWhatsAppText({
    to: "+65 9123 4567",
    text: "Hello",
    accessToken: "",
    phoneNumberId: ""
  });

  assert.equal(delivery.sent, false);
  assert.equal(delivery.skipped, true);
});

test("sends WhatsApp text replies through Graph API when configured", async () => {
  const calls = [];
  const delivery = await sendWhatsAppText({
    to: "+65 9123 4567",
    text: "Hello from BrightPath",
    accessToken: "secret-token",
    phoneNumberId: "123456789",
    graphVersion: "v20.0",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        json: async () => ({ messages: [{ id: "wamid.reply" }] })
      };
    }
  });

  assert.equal(delivery.sent, true);
  assert.equal(calls[0].url, "https://graph.facebook.com/v20.0/123456789/messages");
  assert.equal(JSON.parse(calls[0].options.body).to, "6591234567");
});
