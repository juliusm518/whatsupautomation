import {
  createDemoWorkspace,
  detectIntent,
  extractLead,
  handleIncomingMessage,
  isWithinBusinessHours,
  matchFaq
} from "./core/automationEngine.js";

const storageKey = "whatsapp-auto-reply-saas-v1";
const workspace = loadWorkspace();
const state = {
  workspace,
  activeBusinessId: workspace.businesses[0].id,
  activeConversationId: workspace.conversations[0]?.id || null
};

const icons = {
  message: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.5A3.5 3.5 0 0 1 8 2h8a3.5 3.5 0 0 1 3.5 3.5v6A3.5 3.5 0 0 1 16 15H9.2L4 20v-5.6a3.5 3.5 0 0 1-2-3.2v-5.7Z"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 0 1 16 0H4Z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm1-10.4V6h-2v7h6v-2h-4Z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16v2H2V3h2v16Zm3-2V9h3v8H7Zm5 0V5h3v12h-3Zm5 0v-6h3v6h-3Z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.3 9.4 8 11 4.7-1.6 8-6 8-11V5l-8-3Zm-1 14-3.5-3.5L9 11l2 2 4-4 1.5 1.5L11 16Z"/></svg>`
};

const app = document.querySelector("#app");
render();

function render() {
  const business = currentBusiness();
  const conversations = currentConversations();
  const activeConversation = conversations.find((conversation) => conversation.id === state.activeConversationId) || conversations[0];
  state.activeConversationId = activeConversation?.id || null;
  const analytics = getAnalytics(conversations);

  app.innerHTML = `
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">${icons.message}</div>
        <div>
          <strong>ReplyPilot</strong>
          <span>WhatsApp AI for SMEs</span>
        </div>
      </div>
      <label class="field-label" for="business-select">Business</label>
      <select id="business-select" class="select">
        ${workspace.businesses.map((item) => `<option value="${item.id}" ${item.id === business.id ? "selected" : ""}>${item.name}</option>`).join("")}
      </select>
      <nav class="nav">
        <a href="#inbox">${icons.message}<span>Inbox</span></a>
        <a href="#automation">${icons.bolt}<span>Automation</span></a>
        <a href="#analytics">${icons.chart}<span>Analytics</span></a>
      </nav>
      <div class="connection-card">
        <span class="status-dot"></span>
        <div>
          <strong>WhatsApp sandbox connected</strong>
          <small>${business.whatsappNumber}</small>
        </div>
      </div>
    </aside>
    <main class="shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">${business.type}</p>
          <h1>${business.name}</h1>
        </div>
        <div class="operator">
          ${icons.user}
          <span>${business.owner}</span>
        </div>
      </header>

      <section class="metrics" id="analytics">
        ${metricCard("Auto replies", analytics.autoReplies, "+18% this week", "message")}
        ${metricCard("Qualified leads", analytics.leads, `${analytics.leadRate}% lead rate`, "bolt")}
        ${metricCard("Human escalations", analytics.escalations, "High intent protected", "shield")}
        ${metricCard("After-hours saves", analytics.afterHours, "Replies while closed", "clock")}
      </section>

      <section class="workspace-grid" id="inbox">
        <div class="panel inbox-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Conversation History</p>
              <h2>Live WhatsApp inbox</h2>
            </div>
            <button class="icon-button" id="seed-message-button" title="Add demo customer">${icons.message}</button>
          </div>
          <div class="conversation-list">
            ${conversations.map((conversation) => conversationListItem(conversation)).join("") || emptyState("No conversations yet")}
          </div>
        </div>

        <div class="panel conversation-panel">
          ${activeConversation ? conversationDetail(activeConversation) : emptyState("Send a test WhatsApp message to start.")}
        </div>
      </section>

      <section class="automation-grid" id="automation">
        <div class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">WhatsApp Integration</p>
              <h2>Webhook simulator</h2>
            </div>
            <span class="pill">MVP adapter</span>
          </div>
          <form id="message-form" class="form-stack">
            <label>
              Customer phone
              <input name="from" value="+65 9000 1122" autocomplete="tel" />
            </label>
            <label>
              Incoming WhatsApp message
              <textarea name="text" rows="4">Hi, how much is your service and can book tomorrow morning?</textarea>
            </label>
            <button type="submit" class="primary-button">${icons.bolt}<span>Run auto-reply</span></button>
          </form>
        </div>

        <div class="panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">AI Workflow</p>
              <h2>Automation rules</h2>
            </div>
          </div>
          ${automationSettings(business)}
        </div>

        <div class="panel faq-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">FAQ Answering</p>
              <h2>Knowledge base</h2>
            </div>
          </div>
          <div class="faq-list">
            ${business.faqs.map((faq, index) => faqEditor(faq, index)).join("")}
          </div>
        </div>
      </section>
    </main>
  `;

  bindEvents();
}

function metricCard(label, value, detail, icon) {
  return `
    <article class="metric-card">
      <div class="metric-icon">${icons[icon]}</div>
      <div>
        <span>${label}</span>
        <strong>${value}</strong>
        <small>${detail}</small>
      </div>
    </article>
  `;
}

function conversationListItem(conversation) {
  return `
    <button class="conversation-item ${conversation.id === state.activeConversationId ? "active" : ""}" data-conversation-id="${conversation.id}">
      <div>
        <strong>${conversation.customerName}</strong>
        <span>${conversation.summary}</span>
      </div>
      <small class="status ${conversation.status}">${conversation.status.replace("-", " ")}</small>
    </button>
  `;
}

function conversationDetail(conversation) {
  return `
    <div class="panel-header">
      <div>
        <p class="eyebrow">${conversation.customerPhone}</p>
        <h2>${conversation.customerName}</h2>
      </div>
      <span class="pill">${conversation.intent}</span>
    </div>
    <div class="lead-strip">
      <span><strong>Service</strong>${conversation.lead.service || "Not captured"}</span>
      <span><strong>Timing</strong>${conversation.lead.preferredTime || "Not captured"}</span>
      <span><strong>Status</strong>${conversation.status.replace("-", " ")}</span>
    </div>
    <div class="messages">
      ${conversation.messages.map((message) => `
        <div class="bubble ${message.from}">
          <p>${message.text}</p>
          <time>${formatTime(message.timestamp)}</time>
        </div>
      `).join("")}
    </div>
  `;
}

function automationSettings(business) {
  const withinHours = isWithinBusinessHours(new Date(), business.businessHours);

  return `
    <div class="settings">
      <label class="toggle-row">
        <input type="checkbox" id="auto-reply-toggle" ${business.autoReplyEnabled ? "checked" : ""} />
        <span>AI auto-reply</span>
      </label>
      <label class="toggle-row">
        <input type="checkbox" id="escalation-toggle" ${business.escalationEnabled ? "checked" : ""} />
        <span>Human escalation</span>
      </label>
      <div class="hours-card">
        <div>${icons.clock}</div>
        <span>${business.businessHours.open} to ${business.businessHours.close}</span>
        <strong>${withinHours ? "Open now" : "Closed now"}</strong>
      </div>
      <div class="mini-grid">
        <span>Intent detection</span>
        <strong>FAQ, lead, appointment, escalation</strong>
        <span>Lead fields</span>
        <strong>Name, phone, service, timing</strong>
      </div>
    </div>
  `;
}

function faqEditor(faq, index) {
  return `
    <details class="faq-item" ${index === 0 ? "open" : ""}>
      <summary>${faq.question}</summary>
      <label>
        Answer
        <textarea data-faq-index="${index}" rows="3">${faq.answer}</textarea>
      </label>
    </details>
  `;
}

function emptyState(message) {
  return `<div class="empty-state">${icons.message}<p>${message}</p></div>`;
}

function bindEvents() {
  document.querySelector("#business-select").addEventListener("change", (event) => {
    state.activeBusinessId = event.target.value;
    state.activeConversationId = currentConversations()[0]?.id || null;
    saveWorkspace();
    render();
  });

  document.querySelectorAll("[data-conversation-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeConversationId = button.dataset.conversationId;
      render();
    });
  });

  document.querySelector("#message-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const business = currentBusiness();
    const result = handleIncomingMessage({
      business,
      message: {
        id: `conv-${crypto.randomUUID()}`,
        from: form.get("from"),
        text: form.get("text")
      }
    });

    workspace.conversations.unshift(result.conversation);
    state.activeConversationId = result.conversation.id;
    saveWorkspace();
    render();
  });

  document.querySelector("#seed-message-button").addEventListener("click", () => {
    const business = currentBusiness();
    const samples = [
      "Hi, I need price and earliest slot tomorrow morning. This is Jasmine 9123 4567.",
      "Urgent, can a human call me? My aircon is leaking badly.",
      "Where are you located and how much are classes?"
    ];
    const text = samples[Math.floor(Math.random() * samples.length)];
    const result = handleIncomingMessage({
      business,
      message: {
        id: `conv-${crypto.randomUUID()}`,
        from: "+65 9000 1122",
        text
      }
    });
    workspace.conversations.unshift(result.conversation);
    state.activeConversationId = result.conversation.id;
    saveWorkspace();
    render();
  });

  document.querySelector("#auto-reply-toggle").addEventListener("change", (event) => {
    currentBusiness().autoReplyEnabled = event.target.checked;
    saveWorkspace();
  });

  document.querySelector("#escalation-toggle").addEventListener("change", (event) => {
    currentBusiness().escalationEnabled = event.target.checked;
    saveWorkspace();
  });

  document.querySelectorAll("[data-faq-index]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      currentBusiness().faqs[Number(textarea.dataset.faqIndex)].answer = textarea.value;
      saveWorkspace();
    });
  });
}

function getAnalytics(conversations) {
  const autoReplies = conversations.filter((conversation) => conversation.status === "auto-replied").length;
  const leads = conversations.filter((conversation) => conversation.status === "qualified-lead").length;
  const escalations = conversations.filter((conversation) => conversation.status === "needs-human").length;
  const afterHours = conversations.filter((conversation) => {
    const firstMessage = conversation.messages[0];
    return firstMessage && !isWithinBusinessHours(new Date(firstMessage.timestamp), currentBusiness().businessHours);
  }).length;

  return {
    autoReplies,
    leads,
    escalations,
    afterHours,
    leadRate: conversations.length ? Math.round((leads / conversations.length) * 100) : 0
  };
}

function currentBusiness() {
  return workspace.businesses.find((business) => business.id === state.activeBusinessId);
}

function currentConversations() {
  return workspace.conversations.filter((conversation) => conversation.businessId === state.activeBusinessId);
}

function formatTime(timestamp) {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "short"
  }).format(new Date(timestamp));
}

function loadWorkspace() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) {
    return createDemoWorkspace();
  }

  try {
    return JSON.parse(saved);
  } catch {
    return createDemoWorkspace();
  }
}

function saveWorkspace() {
  localStorage.setItem(storageKey, JSON.stringify(workspace));
}

window.ReplyPilotDebug = {
  detectIntent,
  extractLead,
  matchFaq
};
