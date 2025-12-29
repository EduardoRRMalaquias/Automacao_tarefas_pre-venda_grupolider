// ============================================================
// BACKGROUND.JS - Service Worker (Roda em Segundo Plano)
// ============================================================

console.log('🔧 Background Service Worker Iniciado');

// ============================================================
// 1. FUNÇÃO AUXILIAR: Sleep
// ============================================================
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// 2. FUNÇÃO AUXILIAR: Enviar Log para Popup
// ============================================================
function sendLogToPopup(type, message) {
  // Tenta enviar mensagem para popup
  chrome.runtime
    .sendMessage({
      action: 'automation-log',
      type: type,
      message: message,
    })
    .catch(() => {
      // Se popup estiver fechado, .catch() captura erro silenciosamente
      // NÃO é um problema - apenas significa que popup não está aberto
    });

  // SEMPRE loga no console (para debug)
  console.log(`[${type}] ${message}`);
}

// ============================================================
// 3. FUNÇÃO CORE: Garantir Scripts Carregados
// ============================================================
async function ensureScriptsLoaded(tabId) {
  console.log(`🔍 Verificando scripts na aba ${tabId}...`);

  // ESTRATÉGIA 1: PING (verifica se já está carregado)
  try {
    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'ping',
    });

    if (response && response.pong) {
      console.log(`✅ Aba ${tabId}: Scripts já carregados`);
      return { method: 'already-loaded', success: true };
    }
  } catch (error) {
    console.log(`⚠️ Aba ${tabId}: Scripts não responderam ao ping`);
  }

  // ESTRATÉGIA 2: INJECT (injeta programaticamente)
  try {
    console.log(`→ Aba ${tabId}: Injetando scripts...`);

    // Injeta na ordem correta
    await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      files: ['content/utilitarios.js'],
    });

    await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      files: ['content/brands/gerenciadorMarcas.js'],
    });

    await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      files: ['content/brands/gwm.js'],
    });

    await chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      files: ['content/content.js'],
    });

    // Aguarda inicialização
    await sleep(1000);

    // Testa se funcionou
    const testResponse = await chrome.tabs.sendMessage(tabId, {
      action: 'ping',
    });

    if (testResponse && testResponse.pong) {
      console.log(`✅ Aba ${tabId}: Scripts injetados com sucesso`);
      return { method: 'injected', success: true };
    }
  } catch (error) {
    console.log(`⚠️ Aba ${tabId}: Injeção falhou - ${error.message}`);
  }

  // ESTRATÉGIA 3: RELOAD (recarrega página como último recurso)
  console.log(`→ Aba ${tabId}: Recarregando página...`);
  await chrome.tabs.reload(tabId);
  await sleep(3000); // Aguarda reload completo

  // Testa se funcionou
  try {
    const testResponse = await chrome.tabs.sendMessage(tabId, {
      action: 'ping',
    });

    if (testResponse && testResponse.pong) {
      console.log(`✅ Aba ${tabId}: Página recarregada com sucesso`);
      return { method: 'reloaded', success: true };
    }
  } catch (error) {
    console.error(`❌ Aba ${tabId}: Todas estratégias falharam`);
    throw new Error('Não foi possível carregar scripts');
  }
}

// ============================================================
// 4. FUNÇÃO CORE: Processar UMA Aba
// ============================================================
async function processTab(tabId, brand, task) {
  console.log(`\n=== PROCESSANDO ABA ${tabId} ===`);

  try {
    // 1. Envia log inicial
    sendLogToPopup('info', `Processando aba ${tabId}...`);

    // 2. Garante que scripts estão carregados
    const loadResult = await ensureScriptsLoaded(tabId);
    sendLogToPopup('info', `Scripts: ${loadResult.method}`);

    // 3. Envia comando de automação para content script
    console.log(`→ Aba ${tabId}: Enviando comando de automação...`);

    const response = await chrome.tabs.sendMessage(tabId, {
      action: 'run-automation',
      brand: brand,
      task: task,
    });

    // 4. Analisa resultado
    if (response && response.success) {
      console.log(`✅ Aba ${tabId}: Automação concluída`);
      sendLogToPopup('success', `✓ Aba ${tabId} processada`);

      // Envia logs detalhados
      if (response.logs && response.logs.length > 0) {
        response.logs.forEach((logEntry) => {
          sendLogToPopup(logEntry.type, logEntry.message);
        });
      }

      return {
        success: true,
        tabId: tabId,
        logs: response.logs,
      };
    } else {
      console.error(`❌ Aba ${tabId}: Automação falhou - ${response?.error}`);
      sendLogToPopup(
        'error',
        `✗ Aba ${tabId}: ${response?.error || 'Erro desconhecido'}`,
      );

      return {
        success: false,
        tabId: tabId,
        error: response?.error || 'Erro desconhecido',
      };
    }
  } catch (error) {
    console.error(`❌ Aba ${tabId}: Exceção - ${error.message}`);
    sendLogToPopup('error', `✗ Aba ${tabId}: ${error.message}`);

    return {
      success: false,
      tabId: tabId,
      error: error.message,
    };
  }
}

