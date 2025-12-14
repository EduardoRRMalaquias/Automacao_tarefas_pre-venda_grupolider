// Listener de mensagens
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("📨 Mensagem recebida no background:", request);

  if (request.action === "content-script-ready") {
    console.log(
      `✅ Content script pronto na aba ${sender.tab?.id}: ${request.url}`
    );
    sendResponse({ received: true });
    return false;
  }

  // Passa mensagens adiante (se necessário)
  sendResponse({ received: true });
  return false;
});

// Monitora quando abas são fechadas
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`🗑️ Aba ${tabId} fechada`);
});

// Monitora quando abas são atualizadas
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.includes("lightning.force.com/lightning/r/Lead/")
  ) {
    console.log(`✅ Página de Lead carregada na aba ${tabId}`);
  }
});

console.log("✅ Background Service Worker pronto");
