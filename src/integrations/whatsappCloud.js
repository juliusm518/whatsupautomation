const DEFAULT_GRAPH_VERSION = "v20.0";

export function verifyWhatsAppWebhook(url, verifyToken) {
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === verifyToken && challenge) {
    return { verified: true, challenge };
  }

  return { verified: false };
}

export function extractWhatsAppMessages(body, fallbackBusinessId = "tuition-hub") {
  if (body?.object !== "whatsapp_business_account") {
    return [
      {
        businessId: body.businessId,
        id: body.id,
        from: body.from,
        text: body.text,
        timestamp: body.timestamp
      }
    ];
  }

  const messages = [];

  for (const entry of body.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      const contactsByWaId = new Map((value.contacts || []).map((contact) => [contact.wa_id, contact]));

      for (const message of value.messages || []) {
        if (message.type !== "text" || !message.text?.body) {
          continue;
        }

        const contact = contactsByWaId.get(message.from);
        messages.push({
          businessId: process.env.WHATSAPP_BUSINESS_ID || fallbackBusinessId,
          id: message.id,
          from: message.from,
          customerName: contact?.profile?.name || "",
          text: message.text.body,
          timestamp: message.timestamp ? new Date(Number(message.timestamp) * 1000).toISOString() : undefined
        });
      }
    }
  }

  return messages;
}

export async function sendWhatsAppText({
  to,
  text,
  accessToken = process.env.WHATSAPP_ACCESS_TOKEN,
  phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID,
  graphVersion = process.env.WHATSAPP_GRAPH_VERSION || DEFAULT_GRAPH_VERSION,
  fetchImpl = fetch
}) {
  if (!accessToken || !phoneNumberId) {
    return { sent: false, skipped: true, reason: "WhatsApp Cloud API credentials are not configured" };
  }

  const response = await fetchImpl(`https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: String(to || "").replace(/\D/g, ""),
      type: "text",
      text: {
        preview_url: false,
        body: text
      }
    })
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      sent: false,
      skipped: false,
      status: response.status,
      error: payload.error?.message || "WhatsApp message failed"
    };
  }

  return { sent: true, payload };
}