// ============================================================
// 5. FUNÇÃO WRAPPER: Processar TODAS as Abas
// ============================================================
async function processAllTabs(brand, task) {
  console.log('\n========================================');
  console.log('🚀 INICIANDO PROCESSAMENTO EM LOTE');
  console.log('========================================\n');

  sendLogToPopup('info', 'Buscando abas de Lead...');

  // 1. Busca todas as abas de Lead
  const tabs = await chrome.tabs.query({
    url: 'https://grupolider.lightning.force.com/lightning/r/Lead/*',
  });

  if (tabs.length === 0) {
    console.log('⚠️ Nenhuma aba de Lead encontrada');
    sendLogToPopup('error', 'Nenhuma aba de Lead aberta');
    return {
      success: false,
      error: 'Nenhuma aba encontrada',
    };
  }

  console.log(`📊 Encontradas ${tabs.length} aba(s) de Lead`);
  sendLogToPopup('info', `Encontradas ${tabs.length} aba(s) de Lead`);

  // 2. Inicializa contadores
  let successCount = 0;
  let failedCount = 0;
  const results = [];

  // 3. Processa cada aba SEQUENCIALMENTE
  for (let i = 0; i < tabs.length; i++) {
    const tab = tabs[i];

    console.log(`\n--- ABA ${i + 1}/${tabs.length} ---`);
    console.log(`ID: ${tab.id}`);
    console.log(`Título: ${tab.title}`);

    sendLogToPopup('info', `[${i + 1}/${tabs.length}] ${tab.title}`);

    // Processa aba usando função genérica
    const result = await processTab(tab.id, brand, task);
    results.push(result);

    if (result.success) {
      successCount++;

      // Aguarda um pouco antes de fechar
      await sleep(1000);

      // Tenta fechar aba
      try {
        await chrome.tabs.remove(tab.id);
        console.log(`🗑️ Aba ${tab.id} fechada`);
        sendLogToPopup('info', `Aba ${tab.id} fechada`);
      } catch (error) {
        console.log(`⚠️ Não foi possível fechar aba ${tab.id}`);
      }
    } else {
      failedCount++;
    }

    // Delay entre abas (para não sobrecarregar)
    console.log(`⏳ Aguardando 2s antes da próxima aba...`);
    await sleep(2000);
  }

  // 4. Finaliza
  console.log('\n========================================');
  console.log('✅ PROCESSAMENTO CONCLUÍDO');
  console.log(`Sucessos: ${successCount}`);
  console.log(`Falhas: ${failedCount}`);
  console.log('========================================\n');

  sendLogToPopup(
    'success',
    `Concluído! ${successCount} sucesso(s), ${failedCount} falha(s)`,
  );

  return {
    success: true,
    total: tabs.length,
    successCount: successCount,
    failedCount: failedCount,
    results: results,
  };
}

// ============================================================
// 6. LISTENER: Recebe Comandos do Popup
// ============================================================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Mensagem recebida no background:', request);

  // COMANDO 1: Executar em ABA ATUAL
  if (request.action === 'run-single-tab') {
    console.log(`→ Comando: Processar aba ${request.tabId}`);

    processTab(request.tabId, request.brand, request.task)
      .then((result) => {
        console.log(`✅ Aba ${request.tabId} processada:`, result);
        sendResponse(result);
      })
      .catch((error) => {
        console.error(`❌ Erro na aba ${request.tabId}:`, error);
        sendResponse({
          success: false,
          error: error.message,
        });
      });

    return true; // Mantém canal aberto para resposta assíncrona
  }

  // COMANDO 2: Executar em TODAS as abas
  if (request.action === 'run-all-tabs') {
    console.log(`→ Comando: Processar TODAS as abas`);

    // NÃO aguarda! Processa em background
    processAllTabs(request.brand, request.task)
      .then((result) => {
        console.log('✅ Todas as abas processadas:', result);
      })
      .catch((error) => {
        console.error('❌ Erro no processamento em lote:', error);
      });

    // Responde IMEDIATAMENTE
    sendResponse({
      started: true,
      message: 'Processamento iniciado em segundo plano',
    });

    return false; // Não mantém canal aberto
  }

  // COMANDO 3: Content script está pronto
  if (request.action === 'content-script-ready') {
    console.log(`✅ Content script pronto na aba ${sender.tab?.id}`);
    sendResponse({ received: true });
    return false;
  }

  // Comando desconhecido
  console.warn('⚠️ Ação desconhecida:', request.action);
  sendResponse({ error: 'Ação desconhecida' });
  return false;
});

// ============================================================
// 7. MONITORAMENTO: Ciclo de Vida das Abas
// ============================================================

// Monitora quando abas são fechadas
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  console.log(`🗑️ Aba ${tabId} foi fechada`);
});

// Monitora quando abas são atualizadas
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    tab.url.includes('lightning.force.com/lightning/r/Lead/')
  ) {
    console.log(`✅ Lead carregado na aba ${tabId}: ${tab.title}`);
  }
});

// Monitora instalação/atualização
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('✅ Extensão instalada pela primeira vez');

    // Define configurações padrão
    chrome.storage.local.set({
      operador: '',
      selectedBrand: 'gwm',
      selectedTask: 'primeiro-contato',
    });
  }

  if (details.reason === 'update') {
    const newVersion = chrome.runtime.getManifest().version;
    console.log(`🔄 Extensão atualizada para versão ${newVersion}`);
  }
});

console.log('✅ Background Service Worker pronto e aguardando comandos');
