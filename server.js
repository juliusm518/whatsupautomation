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
  saveConversationToSupabase,
  supabaseConfigured
} from "./src/storage/supabaseStore.js";

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
      "cache-control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=300"
    });
    response.end(file);
  } catch {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}

async function generateAiReply({ business, customerMessage, engineReply }) {
  if (!process.env.OPENAI_API_KEY) {
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
    return engineReply;
  }

  const payload = await response.json();
  return payload.output_text || engineReply;
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

  if (request.method === "POST" && url.pathname === "/api/whatsapp/webhook") {
    try {
      const body = await readJson(request);
      const business = findBusiness(workspace.businesses, body.businessId);

      if (!business) {
        sendJson(response, 404, { error: "Business not found" });
        return;
      }

      const result = handleIncomingMessage({
        business,
        message: {
          id: body.id,
          from: body.from,
          text: body.text,
          timestamp: body.timestamp
        }
      });
      result.reply.text = await generateAiReply({
        business,
        customerMessage: body.text,
        engineReply: result.reply.text
      });

      workspace.conversations.unshift(result.conversation);
      if (supabaseConfigured()) {
        await saveConversationToSupabase(result.conversation);
      }
      sendJson(response, 200, result);
    } catch (error) {
      sendJson(response, 400, { error: error.message || "Invalid webhook payload" });
    }
    return;
  }

  sendJson(response, 404, { error: "API route not found" });
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
