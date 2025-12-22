// ========== Background Service Worker ==========

console.log('🔧 GWM Lead Automation - Background Service Worker Iniciado');

// Listener de instalação
chrome.runtime.onInstalled.addListener((detalhes) => {
  if (detalhes.reason === 'install') {
    console.log('✅ Extensão instalada pela primeira vez');
    
    // Configurações padrão
    chrome.storage.local.set({
      operador: '',
      marcaSelecionada: 'gwm',
      tarefaSelecionada: 'primeiro-contato',
      ultimosLogs: []
    });
  }
  
  if (detalhes.reason === 'update') {
    console.log('🔄 Extensão atualizada');
  }
});



// Verifica se a mensagem foi recebida e se o script esta carregado corretamente na aba atual
chrome.runtime.onMessage.addListener((requisicao, data, enviarResposta) => {
    console.log("📨 Mensagem recebida no background:", requisicao)

    if (requisicao.acao === "content-script-pronto"){
        console.log(
            `✅ Content script pronto na aba ${data.tab?.id}: ${requisicao.url}`
        );
        enviarResposta({ recebido: true });
        return false;
    }

    // Passa mensagens adiante (se necessário)
  enviarResposta({ recebido: true });
  return false;
});

// Monitora quando abas são fechadas
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    console.log(`🗑️ Aba ${tabId} fechada`);
});

//Monitora quando abas são atualizadas
chrome.tabs.onUpdated.addListener((tabId, infoMudanca, tab) => {
    if(
        infoMudanca.status === "complete" &&
        tab.url.includes("lightning.force.com/lightning/r/Lead/")
    ){
        console.log(`✅ Página de Lead carregada na aba ${tabId}`);
    }
});


console.log("✅ Background Service Worker pronto");