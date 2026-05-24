import {
  buildAvailabilityPreview,
  calendarForBusiness,
  createDemoWorkspace,
  createStarterConversation,
  detectIntent,
  extractLead,
  handleIncomingMessage,
  isWithinBusinessHours,
  matchFaq
} from "./core/automationEngine.js";

const storageKey = "whatsapp-auto-reply-saas-v1";
let workspace = loadWorkspace();
const state = {
  workspace,
  activeBusinessId: workspace.businesses[0].id,
  activeConversationId: workspace.conversations[0]?.id || null,
  syncStatus: location.protocol === "file:" ? "Local preview" : "Loading server data",
  saveStatus: location.protocol === "file:" ? "Local preview only" : "Ready",
  knowledgeStatus: location.protocol === "file:" ? "Local preview only" : "Saved on server",
  busyAction: "",
  faqDirty: false,
  showPilotConversations: false,
  toast: null,
  testPreview: {
    status: "Ready",
    question: "Hi, what is your schedule and can I book a trial lesson tomorrow?",
    reply: ""
  },
  testInbox: {
    status: "Ready",
    phone: "+65 9000 1122",
    message: "Hi, this is Jasmine 9123 4567. Can I book a trial lesson today at 4pm?",
    reply: "Send a test message to see the WhatsApp reply.",
    lastConversationId: ""
  },
  testSuite: {
    status: "Not run",
    summary: "Run all pilot checks across every business template.",
    results: []
  }
};

const icons = {
  message: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 5.5A3.5 3.5 0 0 1 8 2h8a3.5 3.5 0 0 1 3.5 3.5v6A3.5 3.5 0 0 1 16 15H9.2L4 20v-5.6a3.5 3.5 0 0 1-2-3.2v-5.7Z"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m13 2-9 12h7l-1 8 9-12h-7l1-8Z"/></svg>`,
  user: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm-8 9a8 8 0 0 1 16 0H4Z"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm1-10.4V6h-2v7h6v-2h-4Z"/></svg>`,
  chart: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19h16v2H2V3h2v16Zm3-2V9h3v8H7Zm5 0V5h3v12h-3Zm5 0v-6h3v6h-3Z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.3 9.4 8 11 4.7-1.6 8-6 8-11V5l-8-3Zm-1 14-3.5-3.5L9 11l2 2 4-4 1.5 1.5L11 16Z"/></svg>`,
  reset: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5a7 7 0 1 1-6.3 10H3.6A9 9 0 1 0 5 6.6V3H3v7h7V8H6.5A7 7 0 0 1 12 5Z"/></svg>`,
  send: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20 22 12 3 4v6l11 2-11 2v6Z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm4 17h2v-2h-2v2Z"/></svg>`
};

const app = document.querySelector("#app");
render();
refreshWorkspaceFromServer();
window.addEventListener("hashchange", render);

function render() {
  if (location.hash === "#demo") {
    renderProspectDemo();
    return;
  }

  const business = currentBusiness();
  const conversations = currentConversations();
  const operationalConversations = conversations.filter((conversation) => !isPilotConversation(conversation));
  const inboxConversations = state.showPilotConversations ? conversations : operationalConversations;
  const pilotConversationCount = conversations.length - operationalConversations.length;
  const activeConversation = inboxConversations.find((conversation) => conversation.id === state.activeConversationId) || inboxConversations[0];
  state.activeConversationId = activeConversation?.id || null;
  const analytics = getAnalytics(operationalConversations);
  const action = actionButtonState();
  const setupProgress = onboardingProgress(business, operationalConversations);

  app.innerHTML = `
    ${toastMarkup()}
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
        <a href="#demo">${icons.send}<span>Demo</span></a>
        <a href="#setup">${icons.shield}<span>Setup</span></a>
        <a href="#inbox">${icons.message}<span>Inbox</span></a>
        <a href="#automation">${icons.bolt}<span>Automation</span></a>
        <a href="#analytics">${icons.chart}<span>Analytics</span></a>
        <a href="#settings">${icons.user}<span>Settings</span></a>
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

      <section class="panel setup-panel" id="setup">
        <div class="panel-header">
          <div>
            <p class="eyebrow">Pilot Onboarding</p>
            <h2>Go-live checklist</h2>
          </div>
          <span class="pill">${setupProgress.done}/${setupProgress.total} ready</span>
        </div>
        ${onboardingChecklist(business, conversations)}
      </section>

      <section class="workspace-grid" id="inbox">
        <div class="panel inbox-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Conversation History</p>
              <h2>Live WhatsApp inbox</h2>
            </div>
            <div class="inbox-actions">
              <label class="test-mode-toggle">
                <input type="checkbox" id="show-pilot-conversations-toggle" ${state.showPilotConversations ? "checked" : ""} />
                <span>Show tests${pilotConversationCount ? ` (${pilotConversationCount})` : ""}</span>
              </label>
              <button class="secondary-button compact-button${action.className("reset-conversations")}" id="reset-conversations-button" type="button"${action.aria("reset-conversations")}>${icons.reset}<span>${action.label("reset-conversations", "Reset", "Resetting...")}</span></button>
              <button class="icon-button" id="seed-message-button" title="Add demo customer">${icons.message}</button>
            </div>
          </div>
          <div class="conversation-list">
            ${inboxConversations.map((conversation) => conversationListItem(conversation)).join("") || inboxEmptyState(pilotConversationCount)}
          </div>
        </div>

        <div class="panel conversation-panel">
          ${activeConversation ? conversationDetail(activeConversation) : emptyState("Send a test WhatsApp message to start.")}
        </div>
      </section>

      <section class="automation-grid" id="automation">
        <div class="panel test-inbox-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">WhatsApp Integration</p>
              <h2>Test inbox</h2>
            </div>
            <span class="pill">${state.testInbox.status}</span>
          </div>
          ${testInboxPanel(business)}
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

        <div class="panel pilot-test-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Pilot Testing</p>
              <h2>Test results</h2>
            </div>
            <span class="pill">${state.testSuite.status}</span>
          </div>
          ${pilotTestPanel()}
        </div>
      </section>

      <section class="settings-grid" id="settings">
        <div class="panel settings-panel">
          <div class="panel-header">
          <div>
            <p class="eyebrow">Business Settings</p>
            <h2>Profile and contact</h2>
          </div>
            <div class="sync-actions">
              <span class="pill">${state.syncStatus}</span>
              <button class="secondary-button${action.className("refresh")}" id="refresh-workspace-button" type="button"${action.aria("refresh")}>${icons.clock}<span>${action.label("refresh", "Refresh", "Refreshing...")}</span></button>
            </div>
          </div>
          ${businessSettingsForm(business)}
        </div>

        <div class="panel settings-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Reply Test</p>
              <h2>Test customer message</h2>
            </div>
            <span class="pill">${state.testPreview.status}</span>
          </div>
          ${replyTestPanel(business)}
        </div>

        <div class="panel settings-panel">
          ${calendarPanel(business)}
        </div>

        <div class="panel settings-panel">
          <div class="panel-header">
            <div>
              <p class="eyebrow">Knowledge Settings</p>
              <h2>FAQ editor</h2>
            </div>
            <div class="sync-actions">
              <span class="pill">${state.knowledgeStatus}</span>
              <button class="secondary-button" id="add-faq-button" type="button">${icons.bolt}<span>Add FAQ</span></button>
            </div>
          </div>
          <div class="faq-settings-list">
            ${business.faqs.map((faq, index) => faqSettingsEditor(faq, index)).join("")}
          </div>
          <div class="knowledge-actions">
            <div class="save-feedback ${knowledgeFeedbackClass()}" role="status" aria-live="polite">
              <span>${state.knowledgeStatus}</span>
            </div>
            <button type="button" class="primary-button${action.className("knowledge")}" id="save-faqs-button"${action.aria("knowledge")}>${icons.shield}<span>${action.label("knowledge", "Save knowledge base", "Saving...")}</span></button>
          </div>
        </div>
      </section>
    </main>
  `;

  bindEvents();
}

