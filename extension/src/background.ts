const CONTEXT_MENU_ID = "analyze-with-page-support";

function startInsertionMode(reply: string): void {
  const OVERLAY_ID = "page-support-assistant-insert-overlay";

  document.getElementById(OVERLAY_ID)?.remove();

  const overlay = document.createElement("div");

  overlay.id = OVERLAY_ID;
  overlay.textContent =
    "Page Support Assistant: clique no campo onde deseja inserir a resposta. Pressione Esc para cancelar.";

  Object.assign(overlay.style, {
    position: "fixed",
    top: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: "2147483647",
    maxWidth: "600px",
    padding: "12px 18px",
    borderRadius: "8px",
    background: "#202124",
    color: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.3)",
    pointerEvents: "none"
  });

  document.body.appendChild(overlay);

  function finish(): void {
    overlay.remove();

    document.removeEventListener(
      "click",
      handleClick,
      true
    );

    document.removeEventListener(
      "keydown",
      handleKeydown,
      true
    );
  }

  function findEditableElement(
    target: EventTarget | null
  ): HTMLInputElement | HTMLTextAreaElement | HTMLElement | null {
    if (!(target instanceof Element)) {
      return null;
    }

    const editable =
      target.closest<
        HTMLInputElement | HTMLTextAreaElement | HTMLElement
      >(
        'textarea, input, [contenteditable="true"]'
      );

    if (!editable) {
      return null;
    }

    if (editable instanceof HTMLInputElement) {
      const allowedTypes = [
        "text",
        "email",
        "search",
        "tel",
        "url"
      ];

      if (
        !allowedTypes.includes(editable.type) ||
        editable.disabled ||
        editable.readOnly
      ) {
        return null;
      }
    }

    if (
      editable instanceof HTMLTextAreaElement &&
      (editable.disabled || editable.readOnly)
    ) {
      return null;
    }

    return editable;
  }

  function insertValue(
    element:
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLElement
  ): void {
    element.focus();

    if (element instanceof HTMLInputElement) {
      const setter =
        Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value"
        )?.set;

      setter?.call(element, reply);
    } else if (
      element instanceof HTMLTextAreaElement
    ) {
      const setter =
        Object.getOwnPropertyDescriptor(
          HTMLTextAreaElement.prototype,
          "value"
        )?.set;

      setter?.call(element, reply);
    } else {
      element.textContent = reply;
    }

    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        inputType: "insertText",
        data: reply
      })
    );

    element.dispatchEvent(
      new Event("change", {
        bubbles: true
      })
    );
  }

  function handleClick(event: MouseEvent): void {
    const editable =
      findEditableElement(event.target);

    if (!editable) {
      overlay.textContent =
        "Esse elemento não é um campo editável. Clique em um input, textarea ou campo editável.";

      return;
    }

    insertValue(editable);
    finish();
  }

  function handleKeydown(
    event: KeyboardEvent
  ): void {
    if (event.key === "Escape") {
      finish();
    }
  }

  document.addEventListener(
    "click",
    handleClick,
    true
  );

  document.addEventListener(
    "keydown",
    handleKeydown,
    true
  );
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Analisar com Page Support Assistant",
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(
  async (info, tab) => {
    if (
      info.menuItemId !== CONTEXT_MENU_ID
    ) {
      return;
    }

    const selectedText =
      info.selectionText?.trim();

    if (
      !selectedText ||
      tab?.id === undefined
    ) {
      return;
    }

    try {
      await chrome.sidePanel.open({
        tabId: tab.id
      });

      await chrome.storage.session.set({
        selectedText,
        pageUrl: info.pageUrl ?? "",
        capturedAt:
          new Date().toISOString()
      });
    } catch (error) {
      console.error(
        "Não foi possível abrir o Page Support Assistant:",
        error
      );
    }
  }
);

chrome.runtime.onMessage.addListener(
  (message, _sender, sendResponse) => {
    if (
      message?.type !== "INSERT_REPLY"
    ) {
      return;
    }

    const reply =
      typeof message.text === "string"
        ? message.text.trim()
        : "";

    if (!reply) {
      sendResponse({
        ok: false,
        error:
          "Nenhuma resposta disponível para inserir."
      });

      return;
    }

    void (async () => {
      try {
        const [tab] =
          await chrome.tabs.query({
            active: true,
            currentWindow: true
          });

        if (tab.id === undefined) {
          sendResponse({
            ok: false,
            error:
              "Não foi possível identificar a aba ativa."
          });

          return;
        }

        await chrome.scripting.executeScript({
          target: {
            tabId: tab.id
          },
          func: startInsertionMode,
          args: [reply]
        });

        sendResponse({
          ok: true
        });
      } catch (error) {
        console.error(
          "Não foi possível iniciar a inserção:",
          error
        );

        sendResponse({
          ok: false,
          error:
            "Não foi possível acessar a página atual."
        });
      }
    })();

    return true;
  }
);
