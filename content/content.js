// content.js
// ========== Content Script Principal ==========

(function () {
  "use strict";

  console.log("🚀 GWM Lead Automation - Content Script Carregado");

  // Verifica se está em uma página de Lead
  function isLeadPage() {
    return window.location.href.includes("/lightning/r/Lead/");
  }

  // Listener para mensagens do popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📨 Mensagem recebida:", request);

    if (request.action === "run-automation") {
      handleAutomation(request)
        .then((result) => {
          console.log("✅ Automação finalizada:", result);
          sendResponse(result);
        })
        .catch((error) => {
          console.error("❌ Erro na automação:", error);
          sendResponse({
            success: false,
            error: error.message,
            logs: [
              {
                type: "error",
                message: error.message,
              },
            ],
          });
        });

      return true; // Mantém o canal aberto para resposta assíncrona
    }

    if (request.action === "check-page") {
      sendResponse({
        isLeadPage: isLeadPage(),
        url: window.location.href,
      });
      return false;
    }

    sendResponse({ error: "Ação desconhecida" });
    return false;
  });

  /**
   * Processa a automação
   */
  async function handleAutomation(request) {
    const { brand, task } = request;

    // Validações
    if (!isLeadPage()) {
      return {
        success: false,
        error: "Não está em uma página de Lead",
        logs: [
          {
            type: "error",
            message: "Esta página não é uma página de Lead válida",
          },
        ],
      };
    }

    if (!window.brandManager) {
      return {
        success: false,
        error: "BrandManager não inicializado",
        logs: [
          {
            type: "error",
            message: "Sistema de marcas não está disponível",
          },
        ],
      };
    }

    // Verifica se a marca existe
    const brandConfig = window.brandManager.getBrand(brand);
    if (!brandConfig) {
      return {
        success: false,
        error: `Marca "${brand}" não encontrada`,
        logs: [
          {
            type: "error",
            message: `Marca ${brand} não está registrada no sistema`,
          },
        ],
      };
    }

    // Verifica se a tarefa existe
    const taskConfig = window.brandManager.getTask(brand, task);
    if (!taskConfig) {
      return {
        success: false,
        error: `Tarefa "${task}" não encontrada para marca "${brand}"`,
        logs: [
          {
            type: "error",
            message: `Tarefa ${task} não disponível para ${brand}`,
          },
        ],
      };
    }

    // Executa a tarefa
    console.log(`🎯 Executando: ${brand} > ${task}`);

    try {
      const result = await window.brandManager.executeTask(brand, task, {
        url: window.location.href,
        timestamp: new Date().toISOString(),
      });

      return {
        success: result.success,
        logs: result.result?.logs || [],
        error: result.error,
      };
    } catch (error) {
      console.error("❌ Erro ao executar tarefa:", error);
      return {
        success: false,
        error: error.message,
        logs: [
          {
            type: "error",
            message: `Erro fatal: ${error.message}`,
          },
        ],
      };
    }
  }

  // Aguarda brandManager estar disponível
  let attempts = 0;
  const maxAttempts = 50;
  const checkInterval = setInterval(() => {
    attempts++;

    if (window.brandManager) {
      clearInterval(checkInterval);
      console.log("✅ BrandManager detectado e pronto");

      // Indica que o content script está pronto
      chrome.runtime
        .sendMessage({
          action: "content-script-ready",
          url: window.location.href,
        })
        .catch(() => {
          // Ignora erro se background não estiver escutando
        });
    }

    if (attempts >= maxAttempts) {
      clearInterval(checkInterval);
      console.error("❌ BrandManager não foi carregado após 5 segundos");
    }
  }, 100);

  console.log("✅ Content Script inicializado e aguardando comandos");
})();
