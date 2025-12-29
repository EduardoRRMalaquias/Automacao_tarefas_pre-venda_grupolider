// ========== Background Service Worker ==========

console.log('🔧 GWM Lead Automation - Background Service Worker Iniciado');

// Verifica se a mensagem foi recebida e se o script esta carregado corretamente na aba atual
chrome.runtime.onMessage.addListener((requisicao, remetente, enviarResposta) => {
  console.log('📨 Mensagem recebida no background:', requisicao);

  if (requisicao.acao === 'content-script-pronto') {
    console.log(
      `✅ Content script pronto na aba ${remetente.tab?.id}: ${requisicao.url}`,
    );
    return { recebido: true };
  }

  return false;
});

//===========================================================
//Ciclo de vida da extenção

// Monitora instalação e atualização
chrome.runtime.onInstalled.addListener((detalhes) => {
  if (detalhes.reason === 'install') {
    console.log('✅ Extensão instalada pela primeira vez');

    // Configurações padrão
    chrome.storage.local.set({
      operador: '',
      marcaSelecionada: 'gwm',
      tarefaSelecionada: 'primeiro-contato',
      ultimosLogs: [],
    });
  }

  if (detalhes.reason === 'update') {
    const novaVersao = chrome.runtime.getManifest().version;
    console.log(`🔄 Extensão atualizada para versão ${novaVersao}`);
  }
});

// Monitora quando abas são fechadas
chrome.tabs.onRemoved.addListener((idAba, removeInfo) => {
  console.log(`🗑️ Aba ${idAba} fechada`);
});

//Monitora quando abas são atualizadas
chrome.tabs.onUpdated.addListener((idAba, infoMudanca, aba) => {
  if (
    infoMudanca.status === 'complete' &&
    aba.url.includes('lightning.force.com/lightning/r/Lead/')
  ) {
    console.log(`✅ Página de Lead carregada na aba ${idAba}`);
  }
});

console.log('✅ Background Service Worker pronto');
