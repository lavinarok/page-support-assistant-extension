const CONTEXT_MENU_ID = "analyze-with-page-support";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: "Analisar com Page Support Assistant",
      contexts: ["selection"]
    });
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) {
    return;
  }

  const selectedText = info.selectionText?.trim();

  if (!selectedText || tab?.id === undefined) {
    return;
  }

  try {
    await chrome.sidePanel.open({
      tabId: tab.id
    });

    await chrome.storage.session.set({
      selectedText,
      pageUrl: info.pageUrl ?? "",
      capturedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error(
      "Não foi possível abrir o Page Support Assistant:",
      error
    );
  }
});
