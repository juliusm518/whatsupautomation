const feedbackSelector = "button:not([disabled])";

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