function renderProspectDemo() {
  const summary = pilotResultSummary();

  app.innerHTML = `
    ${toastMarkup()}
    <main class="demo-shell">
      <header class="demo-header">
        <div>
          <p class="eyebrow">Prospect Demo Mode</p>
          <h1>ReplyPilot business templates</h1>
        </div>
        <a class="secondary-button demo-dashboard-link" href="#automation">${icons.user}<span>Dashboard</span></a>
      </header>

      <section class="demo-status-panel">
        <div>
          <span>Business templates</span>
          <strong>${workspace.businesses.length}</strong>
        </div>
        <div>
          <span>Pilot checks</span>
          <strong>${summary.total ? `${summary.passed}/${summary.total}` : "Not run"}</strong>
        </div>
        <div>
          <span>Status</span>
          <strong>${state.testSuite.status}</strong>
        </div>
      </section>

      <section class="demo-actions">
        <button type="button" class="primary-button${buttonBusyClass("pilot-tests")}" id="demo-run-pilot-tests-button"${buttonBusyAria("pilot-tests")}>${icons.shield}<span>${buttonBusyLabel("pilot-tests", "Run pilot tests", "Running tests...")}</span></button>
        <button type="button" class="secondary-button" id="demo-export-pilot-report-button">${icons.send}<span>Export report</span></button>
      </section>

      <section class="demo-template-grid">
        ${workspace.businesses.map((business) => demoBusinessCard(business)).join("")}
      </section>
    </main>
  `;

  bindProspectDemoEvents();
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

function demoBusinessCard(business) {
  const results = state.testSuite.results.filter((result) => result.businessId === business.id);
  const passed = results.filter((result) => result.ok).length;
  const status = results.length ? `${passed}/${results.length} checks passed` : "Ready to test";
  const profile = testScenarioProfile(business);

  return `
    <article class="demo-template-card">
      <div class="demo-template-header">
        <div>
          <span>${escapeHtml(business.type)}</span>
          <strong>${escapeHtml(business.name)}</strong>
        </div>
        <small>${escapeHtml(status)}</small>
      </div>
      <p>${escapeHtml(business.appointmentLabel || "appointment")} automation with FAQ replies, lead capture, booking handling, and human escalation.</p>
      <div class="demo-template-checks">
        <span>FAQ: ${escapeHtml(profile.faqPreview)}</span>
        <span>Booking: ${escapeHtml(profile.bookingPreview)}</span>
        <span>Escalation: Human handoff</span>
      </div>
    </article>
  `;
}

function pilotResultSummary() {
  const passed = state.testSuite.results.filter((result) => result.ok).length;
  return {
    passed,
    total: state.testSuite.results.length
  };
}

function onboardingProgress(business, conversations) {
  const items = onboardingItems(business, conversations);
  return {
    done: items.filter((item) => item.done).length,
    total: items.length
  };
}

function onboardingChecklist(business, conversations) {
  return `
    <div class="setup-checklist">
      ${onboardingItems(business, conversations).map((item) => `
        <article class="setup-step ${item.done ? "done" : "pending"}">
          <div class="setup-icon">${item.done ? icons.shield : icons.clock}</div>
          <div>
            <strong>${item.label}</strong>
            <span>${item.detail}</span>
          </div>
        </article>
      `).join("")}
    </div>
  `;
}

function onboardingItems(business, conversations) {
  const hasProfile = Boolean(business.name && business.owner && business.whatsappNumber && business.appointmentLabel);
  const hasKnowledge = (business.faqs || []).filter((faq) => faq.question && faq.answer).length >= 3;
  const hasTestConversation = conversations.some((conversation) => conversation.messages.some((message) => message.from === "assistant"));
  const hasServerSync = /synced|ready|saved/i.test(`${state.syncStatus} ${state.saveStatus} ${state.knowledgeStatus}`);

  return [
    {
      label: "Business profile",
      detail: hasProfile ? `${business.name} is ready for customer-facing replies.` : "Complete the business name, owner, WhatsApp number, and booking label.",
      done: hasProfile
    },
    {
      label: "Knowledge base",
      detail: hasKnowledge ? `${business.faqs.length} FAQ answers are available for automation.` : "Add at least three FAQ answers before pilot testing.",
      done: hasKnowledge
    },
    {
      label: "Reply test",
      detail: hasTestConversation ? "A sample customer reply has been generated for this business." : "Run a test message before connecting a live number.",
      done: hasTestConversation
    },
    {
      label: "WhatsApp webhook",
      detail: "Confirm Meta webhook verification, phone number ID, and access token in Render.",
      done: false
    },
    {
      label: "Server sync",
      detail: hasServerSync ? "Dashboard changes are connected to the server workflow." : "Refresh from server and save settings after setup changes.",
      done: hasServerSync
    }
  ];
}

function conversationListItem(conversation) {
  const testMode = isPilotConversation(conversation);
  return `
    <button class="conversation-item ${conversation.id === state.activeConversationId ? "active" : ""} ${testMode ? "test-mode" : ""}" data-conversation-id="${escapeAttribute(conversation.id)}">
      <div>
        <strong>${escapeHtml(conversation.customerName)}${testMode ? `<small class="test-mode-badge">Test Mode</small>` : ""}</strong>
        <span>${escapeHtml(conversation.summary)}</span>
      </div>
      <small class="status ${escapeAttribute(conversation.status)}">${escapeHtml(conversation.status.replace("-", " "))}</small>
    </button>
  `;
}

function conversationDetail(conversation) {
  const testMode = isPilotConversation(conversation);
  return `
    <div class="panel-header">
      <div>
        <p class="eyebrow">${escapeHtml(conversation.customerPhone)}</p>
        <h2>${escapeHtml(conversation.customerName)}</h2>
      </div>
      <div class="conversation-labels">
        ${testMode ? `<span class="pill test-mode-pill">Test Mode</span>` : ""}
        <span class="pill">${escapeHtml(conversation.intent)}</span>
      </div>
    </div>
    <div class="lead-strip">
      <span><strong>Service</strong>${escapeHtml(conversation.lead.service || "Not captured")}</span>
      <span><strong>Timing</strong>${escapeHtml(conversation.lead.preferredTime || "Not captured")}</span>
      <span><strong>Status</strong>${escapeHtml(conversation.status.replace("-", " "))}</span>
    </div>
    <div class="messages">
      ${conversation.messages.map((message) => `
        <div class="bubble ${escapeAttribute(message.from)}">
          <p>${escapeHtml(message.text)}</p>
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

function replyTestPanel(business) {
  const reply = state.testPreview.reply || "Run a test to see the exact reply customers will receive.";

  return `
    <form class="form-stack" id="reply-test-form">
      <label>
        Customer phone
        <input name="from" value="+65 9000 1122" autocomplete="tel" />
      </label>
      <label>
        Customer message
        <textarea name="text" rows="4">${escapeHtml(state.testPreview.question)}</textarea>
      </label>
      <button type="submit" class="primary-button${buttonBusyClass("reply-test")}"${buttonBusyAria("reply-test")}>${icons.bolt}<span>${buttonBusyLabel("reply-test", "Test reply", "Testing...")}</span></button>
    </form>
    <div class="reply-preview">
      <span>${business.name} reply</span>
      <p>${escapeHtml(reply)}</p>
    </div>
  `;
}

function testInboxPanel(business) {
  const scenarios = testInboxScenarios(business);

  return `
    <div class="test-phone-row" role="group" aria-label="Test customer numbers">
      ${testInboxPhones().map((phone) => `
        <button class="phone-chip ${state.testInbox.phone === phone.value ? "active" : ""}" type="button" data-test-phone="${escapeAttribute(phone.value)}">
          ${icons.phone}<span>${phone.label}</span>
        </button>
      `).join("")}
    </div>
    <div class="scenario-grid" role="group" aria-label="Test message starters">
      ${scenarios.map((scenario) => `
        <button class="scenario-button" type="button" data-test-scenario="${scenario.id}">
          <strong>${scenario.label}</strong>
          <span>${scenario.preview}</span>
        </button>
      `).join("")}
    </div>
    <form id="test-inbox-form" class="form-stack">
      <label>
        Customer phone
        <input name="from" value="${escapeAttribute(state.testInbox.phone)}" autocomplete="tel" />
      </label>
      <label>
        Incoming WhatsApp message
        <textarea name="text" rows="4">${escapeHtml(state.testInbox.message)}</textarea>
      </label>
      <button type="submit" class="primary-button${buttonBusyClass("test-inbox")}"${buttonBusyAria("test-inbox")}>${icons.send}<span>${buttonBusyLabel("test-inbox", "Send test message", "Sending...")}</span></button>
    </form>
    <div class="test-reply-card">
      <span>${business.name} auto-reply</span>
      <p>${escapeHtml(state.testInbox.reply)}</p>
    </div>
  `;
}

function testInboxPhones() {
  return [
    { label: "Customer A", value: "+65 9000 1122" },
    { label: "Customer B", value: "+65 9000 3344" },
    { label: "Customer C", value: "+65 9000 5566" }
  ];
}

function testInboxScenarios(business) {
  const profile = testScenarioProfile(business);

  return [
    {
      id: "faq",
      label: "FAQ",
      preview: profile.faqPreview,
      text: profile.faq
    },
    {
      id: "follow-up",
      label: "Memory",
      preview: "Same number follow-up",
      text: "This is the same customer. Can you remember what I asked and help me choose a slot?"
    },
    {
      id: "booking",
      label: "Booking",
      preview: profile.bookingPreview,
      text: profile.booking
    },
    {
      id: "duplicate",
      label: "Duplicate",
      preview: "Try same slot again",
      text: profile.duplicate
    },
    {
      id: "human",
      label: "Human",
      preview: "Escalation request",
      text: profile.human
    }
  ];
}

function testScenarioProfile(business) {
  const type = `${business?.type || ""} ${business?.name || ""}`.toLowerCase();
  const fallback = {
    faqPreview: "Ask price or location",
    faq: "Hi, where are you located and how much is your service?",
    bookingPreview: "Request a slot",
    booking: `Hi, this is Jasmine 9123 4567. Can I book ${business.appointmentLabel || "an appointment"} today at 4pm?`,
    duplicate: `Hi, this is Marcus 9123 9999. Can I book ${business.appointmentLabel || "an appointment"} today at 4pm?`,
    human: "Urgent, can a human call me now? I need help before booking."
  };

  if (type.includes("aircon")) {
    return {
      faqPreview: "Ask servicing price",
      faq: "Hi, how much is aircon servicing for 3 units?",
      bookingPreview: "Book service slot",
      booking: "Hi, this is Jasmine 9123 4567. Can I book aircon servicing today at 4pm?",
      duplicate: "Hi, this is Marcus 9123 9999. Can I book aircon servicing today at 4pm?",
      human: "Urgent, my aircon is leaking badly. Can a human call me now?"
    };
  }

  if (type.includes("plumbing")) {
    return {
      faqPreview: "Ask repair price",
      faq: "Hi, how much is plumbing repair for a clogged sink?",
      bookingPreview: "Book repair visit",
      booking: "Hi, this is Jasmine 9123 4567. Can I book a plumbing repair visit today at 4pm?",
      duplicate: "Hi, this is Marcus 9123 9999. Can I book a plumbing repair visit today at 4pm?",
      human: "Urgent, my kitchen pipe is leaking badly. Can a human call me now?"
    };
  }

  if (type.includes("renovation")) {
    return {
      faqPreview: "Ask renovation quote",
      faq: "Hi, do you provide renovation quotes?",
      bookingPreview: "Book consultation",
      booking: "Hi, this is Jasmine 9123 4567. Can I schedule a renovation consultation today at 4pm?",
      duplicate: "Hi, this is Marcus 9123 9999. Can I schedule a renovation consultation today at 4pm?",
      human: "Urgent, can a human call me about a renovation issue now?"
    };
  }

  if (type.includes("hawker") || type.includes("chicken rice")) {
    return {
      faqPreview: "Ask bulk order",
      faq: "Hi, can I place a bulk order?",
      bookingPreview: "Book pickup",
      booking: "Hi, this is Jasmine 9123 4567. Can I book a bulk order pickup today at 12pm?",
      duplicate: "Hi, this is Marcus 9123 9999. Can I book a bulk order pickup today at 12pm?",
      human: "Urgent, can a human call me about a large lunch order now?"
    };
  }

  if (type.includes("bakery") || type.includes("cake")) {
    return {
      faqPreview: "Ask custom cake",
      faq: "Hi, do you make custom cakes and how much are cakes?",
      bookingPreview: "Book cake order",
      booking: "Hi, this is Jasmine 9123 4567. Can I book a cake order today at 4pm?",
      duplicate: "Hi, this is Marcus 9123 9999. Can I book a cake order today at 4pm?",
      human: "Urgent, can a human call me about a cake order change now?"
    };
  }

  return fallback;
}

function pilotTestPanel() {
  const passed = state.testSuite.results.filter((result) => result.ok).length;
  const total = state.testSuite.results.length;

  return `
    <div class="pilot-test-summary">
      <strong>${escapeHtml(state.testSuite.summary)}</strong>
      <span>${total ? `${passed}/${total} checks passed` : `${workspace.businesses.length} businesses ready to test`}</span>
    </div>
    <div class="pilot-test-actions">
      <button type="button" class="primary-button${buttonBusyClass("pilot-tests")}" id="run-pilot-tests-button"${buttonBusyAria("pilot-tests")}>${icons.shield}<span>${buttonBusyLabel("pilot-tests", "Run pilot tests", "Running tests...")}</span></button>
      <button type="button" class="secondary-button" id="export-pilot-report-button">${icons.send}<span>Export report</span></button>
      <button type="button" class="secondary-button${buttonBusyClass("pilot-cleanup")}" id="clear-pilot-tests-button"${buttonBusyAria("pilot-cleanup")}>${icons.reset}<span>${buttonBusyLabel("pilot-cleanup", "Clear pilot tests", "Clearing...")}</span></button>
    </div>
    <div class="pilot-test-results">
      ${state.testSuite.results.map((result) => `
        <article class="pilot-test-result ${result.ok ? "passed" : "failed"}">
          <div>
            <strong>${escapeHtml(result.businessName)}</strong>
            <span>${escapeHtml(result.kind)} - ${escapeHtml(result.detail)}</span>
          </div>
          <small>${result.ok ? "Pass" : "Check"}</small>
        </article>
      `).join("") || emptyState("No pilot test results yet.")}
    </div>
  `;
}

function calendarPanel(business) {
  const availability = buildAvailabilityPreview(business);
  const calendar = availability.calendar;
  const status = availability.connected ? "Connected" : "Not connected";

  return `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Booking Calendar</p>
        <h2>Google availability</h2>
      </div>
      <span class="pill">${status}</span>
    </div>
    <div class="calendar-summary">
      <div>
        <span>Calendar</span>
        <strong>${calendar.calendarId || "Not attached"}</strong>
      </div>
      <div>
        <span>Appointment</span>
        <strong>${business.appointmentLabel || "booking"} - ${calendar.bookingDurationMinutes} min</strong>
      </div>
      <div>
        <span>Booked slots</span>
        <strong>${availability.bookedCount}</strong>
      </div>
    </div>
    <div class="slot-list">
      ${availability.openSlots.map((slot) => `
        <span class="slot-chip">
          <strong>${slot.label}</strong>
          <small>${slot.start}-${slot.end}</small>
        </span>
      `).join("") || emptyState("No open slots found in the test window.")}
    </div>
  `;
}

function businessSettingsForm(business) {
  const calendar = calendarForBusiness(business);
  return `
    <form class="settings-form" id="business-settings-form">
      <div class="form-grid">
        <label>
          Business name
          <input name="name" value="${escapeAttribute(business.name)}" />
        </label>
        <label>
          Business type
          <input name="type" value="${escapeAttribute(business.type)}" />
        </label>
        <label>
          Owner or operator
          <input name="owner" value="${escapeAttribute(business.owner)}" />
        </label>
        <label>
          WhatsApp display number
          <input name="whatsappNumber" value="${escapeAttribute(business.whatsappNumber)}" autocomplete="tel" />
        </label>
        <label>
          Appointment label
          <input name="appointmentLabel" value="${escapeAttribute(business.appointmentLabel || "")}" />
        </label>
        <label>
          Google Calendar ID
          <input name="calendarId" value="${escapeAttribute(calendar.calendarId)}" placeholder="primary" />
        </label>
        <label>
          Booking duration
          <input name="bookingDurationMinutes" type="number" min="15" step="15" value="${calendar.bookingDurationMinutes}" />
        </label>
        <label>
          Buffer minutes
          <input name="bufferMinutes" type="number" min="0" step="5" value="${calendar.bufferMinutes}" />
        </label>
        <label>
          Time zone
          <input name="timeZone" value="${escapeAttribute(business.businessHours.timeZone || "Asia/Singapore")}" />
        </label>
        <label>
          Opens
          <input name="open" type="time" value="${business.businessHours.open}" />
        </label>
        <label>
          Closes
          <input name="close" type="time" value="${business.businessHours.close}" />
        </label>
      </div>
      <fieldset class="days-fieldset">
        <legend>Open days</legend>
        ${dayOptions(business.businessHours.days)}
      </fieldset>
      <div class="save-feedback ${saveFeedbackClass()}" role="status" aria-live="polite">
        <span>${state.saveStatus}</span>
      </div>
      <button type="submit" class="primary-button${buttonBusyClass("business")}"${buttonBusyAria("business")}>${icons.shield}<span>${buttonBusyLabel("business", "Save business settings", "Saving...")}</span></button>
    </form>
  `;
}

function dayOptions(activeDays = []) {
  const days = [
    ["0", "Sun"],
    ["1", "Mon"],
    ["2", "Tue"],
    ["3", "Wed"],
    ["4", "Thu"],
    ["5", "Fri"],
    ["6", "Sat"]
  ];

  return days.map(([value, label]) => `
    <label class="day-chip">
      <input type="checkbox" name="days" value="${value}" ${activeDays.includes(Number(value)) ? "checked" : ""} />
      <span>${label}</span>
    </label>
  `).join("");
}

function faqSettingsEditor(faq, index) {
  return `
    <div class="faq-settings-item">
      <div class="faq-settings-header">
        <label>
          Question
          <input data-faq-question-index="${index}" value="${escapeAttribute(faq.question)}" />
        </label>
        <button class="danger-button" data-delete-faq-index="${index}" type="button">Delete</button>
      </div>
      <label>
        Answer
        <textarea data-faq-answer-index="${index}" rows="4">${escapeHtml(faq.answer)}</textarea>
      </label>
    </div>
  `;
}

function emptyState(message) {
  return `<div class="empty-state">${icons.message}<p>${message}</p></div>`;
}

function inboxEmptyState(pilotConversationCount) {
  if (pilotConversationCount && !state.showPilotConversations) {
    return emptyState("No live conversations. Turn on Show tests to view pilot test traffic.");
  }

  return emptyState("No conversations yet");
}

function bindEvents() {
  bindButtonClickIndicators();

  document.querySelector("#business-select").addEventListener("change", (event) => {
    state.activeBusinessId = event.target.value;
    state.activeConversationId = currentConversations()[0]?.id || null;
    saveWorkspace();
    render();
  });

  document.querySelector("#show-pilot-conversations-toggle").addEventListener("change", (event) => {
    state.showPilotConversations = event.target.checked;
    state.activeConversationId = currentInboxConversations()[0]?.id || null;
    render();
    location.hash = "inbox";
  });

  document.querySelector("#refresh-workspace-button").addEventListener("click", async () => {
    if (state.faqDirty && !confirm("You have unsaved Knowledge Base changes. Refreshing from server will replace them. Continue?")) {
      return;
    }

    state.busyAction = "refresh";
    state.syncStatus = "Refreshing...";
    state.saveStatus = "Refreshing from server...";
    render();
    await refreshWorkspaceFromServer();
    location.hash = "settings";
  });

  document.querySelector("#reply-test-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    state.busyAction = "reply-test";
    const form = new FormData(event.currentTarget);
    const business = currentBusiness();
    const text = cleanValue(form.get("text"), state.testPreview.question);
    state.testPreview = {
      status: "Testing...",
      question: text,
      reply: "Generating the customer reply..."
    };
    render();

    const result = await runServerSimulator({
      business,
      message: {
        id: `conv-${crypto.randomUUID()}`,
        from: cleanValue(form.get("from"), "+65 9000 1122"),
        text
      }
    });

    upsertLocalConversation(result.conversation);
    state.activeConversationId = result.conversation.id;
    state.testPreview = {
      status: result.conversation.status.replace("-", " "),
      question: text,
      reply: getAssistantReply(result.conversation)
    };
    state.busyAction = "";
    showToast("Reply test generated", "success", { renderNow: false });
    saveWorkspace();
    render();
    location.hash = "settings";
  });

  document.querySelectorAll("[data-conversation-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.activeConversationId = button.dataset.conversationId;
      render();
    });
  });

  document.querySelectorAll("[data-test-phone]").forEach((button) => {
    button.addEventListener("click", () => {
      state.testInbox.phone = button.dataset.testPhone;
      render();
      location.hash = "automation";
    });
  });

  document.querySelectorAll("[data-test-scenario]").forEach((button) => {
    button.addEventListener("click", () => {
      const scenario = testInboxScenarios(currentBusiness()).find((item) => item.id === button.dataset.testScenario);
      if (!scenario) {
        return;
      }

      state.testInbox.message = scenario.text;
      state.testInbox.status = "Ready";
      render();
      location.hash = "automation";
    });
  });

  document.querySelector("#test-inbox-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const business = currentBusiness();
    const text = cleanValue(form.get("text"), state.testInbox.message);
    const from = cleanValue(form.get("from"), state.testInbox.phone);
    state.busyAction = "test-inbox";
    state.testInbox = {
      ...state.testInbox,
      status: "Sending...",
      phone: from,
      message: text,
      reply: "Waiting for the auto-reply..."
    };
    render();

    const result = await runServerSimulator({
      business,
      message: {
        id: `test-${crypto.randomUUID()}`,
        from,
        text
      }
    });

    upsertLocalConversation(result.conversation);
    state.activeConversationId = result.conversation.id;
    state.busyAction = "";
    state.testInbox = {
      ...state.testInbox,
      status: result.conversation.status.replace("-", " "),
      reply: getAssistantReply(result.conversation),
      lastConversationId: result.conversation.id
    };
    showToast("Test message sent", "success", { renderNow: false });
    saveWorkspace();
    render();
    location.hash = "automation";
  });

  document.querySelector("#run-pilot-tests-button").addEventListener("click", async () => {
    await runAllPilotTests("automation");
  });

  document.querySelector("#clear-pilot-tests-button").addEventListener("click", async () => {
    const count = workspace.conversations.filter(isPilotConversation).length;
    if (count && !confirm(`Clear ${count} pilot test conversations? Real customer conversations will stay saved.`)) {
      return;
    }

    state.busyAction = "pilot-cleanup";
    state.testSuite = {
      status: "Cleaning",
      summary: "Clearing pilot test conversations...",
      results: state.testSuite.results
    };
    render();
    const deleted = await clearPilotTestConversations();
    if (deleted === null) {
      state.busyAction = "";
      state.testSuite = {
        status: "Needs review",
        summary: "Could not clear pilot test conversations",
        results: state.testSuite.results
      };
      render();
      return;
    }

    state.busyAction = "";
    state.testSuite = {
      status: "Clean",
      summary: deleted ? `Cleared ${deleted} pilot test conversations` : "No pilot test conversations to clear",
      results: []
    };
    showToast(state.testSuite.summary, "success", { renderNow: false });
    saveWorkspace();
    render();
    location.hash = "automation";
  });

  document.querySelector("#export-pilot-report-button").addEventListener("click", () => {
    exportPilotReport("automation");
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
    upsertLocalConversation(result.conversation);
    state.activeConversationId = result.conversation.id;
    showToast("Demo customer added", "success", { renderNow: false });
    saveWorkspace();
    render();
  });

  document.querySelector("#reset-conversations-button").addEventListener("click", async () => {
    const business = currentBusiness();
    const count = currentConversations().length;
    if (count && !confirm(`Reset demo conversations for ${business.name}? Business settings and Knowledge Base will stay saved.`)) {
      return;
    }

    state.busyAction = "reset-conversations";
    render();
    await resetBusinessConversations(business);
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

  document.querySelector("#add-faq-button").addEventListener("click", () => {
    currentBusiness().faqs.push({
      question: "New customer question",
      answer: "Add the answer you want ReplyPilot to use."
    });
    markFaqsChanged();
    saveWorkspace();
    render();
    location.hash = "settings";
  });

  document.querySelectorAll("[data-delete-faq-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const business = currentBusiness();
      if (business.faqs.length <= 1) {
        return;
      }

      business.faqs.splice(Number(button.dataset.deleteFaqIndex), 1);
      markFaqsChanged();
      saveWorkspace();
      render();
      location.hash = "settings";
    });
  });

  document.querySelector("#save-faqs-button").addEventListener("click", async (event) => {
    const business = currentBusiness();
    state.busyAction = "knowledge";
    state.knowledgeStatus = "Saving...";
    saveWorkspace();
    render();
    await saveKnowledgeBase(business, event.currentTarget);
    render();
    location.hash = "settings";
  });

  document.querySelector("#business-settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = event.currentTarget.querySelector("button[type='submit']");
    state.busyAction = "business";
    const form = new FormData(event.currentTarget);
    const business = currentBusiness();
    business.name = cleanValue(form.get("name"), business.name);
    business.type = cleanValue(form.get("type"), business.type);
    business.owner = cleanValue(form.get("owner"), business.owner);
    business.whatsappNumber = cleanValue(form.get("whatsappNumber"), business.whatsappNumber);
    business.appointmentLabel = cleanValue(form.get("appointmentLabel"), business.appointmentLabel);
    business.calendar = {
      ...calendarForBusiness(business),
      calendarId: cleanValue(form.get("calendarId"), ""),
      connected: Boolean(cleanValue(form.get("calendarId"), "")),
      bookingDurationMinutes: cleanNumber(form.get("bookingDurationMinutes"), 60),
      bufferMinutes: cleanNumber(form.get("bufferMinutes"), 15)
    };
    business.businessHours.timeZone = cleanValue(form.get("timeZone"), business.businessHours.timeZone);
    business.businessHours.open = form.get("open") || business.businessHours.open;
    business.businessHours.close = form.get("close") || business.businessHours.close;
    business.businessHours.days = form.getAll("days").map(Number).sort((a, b) => a - b);
    state.saveStatus = "Saving...";
    saveWorkspace();
    render();
    await saveBusinessSettings(business, submitButton);
    render();
    location.hash = "settings";
  });

  document.querySelectorAll("[data-faq-index]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      currentBusiness().faqs[Number(textarea.dataset.faqIndex)].answer = textarea.value;
      markFaqsChanged();
      saveWorkspace();
    });
  });

  document.querySelectorAll("[data-faq-question-index]").forEach((input) => {
    input.addEventListener("input", () => {
      currentBusiness().faqs[Number(input.dataset.faqQuestionIndex)].question = input.value;
      markFaqsChanged();
      saveWorkspace();
      updateBusinessSummary();
    });
  });

  document.querySelectorAll("[data-faq-answer-index]").forEach((textarea) => {
    textarea.addEventListener("input", () => {
      currentBusiness().faqs[Number(textarea.dataset.faqAnswerIndex)].answer = textarea.value;
      markFaqsChanged();
      saveWorkspace();
    });
  });
}

