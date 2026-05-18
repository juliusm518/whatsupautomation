const feedbackSelector = "button:not([disabled])";
const nativeToastSelector = ".toast-region";

document.addEventListener("click", (event) => {
  const button = event.target.closest(feedbackSelector);
  if (!button) {
    return;
  }

  button.classList.remove("button-clicked");
  window.requestAnimationFrame(() => {
    button.classList.add("button-clicked");
    window.setTimeout(() => button.classList.remove("button-clicked"), 480);
  });
});

document.addEventListener("submit", (event) => {
  if (event.target.id === "reply-test-form") {
    window.setTimeout(() => showToast("Reply test generated"), 700);
  }

  if (event.target.id === "message-form") {
    window.setTimeout(() => showToast("Auto-reply generated"), 700);
  }

  if (event.target.id === "business-settings-form") {
    watchStatus(event.target.querySelector(".save-feedback"), {
      success: "Business settings saved",
      error: "Could not save business settings"
    });
  }
});

document.addEventListener("click", (event) => {
  const button = event.target.closest(feedbackSelector);
  if (!button) {
    return;
  }

  if (button.id === "save-faqs-button") {
    watchStatus(button.closest(".settings-panel")?.querySelector(".save-feedback"), {
      success: "Knowledge base saved",
      error: "Could not save knowledge base"
    });
  }

  if (button.id === "refresh-workspace-button") {
    watchStatus(button.closest(".settings-panel")?.querySelector(".save-feedback"), {
      success: "Workspace refreshed from server",
      error: "Could not refresh from server"
    });
  }

  if (button.id === "reset-conversations-button") {
    window.setTimeout(() => showToast("Demo conversations reset"), 900);
  }

  if (button.id === "seed-message-button") {
    showToast("Demo customer added");
  }
});

function hasActiveNativeToast() {
  return Boolean(document.querySelector(`${nativeToastSelector} .toast`));
}

function watchStatus(element, messages) {
  if (!element) {
    return;
  }

  const observer = new MutationObserver(() => {
    const text = element.textContent.toLowerCase();
    if (text.includes("saved") || text.includes("synced")) {
      observer.disconnect();
      showToast(messages.success);
    }

    if (text.includes("could not")) {
      observer.disconnect();
      showToast(messages.error, "error");
    }
  });

  observer.observe(element, { childList: true, subtree: true, characterData: true });
  window.setTimeout(() => observer.disconnect(), 6000);
}

function showToast(message, type = "success") {
  if (hasActiveNativeToast()) {
    return;
  }

  const region = getToastRegion();
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  region.replaceChildren(toast);
  window.setTimeout(() => toast.remove(), 3400);
}

function getToastRegion() {
  let region = document.querySelector(".fallback-toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "fallback-toast-region";
    region.setAttribute("aria-live", "polite");
    region.setAttribute("aria-atomic", "true");
    document.body.append(region);
  }

  return region;
}
