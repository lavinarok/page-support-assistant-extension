const API_URL =
  "http://127.0.0.1:3000";

const selectedTextElement =
  document.querySelector<HTMLParagraphElement>(
    "#selected-text"
  );

const pageUrlElement =
  document.querySelector<HTMLAnchorElement>(
    "#page-url"
  );

const sourceSection =
  document.querySelector<HTMLElement>(
    "#source-section"
  );

const summarizeButton =
  document.querySelector<HTMLButtonElement>(
    "#summarize-button"
  );

const explainButton =
  document.querySelector<HTMLButtonElement>(
    "#explain-button"
  );

const suggestReplyButton =
  document.querySelector<HTMLButtonElement>(
    "#suggest-reply-button"
  );

const resultSection =
  document.querySelector<HTMLElement>(
    "#result-section"
  );

const resultTitle =
  document.querySelector<HTMLHeadingElement>(
    "#result-title"
  );

const resultContent =
  document.querySelector<HTMLParagraphElement>(
    "#result-content"
  );

const insertReplyButton =
  document.querySelector<HTMLButtonElement>(
    "#insert-reply-button"
  );

type AnalysisAction =
  | "summarize"
  | "explain"
  | "suggest-reply";

interface SelectionState {
  selectedText?: string;
  pageUrl?: string;
  capturedAt?: string;
}

interface AnalyzeResponse {
  result?: string;
  error?: string;
  provider?: string;
}

interface InsertReplyResponse {
  ok?: boolean;
  error?: string;
}

let currentSelectedText = "";
let currentPageUrl = "";
let currentResult = "";

let currentAction:
  AnalysisAction | null = null;

function setActionsEnabled(
  enabled: boolean
): void {
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

function hideInsertReplyButton(): void {
  if (insertReplyButton) {
    insertReplyButton.hidden = true;
  }
}

function resetResultState(): void {
  currentResult = "";
  currentAction = null;

  hideInsertReplyButton();
}

function renderSelection(
  state: SelectionState
): void {
  if (
    selectedTextElement &&
    typeof state.selectedText === "string" &&
    state.selectedText.length > 0
  ) {
    currentSelectedText =
      state.selectedText;

    selectedTextElement.textContent =
      state.selectedText;

    setActionsEnabled(true);
  }

  if (
    typeof state.pageUrl === "string"
  ) {
    currentPageUrl =
      state.pageUrl;
  }

  if (
    pageUrlElement &&
    sourceSection &&
    currentPageUrl.length > 0
  ) {
    pageUrlElement.href =
      currentPageUrl;

    pageUrlElement.textContent =
      currentPageUrl;

    sourceSection.hidden =
      false;
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

  resultTitle.textContent =
    title;

  resultContent.textContent =
    content;

  resultSection.hidden =
    false;
}

async function analyze(
  action: AnalysisAction,
  title: string
): Promise<void> {
  if (!currentSelectedText) {
    return;
  }

  setActionsEnabled(false);

  resetResultState();

  showResult(
    title,
    "Analisando..."
  );

  try {
    const response =
      await fetch(
        `${API_URL}/analyze`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            action,
            text:
              currentSelectedText,
            pageUrl:
              currentPageUrl
          })
        }
      );

    const data =
      (await response.json()) as AnalyzeResponse;

    if (!response.ok) {
      throw new Error(
        data.error ??
        "Não foi possível realizar a análise."
      );
    }

    if (
      typeof data.result !== "string"
    ) {
      throw new Error(
        "O servidor retornou uma resposta inválida."
      );
    }

    currentResult =
      data.result;

    currentAction =
      action;

    showResult(
      title,
      data.result
    );

    if (
      insertReplyButton &&
      action === "suggest-reply"
    ) {
      insertReplyButton.hidden =
        false;
    }
  } catch (error) {
    resetResultState();

    const message =
      error instanceof Error
        ? error.message
        : "Erro desconhecido.";

    showResult(
      "Erro",
      message
    );
  } finally {
    setActionsEnabled(true);
  }
}

summarizeButton?.addEventListener(
  "click",
  () => {
    void analyze(
      "summarize",
      "Resumo"
    );
  }
);

explainButton?.addEventListener(
  "click",
  () => {
    void analyze(
      "explain",
      "Explicação"
    );
  }
);

suggestReplyButton?.addEventListener(
  "click",
  () => {
    void analyze(
      "suggest-reply",
      "Resposta sugerida"
    );
  }
);

insertReplyButton?.addEventListener(
  "click",
  async () => {
    if (
      currentAction !== "suggest-reply" ||
      !currentResult
    ) {
      return;
    }

    try {
      const response =
        await chrome.runtime.sendMessage({
          type: "INSERT_REPLY",
          text: currentResult
        }) as InsertReplyResponse;

      if (!response?.ok) {
        showResult(
          "Erro",
          response?.error ??
          "Não foi possível iniciar a inserção."
        );
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a inserção.";

      showResult(
        "Erro",
        message
      );
    }
  }
);

async function loadSelection():
Promise<void> {
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

    resetResultState();

    if (resultSection) {
      resultSection.hidden =
        true;
    }

    void loadSelection();
  }
);

setActionsEnabled(false);
hideInsertReplyButton();

void loadSelection();