function bindProspectDemoEvents() {
  document.querySelector("#demo-run-pilot-tests-button").addEventListener("click", async () => {
    await runAllPilotTests("demo");
  });

  document.querySelector("#demo-export-pilot-report-button").addEventListener("click", () => {
    exportPilotReport("demo");
  });
}

async function runAllPilotTests(targetHash) {
  state.busyAction = "pilot-tests";
  state.testSuite = {
    status: "Refreshing",
    summary: "Refreshing workspace before pilot checks...",
    results: []
  };
  render();
  await refreshWorkspaceFromServer();
  state.busyAction = "pilot-tests";
  state.testSuite = {
    status: "Running",
    summary: "Running pilot checks...",
    results: []
  };
  render();

  const results = [];
  for (const [businessIndex, business] of workspace.businesses.entries()) {
    for (const check of pilotChecksForBusiness(business)) {
      const result = await runPilotCheck({ business, check, businessIndex });
      results.push(result);
      state.testSuite = testSuiteStateFromResults(results, false);
      render();
    }
  }

  state.busyAction = "";
  state.testSuite = testSuiteStateFromResults(results, true);
  showToast(state.testSuite.summary, results.every((result) => result.ok) ? "success" : "error", { renderNow: false });
  render();
  location.hash = `#${targetHash}`;
}

