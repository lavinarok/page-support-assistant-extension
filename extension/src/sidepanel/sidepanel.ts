const selectedTextElement =
  document.querySelector<HTMLParagraphElement>("#selected-text");

const pageUrlElement =
  document.querySelector<HTMLAnchorElement>("#page-url");

const sourceSection =
  document.querySelector<HTMLElement>("#source-section");

const summarizeButton =
  document.querySelector<HTMLButtonElement>("#summarize-button");

const explainButton =
  document.querySelector<HTMLButtonElement>("#explain-button");

const suggestReplyButton =
  document.querySelector<HTMLButtonElement>("#suggest-reply-button");

const resultSection =
  document.querySelector<HTMLElement>("#result-section");

const resultTitle =
  document.querySelector<HTMLHeadingElement>("#result-title");

const resultContent =
  document.querySelector<HTMLParagraphElement>("#result-content");

interface SelectionState {
  selectedText?: string;
  pageUrl?: string;
  capturedAt?: string;
}

let currentSelectedText = "";

function setActionsEnabled(enabled: boolean): void {
  if (summarizeButton) {
    summarizeButton.disabled = !enabled;
  }

  if (explainButton) {
    explainButton.disabled = !enabled;
  }

  if (suggestReplyButton) {
    suggestReplyButton.disabled = !enabled;
  }
}

function renderSelection(state: SelectionState): void {
  if (
    selectedTextElement &&
    typeof state.selectedText === "string" &&
    state.selectedText.length > 0
  ) {
    currentSelectedText = state.selectedText;
    selectedTextElement.textContent = state.selectedText;
    setActionsEnabled(true);
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

function showResult(
  title: string,
  content: string
): void {
  if (
    !resultSection ||
    !resultTitle ||
    !resultContent
  ) {
    return;
  }

  resultTitle.textContent = title;
  resultContent.textContent = content;
  resultSection.hidden = false;
}

function createMockSummary(text: string): string {
  const normalizedText =
    text.replace(/\s+/g, " ").trim();

  if (normalizedText.length <= 220) {
    return normalizedText;
  }

  return `${normalizedText.slice(0, 220).trim()}...`;
}

function createMockExplanation(text: string): string {
  const wordCount =
    text.trim().split(/\s+/).filter(Boolean).length;

  return (
    `O texto selecionado possui aproximadamente ${wordCount} palavras. ` +
    "Nesta versão de demonstração, esta ação apenas comprova que o conteúdo " +
    "capturado pode ser processado e transformado antes de ser exibido novamente. " +
    "Na próxima etapa, esse processamento poderá ser substituído por uma IA."
  );
}

function createMockReply(text: string): string {
  const excerpt =
    text.replace(/\s+/g, " ").trim().slice(0, 120);

  return (
    "Obrigado pela mensagem. Entendi o contexto apresentado" +
    (excerpt ? `: "${excerpt}${text.length > 120 ? "..." : ""}"` : ".") +
    " Vou analisar as informações e retornar com uma orientação adequada."
  );
}

summarizeButton?.addEventListener("click", () => {
  if (!currentSelectedText) {
    return;
  }

  showResult(
    "Resumo",
    createMockSummary(currentSelectedText)
  );
});

explainButton?.addEventListener("click", () => {
  if (!currentSelectedText) {
    return;
  }

  showResult(
    "Explicação",
    createMockExplanation(currentSelectedText)
  );
});

suggestReplyButton?.addEventListener("click", () => {
  if (!currentSelectedText) {
    return;
  }

  showResult(
    "Resposta sugerida",
    createMockReply(currentSelectedText)
  );
});

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

    if (resultSection) {
      resultSection.hidden = true;
    }

    void loadSelection();
  }
);

setActionsEnabled(false);
void loadSelection();
