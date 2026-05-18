const tabButtons = document.querySelectorAll(".tab-button");
const tabPanels = document.querySelectorAll(".tab-panel");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const { tab } = button.dataset;

    tabButtons.forEach((item) => item.classList.remove("active"));
    tabPanels.forEach((panel) => panel.classList.remove("active"));

    button.classList.add("active");
    document.getElementById(tab).classList.add("active");
  });
});

const weekButtons = document.querySelectorAll(".log-week-button");
const logTitle = document.getElementById("log-title");
const summaryField = document.getElementById("weekly-summary");
const saveStatus = document.getElementById("save-status");
const saveButton = document.getElementById("save-summary");
const clearButton = document.getElementById("clear-summary");
const summaryPreview = document.getElementById("summary-preview");

const storageKey = "csp-specht-weekly-log";
let weeklyLog = loadLogEntries();
let currentWeek = "1";
let previewRenderToken = 0;

function loadLogEntries() {
  const storedValue = window.localStorage.getItem(storageKey);

  if (!storedValue) {
    return {};
  }

  try {
    return JSON.parse(storedValue);
  } catch (error) {
    return {};
  }
}

function persistLogEntries() {
  window.localStorage.setItem(storageKey, JSON.stringify(weeklyLog));
}

function formatTimestamp(timestamp) {
  return new Date(timestamp).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderPreview(text) {
  previewRenderToken += 1;
  const token = previewRenderToken;
  const trimmed = text.trim();

  if (!trimmed) {
    summaryPreview.innerHTML = "<p>Nothing to preview yet.</p>";
  } else {
    const html = escapeHtml(text)
      .split(/\n{2,}/)
      .map((paragraph) => `<p>${paragraph.replaceAll("\n", "<br>")}</p>`)
      .join("");

    summaryPreview.innerHTML = html;
  }

  scheduleMathTypeset(token);
}

function scheduleMathTypeset(token, attempts = 0) {
  if (token !== previewRenderToken) {
    return;
  }

  if (window.MathJax?.typesetClear && window.MathJax?.typesetPromise) {
    window.MathJax.typesetClear([summaryPreview]);
    window.MathJax.typesetPromise([summaryPreview]).catch(() => {});
    return;
  }

  if (attempts >= 20) {
    return;
  }

  window.setTimeout(() => {
    scheduleMathTypeset(token, attempts + 1);
  }, 150);
}

function updateEditor(week) {
  currentWeek = week;
  const entry = weeklyLog[week];

  weekButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.week === week);
  });

  logTitle.textContent = `Week ${week} Summary`;
  summaryField.value = entry?.text || "";
  saveStatus.textContent = entry?.updatedAt
    ? `Saved ${formatTimestamp(entry.updatedAt)}`
    : "Not saved yet";
  renderPreview(summaryField.value);
}

weekButtons.forEach((button) => {
  button.addEventListener("click", () => updateEditor(button.dataset.week));
});

summaryField.addEventListener("input", () => {
  renderPreview(summaryField.value);
});

window.addEventListener("load", () => {
  renderPreview(summaryField.value);
});

saveButton.addEventListener("click", () => {
  weeklyLog[currentWeek] = {
    text: summaryField.value.trim(),
    updatedAt: Date.now(),
  };

  persistLogEntries();
  updateEditor(currentWeek);
});

clearButton.addEventListener("click", () => {
  delete weeklyLog[currentWeek];
  persistLogEntries();
  updateEditor(currentWeek);
});

updateEditor(currentWeek);