function exportPilotReport(targetHash) {
  if (!state.testSuite.results.length) {
    showToast("Run pilot tests before exporting a report", "error");
    location.hash = `#${targetHash}`;
    return;
  }

  downloadPilotTestReport();
  showToast("Pilot test report exported", "success");
  location.hash = `#${targetHash}`;
}

function pilotChecksForBusiness(business) {
  const profile = testScenarioProfile(business);
  return [
    {
      kind: "FAQ",
      text: profile.faq,
      validate: (payload) => Boolean(payload.reply?.text && ["faq", "lead"].includes(payload.intent))
    },
    {
      kind: "Booking",
      text: profile.booking.replace(/\btoday at \d{1,2}(?::\d{2})?\s?(?:am|pm)\b/i, "tomorrow"),
      validate: (payload) => payload.intent === "appointment" && payload.conversation?.status === "qualified-lead"
    },
    {
      kind: "Escalation",
      text: profile.human,
      validate: (payload) => payload.intent === "escalation" && payload.conversation?.status === "needs-human"
    }
  ];
}

async function runPilotCheck({ business, check, businessIndex }) {
  try {
    const payload = await runServerSimulator({
      business,
      message: {
        id: `pilot-${business.id}-${check.kind.toLowerCase()}-${crypto.randomUUID()}`,
        from: `+65 93${String(businessIndex).padStart(2, "0")} ${check.kind === "FAQ" ? "1000" : check.kind === "Booking" ? "2000" : "3000"}`,
        text: check.text
      }
    });
    const ok = check.validate(payload);

    return {
      businessId: business.id,
      businessName: business.name,
      kind: check.kind,
      ok,
      detail: ok ? `${payload.intent} / ${payload.conversation?.status || "replied"}` : "Unexpected reply"
    };
  } catch {
    return {
      businessId: business.id,
      businessName: business.name,
      kind: check.kind,
      ok: false,
      detail: "Request failed"
    };
  }
}

