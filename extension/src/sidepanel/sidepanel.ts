const selectedTextElement =
  document.querySelector<HTMLParagraphElement>("#selected-text");

const pageUrlElement =
  document.querySelector<HTMLAnchorElement>("#page-url");

const sourceSection =
  document.querySelector<HTMLElement>("#source-section");

interface SelectionState {
  selectedText?: string;
  pageUrl?: string;
  capturedAt?: string;
}

function renderSelection(state: SelectionState): void {
  if (
    selectedTextElement &&
    typeof state.selectedText === "string"
  ) {
    selectedTextElement.textContent = state.selectedText;
  }

  if (
    pageUrlElement &&
    sourceSection &&
    typeof state.pageUrl === "string" &&
    state.pageUrl.length > 0
  ) {
    pageUrlElement.href = state.pageUrl;
    pageUrlElement.textContent = state.pageUrl;
    sourceSection.hidden = false;
  }
}

async function loadSelection(): Promise<void> {
  const state =
    await chrome.storage.session.get([
      "selectedText",
      "pageUrl",
      "capturedAt"
    ]);

  renderSelection(state);
}

chrome.storage.onChanged.addListener(
  (changes, areaName) => {
    if (
      areaName !== "session" ||
      !changes.selectedText
    ) {
      return;
    }

    void loadSelection();
  }
);

void loadSelection();
