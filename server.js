import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createDemoWorkspace,
  findBusiness,
  handleIncomingMessage
} from "./src/core/automationEngine.js";
import {
  loadWorkspaceFromSupabase,
  saveBusinessSettingsToSupabase,
  saveConversationToSupabase,
  saveFaqsToSupabase,
  supabaseConfigured
} from "./src/storage/supabaseStore.js";
import {
  extractWhatsAppMessages,
  sendWhatsAppText,
  verifyWhatsAppWebhook
} from "./src/integrations/whatsappCloud.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const publicRoot = __dirname;

await loadEnvFile();

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || "0.0.0.0";
const workspace = createDemoWorkspace();

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8"
};

async function loadEnvFile() {
  try {
    const source = await readFile(join(publicRoot, ".env"), "utf8");
    for (const line of source.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const separator = trimmed.indexOf("=");
      const key = trimmed.slice(0, separator).trim();
      const value = trimmed.slice(separator + 1).trim();
      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Environment variables can also be supplied by the host.
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  });
  response.end(JSON.stringify(payload));
}

async function readJson(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStatic(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const requestedPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const safePath = normalize(decodeURIComponent(requestedPath)).replace(/^(\.\.[/\\])+/, "");
  const filePath = join(publicRoot, safePath);
  const pathParts = safePath.split(/[\\/]/).filter(Boolean);

  if (!filePath.startsWith(publicRoot) || pathParts.some((part) => part.startsWith("."))) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  try {
    const file = await readFile(filePath);
    response.writeHead(200, {
      "content-type": mimeTypes[extname(filePath)] || "application/octet-stream",
      "cache-control": filePath.endsWith(".html") || filePath.endsWith(".js") || filePath.endsWith(".css")
        ? "no-store"
        : "public, max-age=300"
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

async function generateAiReply({ business, customerMessage, engineReply }) {
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OpenAI reply skipped: OPENAI_API_KEY is not configured");
    return engineReply;
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You write concise WhatsApp replies for Singapore SMEs. Use the provided business profile and keep replies helpful, specific, and human-escalation friendly."
        },
        {
          role: "user",
          content: JSON.stringify({
            business: {
              name: business.name,
              type: business.type,
              hours: business.businessHours,
              faqs: business.faqs
            },
            customerMessage,
            draftReply: engineReply
          })
        }
      ]
    })
  });

  if (!response.ok) {
    const errorPayload = await response.json().catch(() => ({}));
    console.warn(`OpenAI reply failed: ${response.status} ${errorPayload.error?.message || response.statusText}`);
    return engineReply;
  }

  const payload = await response.json();
  const aiText = extractOpenAiText(payload);
  if (!aiText) {
    console.warn("OpenAI reply failed: response did not include text output");
    return engineReply;
  }

  return aiText;
}

function extractOpenAiText(payload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  return (payload.output || [])
    .flatMap((item) => item.content || [])
    .filter((content) => content.type === "output_text" && content.text)
    .map((content) => content.text)
    .join("\n")
    .trim();
}

function sanitizeBusinessSettings(input, fallback) {
  const source = input || {};
  const hours = source.businessHours || {};
  const fallbackHours = fallback.businessHours || {};
  const days = Array.isArray(hours.days)
    ? hours.days.map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    : fallbackHours.days;

  return {
    ...fallback,
    name: cleanText(source.name, fallback.name),
    type: cleanText(source.type, fallback.type),
    owner: cleanText(source.owner, fallback.owner),
    whatsappNumber: cleanText(source.whatsappNumber, fallback.whatsappNumber),
    appointmentLabel: cleanText(source.appointmentLabel, fallback.appointmentLabel),
    autoReplyEnabled: typeof source.autoReplyEnabled === "boolean" ? source.autoReplyEnabled : fallback.autoReplyEnabled,
    escalationEnabled: typeof source.escalationEnabled === "boolean" ? source.escalationEnabled : fallback.escalationEnabled,
    businessHours: {
      timeZone: cleanText(hours.timeZone, fallbackHours.timeZone || "Asia/Singapore"),
      days: days?.length ? [...new Set(days)].sort((a, b) => a - b) : fallbackHours.days,
      open: isTimeValue(hours.open) ? hours.open : fallbackHours.open,
      close: isTimeValue(hours.close) ? hours.close : fallbackHours.close
    },
    faqs: Array.isArray(source.faqs)
      ? source.faqs
        .map((faq) => ({
          question: cleanText(faq.question, ""),
          answer: cleanText(faq.answer, "")
        }))
        .filter((faq) => faq.question && faq.answer)
      : fallback.faqs
  };
}

function sanitizeFaqs(input, fallbackFaqs = []) {
  const faqs = Array.isArray(input) ? input : fallbackFaqs;
  const cleanedFaqs = faqs
    .map((faq) => ({
      question: cleanText(faq.question, ""),
      answer: cleanText(faq.answer, "")
    }))
    .filter((faq) => faq.question && faq.answer);

  return cleanedFaqs.length ? cleanedFaqs : fallbackFaqs;
}

function cleanText(value, fallback) {
  const cleaned = String(value || "").trim();
  return cleaned || fallback;
}