function testSuiteStateFromResults(results, complete) {
  const passed = results.filter((result) => result.ok).length;
  const total = results.length;
  const allPassed = total > 0 && passed === total;

  return {
    status: complete ? (allPassed ? "Passed" : "Needs review") : "Running",
    summary: complete ? `${passed}/${total} pilot checks passed` : `${passed}/${total} checks passing so far`,
    results
  };
}

function buildPilotTestReport() {
  const results = state.testSuite.results;
  const passed = results.filter((result) => result.ok).length;
  const generatedAt = new Intl.DateTimeFormat("en-SG", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date());
  const businessNames = [...new Set(results.map((result) => result.businessName))];
  const lines = [
    "ReplyPilot Pilot Test Report",
    `Generated: ${generatedAt}`,
    `Status: ${state.testSuite.status}`,
    `Summary: ${passed}/${results.length} checks passed`,
    `Business templates: ${businessNames.length}`,
    "",
    "Covered checks:",
    ...businessNames.flatMap((businessName) => [
      "",
      businessName,
      ...results
        .filter((result) => result.businessName === businessName)
        .map((result) => `- ${result.kind}: ${result.ok ? "Pass" : "Needs review"} (${result.detail})`)
    ])
  ];

  return `${lines.join("\n")}\n`;
}

