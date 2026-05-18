const checklistId = "setup";

const icons = {
  ready: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 4 5v6c0 5 3.3 9.4 8 11 4.7-1.6 8-6 8-11V5l-8-3Zm-1 14-3.5-3.5L9 11l2 2 4-4 1.5 1.5L11 16Z"/></svg>`,
  pending: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm1-10.4V6h-2v7h6v-2h-4Z"/></svg>`
};

let renderScheduled = false;

document.addEventListener("DOMContentLoaded", () => {
  renderChecklist();
  observeDashboard();
});

function observeDashboard() {
  const app = document.querySelector("#app");
  if (!app) {
    return;
  }

  const observer = new MutationObserver(() => {
    if (renderScheduled) {
      return;
    }

    renderScheduled = true;
    window.requestAnimationFrame(() => {
      renderScheduled = false;
      renderChecklist();
    });
  });

  observer.observe(app, { childList: true, subtree: true });
}

function renderChecklist() {
  if (document.querySelector(`#${checklistId}`)) {
    ensureSetupNav();
    return;
  }

  const metrics = document.querySelector(".metrics");
  if (!metrics) {
    return;
  }

  ensureSetupNav();
  const items = onboardingItems();
  const readyCount = items.filter((item) => item.done).length;
  const panel = document.createElement("section");
  panel.className = "panel setup-panel";
  panel.id = checklistId;
  panel.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Pilot Onboarding</p>
        <h2>Go-live checklist</h2>
      </div>
      <span class="pill">${readyCount}/${items.length} ready</span>
    </div>
    <div class="setup-checklist">
      ${items.map((item) => `
        <article class="setup-step ${item.done ? "done" : "pending"}">
          <div class="setup-icon">${item.done ? icons.ready : icons.pending}</div>
          <div>
            <strong>${item.label}</strong>
            <span>${item.detail}</span>
          </div>
        </article>
      `).join("")}
    </div>
  `;

  metrics.insertAdjacentElement("afterend", panel);
}

function ensureSetupNav() {
  const nav = document.querySelector(".nav");
  if (!nav || nav.querySelector('a[href="#setup"]')) {
    return;
  }

  const link = document.createElement("a");
  link.href = "#setup";
  link.innerHTML = `${icons.ready}<span>Setup</span>`;
  nav.prepend(link);
}

function onboardingItems() {
  const businessName = document.querySelector(".topbar h1")?.textContent?.trim() || "This business";
  const owner = document.querySelector(".operator span")?.textContent?.trim();
  const whatsappNumber = document.querySelector(".connection-card small")?.textContent?.trim();
  const faqCount = document.querySelectorAll(".faq-item").length || document.querySelectorAll(".faq-settings-item").length;
  const hasAssistantReply = Boolean(document.querySelector(".bubble.assistant"));
  const syncText = Array.from(document.querySelectorAll(".pill, .save-feedback"))
    .map((item) => item.textContent)
    .join(" ");
  const hasProfile = Boolean(businessName && owner && whatsappNumber);
  const hasKnowledge = faqCount >= 3;
  const hasServerSync = /synced|ready|saved/i.test(syncText);

  return [
    {
      label: "Business profile",
      detail: hasProfile ? `${businessName} is ready for customer-facing replies.` : "Complete the business name, owner, and WhatsApp number.",
      done: hasProfile
    },
    {
      label: "Knowledge base",
      detail: hasKnowledge ? `${faqCount} FAQ answers are available for automation.` : "Add at least three FAQ answers before pilot testing.",
      done: hasKnowledge
    },
    {
      label: "Reply test",
      detail: hasAssistantReply ? "A sample customer reply has been generated for this business." : "Run a test message before connecting a live number.",
      done: hasAssistantReply
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