function isTimeValue(value) {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

async function handleApi(request, response) {
  const url = new URL(request.url, `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/workspace") {
    if (supabaseConfigured()) {
      const persistedWorkspace = await loadWorkspaceFromSupabase();
      sendJson(response, 200, persistedWorkspace);
      return;
    }

    sendJson(response, 200, workspace);
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/whatsapp/webhook") {
    const verification = verifyWhatsAppWebhook(url, process.env.WHATSAPP_VERIFY_TOKEN || "");

    if (verification.verified) {
      response.writeHead(200, { "content-type": "text/plain; charset=utf-8" });
      response.end(verification.challenge);
      return;
    }

    response.writeHead(403, { "content-type": "text/plain; charset=utf-8" });
    response.end("Webhook verification failed");
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/simulator/message") {
    try {
      const body = await readJson(request);
      const result = await processIncomingMessages(body, { sendToWhatsApp: false });
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message || "Invalid simulator payload" });
    }
    return;
  }

  const businessSettingsMatch = url.pathname.match(/^\/api\/businesses\/([^/]+)\/settings$/);
  if (request.method === "PUT" && businessSettingsMatch) {
    try {
      const body = await readJson(request);
      const activeWorkspace = supabaseConfigured() ? await loadWorkspaceFromSupabase() : workspace;
      const existingBusiness = findBusiness(activeWorkspace.businesses, decodeURIComponent(businessSettingsMatch[1]));

      if (!existingBusiness) {
        sendJson(response, 404, { error: "Business not found" });
        return;
      }

      const business = sanitizeBusinessSettings(body.business, existingBusiness);
      business.faqs = existingBusiness.faqs;

      if (supabaseConfigured()) {
        await saveBusinessSettingsToSupabase(business);
      } else {
        const index = workspace.businesses.findIndex((item) => item.id === business.id);
        workspace.businesses[index] = business;
      }

      sendJson(response, 200, { ok: true, business });
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message || "Invalid business settings payload" });
    }
    return;
  }

  const businessFaqsMatch = url.pathname.match(/^\/api\/businesses\/([^/]+)\/faqs$/);
  if (request.method === "PUT" && businessFaqsMatch) {
    try {
      const body = await readJson(request);
      const activeWorkspace = supabaseConfigured() ? await loadWorkspaceFromSupabase() : workspace;
      const existingBusiness = findBusiness(activeWorkspace.businesses, decodeURIComponent(businessFaqsMatch[1]));

      if (!existingBusiness) {
        sendJson(response, 404, { error: "Business not found" });
        return;
      }

      const business = {
        ...existingBusiness,
        faqs: sanitizeFaqs(body.faqs, existingBusiness.faqs)
      };

      if (supabaseConfigured()) {
        await saveFaqsToSupabase(business);
      } else {
        const index = workspace.businesses.findIndex((item) => item.id === business.id);
        workspace.businesses[index] = business;
      }

      sendJson(response, 200, { ok: true, faqs: business.faqs });
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message || "Invalid knowledge base payload" });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/whatsapp/webhook") {
    try {
      const body = await readJson(request);
      const result = await processIncomingMessages(body, { sendToWhatsApp: body?.object === "whatsapp_business_account" });
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, error.statusCode || 400, { error: error.message || "Invalid webhook payload" });
    }
    return;
  }

  sendJson(response, 404, { error: "API route not found" });
}

async function processIncomingMessages(body, { sendToWhatsApp }) {
  const activeWorkspace = supabaseConfigured() ? await loadWorkspaceFromSupabase() : workspace;
  const incomingMessages = extractWhatsAppMessages(body, process.env.WHATSAPP_BUSINESS_ID || "tuition-hub");
  const processed = [];

  if (!incomingMessages.length) {
    return { ok: true, processed: 0 };
  }

  for (const incoming of incomingMessages) {
    let business = findBusiness(activeWorkspace.businesses, incoming.businessId);

    if (!business) {
      const error = new Error(`Business not found: ${incoming.businessId}`);
      error.statusCode = 404;
      throw error;
    }

    if (!sendToWhatsApp && body.businessSnapshot?.id === business.id) {
      business = sanitizeBusinessSettings(body.businessSnapshot, business);
    }

    const result = handleIncomingMessage({
      business,
      message: incoming
    });
    result.reply.text = await generateAiReply({
      business,
      customerMessage: incoming.text,
      engineReply: result.reply.text
    });
    result.conversation.messages[1].text = result.reply.text;

    if (incoming.customerName) {
      result.conversation.customerName = incoming.customerName;
      result.conversation.lead.name ||= incoming.customerName;
    }

    if (supabaseConfigured()) {
      await saveConversationToSupabase(result.conversation);
    } else {
      workspace.conversations.unshift(result.conversation);
    }

    const delivery = sendToWhatsApp && business.autoReplyEnabled
      ? await sendWhatsAppText({
        to: incoming.from,
        text: result.reply.text
      })
      : { sent: false, skipped: true, reason: "Simulator request" };

    processed.push({ ...result, delivery });
  }

  return processed.length === 1 ? processed[0] : { ok: true, processed: processed.length, results: processed };
}

const server = createServer(async (request, response) => {
  if (request.url.startsWith("/api/") || request.url === "/health") {
    await handleApi(request, response);
    return;
  }

  await serveStatic(request, response);
});

server.listen(port, host, () => {
  console.log(`WhatsApp Auto Reply MVP running at http://${host}:${port}`);
});