function downloadPilotTestReport() {
  const report = buildPilotTestReport();
  const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `replypilot-pilot-test-report-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function isPilotConversation(conversation) {
  return /^(api-pilot-|pilot-)/.test(conversation.id || "");
}

async function clearPilotTestConversations() {
  if (location.protocol !== "file:") {
    try {
      const response = await fetch("/api/pilot-tests/cleanup", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Pilot cleanup API failed");
      }

      const payload = await response.json();
      removePilotConversations();
      await refreshWorkspaceFromServer();
      return payload.deleted || 0;
    } catch {
      showToast("Could not clear pilot tests", "error", { renderNow: false });
      return null;
    }
  }

  const deleted = removePilotConversations();
  return deleted;
}

function removePilotConversations() {
  const before = workspace.conversations.length;
  workspace.conversations = workspace.conversations.filter((conversation) => !isPilotConversation(conversation));
  if (!currentConversations().some((conversation) => conversation.id === state.activeConversationId)) {
    state.activeConversationId = currentConversations()[0]?.id || null;
  }
  return before - workspace.conversations.length;
}

function bindButtonClickIndicators() {
  document.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => showButtonClick(button));
  });
}

function showButtonClick(button) {
  button.classList.remove("button-clicked");
  window.requestAnimationFrame(() => {
    button.classList.add("button-clicked");
    window.setTimeout(() => button.classList.remove("button-clicked"), 480);
  });
}

function setButtonBusy(button, label) {
  if (!button) {
    return;
  }

  button.classList.add("button-busy");
  button.setAttribute("aria-busy", "true");
  const labelNode = button.querySelector("span");
  if (labelNode && label) {
    labelNode.textContent = label;
  }
}

async function runServerSimulator({ business, message }) {
  try {
    const response = await fetch("/api/simulator/message", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        businessId: business.id,
        businessSnapshot: business,
        id: message.id,
        from: message.from,
        text: message.text,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error("Simulator API failed");
    }

    return await response.json();
  } catch {
    return handleIncomingMessage({ business, message });
  }
}

async function resetBusinessConversations(business) {
  if (location.protocol !== "file:") {
    try {
      const response = await fetch(`/api/businesses/${encodeURIComponent(business.id)}/conversations/reset`, {
        method: "POST",
        headers: {
          "content-type": "application/json"
        }
      });

      if (!response.ok) {
        throw new Error("Conversation reset API failed");
      }

      const payload = await response.json();
      applyConversationReset(business.id, payload.conversation);
      state.busyAction = "";
      showToast("Demo conversations reset", "success", { renderNow: false });
      saveWorkspace();
      return;
    } catch {
      state.busyAction = "";
      showToast("Could not reset conversations", "error", { renderNow: false });
      return;
    }
  }

  applyConversationReset(business.id, createStarterConversation(business));
  state.busyAction = "";
  showToast("Demo conversations reset", "success", { renderNow: false });
  saveWorkspace();
}

function applyConversationReset(businessId, conversation) {
  workspace.conversations = workspace.conversations.filter((item) => item.businessId !== businessId);
  if (conversation) {
    workspace.conversations.unshift(conversation);
    state.activeConversationId = conversation.id;
  } else {
    state.activeConversationId = currentConversations()[0]?.id || null;
  }
}

function upsertLocalConversation(conversation) {
  workspace.conversations = workspace.conversations.filter((item) => item.id !== conversation.id);
  workspace.conversations.unshift(conversation);
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

function currentInboxConversations() {
  return currentConversations().filter((conversation) => state.showPilotConversations || !isPilotConversation(conversation));
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
  state.workspace = workspace;
  localStorage.setItem(storageKey, JSON.stringify(workspace));
}

function toastMarkup() {
  if (!state.toast) {
    return `<div class="toast-region" aria-live="polite" aria-atomic="true"></div>`;
  }

  return `
    <div class="toast-region" aria-live="polite" aria-atomic="true">
      <div class="toast ${state.toast.type}" role="status">
        ${toastIcon(state.toast.type)}
        <span>${escapeHtml(state.toast.message)}</span>
      </div>
    </div>
  `;
}

function toastIcon(type) {
  return type === "error" ? icons.shield : icons.bolt;
}

function showToast(message, type = "success", options = {}) {
  const id = crypto.randomUUID();
  state.toast = { id, message, type };

  if (options.renderNow !== false) {
    render();
  }

  window.setTimeout(() => {
    if (state.toast?.id === id) {
      state.toast = null;
      render();
    }
  }, 3400);
}

function saveFeedbackClass() {
  const normalized = state.saveStatus.toLowerCase();
  if (normalized.includes("saving")) {
    return "saving";
  }

  if (normalized.includes("saved") || normalized.includes("synced")) {
    return "saved";
  }

  if (normalized.includes("could not") || normalized.includes("fallback")) {
    return "failed";
  }

  return "";
}

function actionButtonState() {
  return {
    className: buttonBusyClass,
    aria: buttonBusyAria,
    label: buttonBusyLabel
  };
}

function buttonBusyClass(action) {
  return state.busyAction === action ? " button-busy" : "";
}

function buttonBusyAria(action) {
  return state.busyAction === action ? " aria-busy=\"true\"" : "";
}

function buttonBusyLabel(action, readyLabel, busyLabel) {
  return state.busyAction === action ? busyLabel : readyLabel;
}

function knowledgeFeedbackClass() {
  const normalized = state.knowledgeStatus.toLowerCase();
  if (normalized.includes("saving") || normalized.includes("unsaved")) {
    return "saving";
  }

  if (normalized.includes("saved") || normalized.includes("synced")) {
    return "saved";
  }

  if (normalized.includes("could not")) {
    return "failed";
  }

  return "";
}

function markFaqsChanged() {
  state.faqDirty = true;
  state.knowledgeStatus = "Unsaved changes";
}

function getAssistantReply(conversation) {
  const assistantMessage = conversation.messages.findLast((message) => message.from === "assistant");
  return assistantMessage?.text || "No reply was generated for this test.";
}

async function refreshWorkspaceFromServer() {
  if (location.protocol === "file:") {
    return;
  }

  try {
    const response = await fetch("/api/workspace", {
      headers: {
        accept: "application/json"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Workspace API failed");
    }

    const serverWorkspace = await response.json();
    if (!Array.isArray(serverWorkspace.businesses) || !serverWorkspace.businesses.length) {
      throw new Error("Workspace API returned no businesses");
    }

    workspace = serverWorkspace;
    state.workspace = workspace;
    if (!workspace.businesses.some((business) => business.id === state.activeBusinessId)) {
      state.activeBusinessId = workspace.businesses[0].id;
    }

    const conversations = currentConversations();
    if (!conversations.some((conversation) => conversation.id === state.activeConversationId)) {
      state.activeConversationId = conversations[0]?.id || null;
    }

    state.syncStatus = "Synced from server";
    state.saveStatus = "Ready";
    state.busyAction = "";
    state.faqDirty = false;
    state.knowledgeStatus = "Synced from server";
    showToast("Workspace refreshed from server", "success", { renderNow: false });
    saveWorkspace();
    render();
    return true;
  } catch {
    state.syncStatus = "Local fallback";
    state.saveStatus = "Could not refresh from server";
    state.busyAction = "";
    showToast("Could not refresh from server", "error", { renderNow: false });
    render();
    return false;
  }
}

async function saveBusinessSettings(business, submitButton) {
  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.querySelector("span").textContent = "Saving...";
    }

    const response = await fetch(`/api/businesses/${encodeURIComponent(business.id)}/settings`, {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ business })
    });

    if (!response.ok) {
      throw new Error("Settings API failed");
    }

    const payload = await response.json();
    Object.assign(business, payload.business);
    state.syncStatus = "Synced from server";
    state.saveStatus = `Saved ${formatStatusTime(new Date())}`;
    state.busyAction = "";
    showToast("Business settings saved", "success", { renderNow: false });
    saveWorkspace();
  } catch {
    state.syncStatus = "Local fallback";
    state.saveStatus = "Could not save to server";
    state.busyAction = "";
    showToast("Could not save business settings", "error", { renderNow: false });
    console.warn("Business settings were saved locally, but the server could not be updated.");
  }
}

async function saveKnowledgeBase(business, submitButton) {
  try {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.querySelector("span").textContent = "Saving...";
    }

    const response = await fetch(`/api/businesses/${encodeURIComponent(business.id)}/faqs`, {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ faqs: business.faqs })
    });

    if (!response.ok) {
      throw new Error("Knowledge base API failed");
    }

    const payload = await response.json();
    business.faqs = payload.faqs;
    state.faqDirty = false;
    state.syncStatus = "Synced from server";
    state.knowledgeStatus = `Saved ${formatStatusTime(new Date())}`;
    state.busyAction = "";
    showToast("Knowledge base saved", "success", { renderNow: false });
    saveWorkspace();
  } catch {
    state.syncStatus = "Local fallback";
    state.knowledgeStatus = "Could not save to server";
    state.busyAction = "";
    showToast("Could not save knowledge base", "error", { renderNow: false });
    console.warn("Knowledge base was saved locally, but the server could not be updated.");
  }
}

function formatStatusTime(date) {
  return new Intl.DateTimeFormat("en-SG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function updateBusinessSummary() {
  document.querySelectorAll("[data-faq-index]").forEach((textarea) => {
    const faq = currentBusiness().faqs[Number(textarea.dataset.faqIndex)];
    textarea.value = faq.answer;
  });
}

function cleanValue(value, fallback) {
  const cleaned = String(value || "").trim();
  return cleaned || fallback;
}

function cleanNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll('"', "&quot;");
}

window.ReplyPilotDebug = {
  detectIntent,
  extractLead,
  matchFaq
};
