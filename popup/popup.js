// popup.js
// Elementos do DOM
const operadorInput = document.getElementById("operador");
const saveOperadorBtn = document.getElementById("saveOperador");
const brandSelect = document.getElementById("brand");
const taskSelect = document.getElementById("task");
const runAutomationBtn = document.getElementById("runAutomation");
const runAllTabsBtn = document.getElementById("runAllTabs");
const statusDiv = document.getElementById("status");
const statusText = statusDiv.querySelector(".status-text");
const statusIcon = statusDiv.querySelector(".status-icon");
const logsDiv = document.getElementById("logs");

// Carrega Configuracoes
chrome.storage.local.get(
  ["operador", "selectedBrand", "selectedTask", "lastLogs"],
  function (data) {
    operadorInput.value = data.operador || "";
    brandSelect.value = data.selectedBrand || "gwm";
    taskSelect.value = data.selectedTask || "primeiro-contato";

    if (data.lastLogs) {
      displayLogs(data.lastLogs);
    }
  }
);

// Salvar Nome do Operador
saveOperadorBtn.addEventListener("click", function () {
  const nome = operadorInput.value.trim();

  if (!nome) {
    showStatus("error", "Digite um nome valido");
    return;
  }

  chrome.storage.local.set({ operador: nome }, function () {
    showStatus("success", "Nome salvo com sucesso!");
    setTimeout(function () {
      hideStatus();
    }, 2000);
  });
});

// Salvar Marca e Tarefa
brandSelect.addEventListener("change", function () {
  chrome.storage.local.set({ selectedBrand: brandSelect.value });
});

taskSelect.addEventListener("change", function () {
  chrome.storage.local.set({ selectedTask: taskSelect.value });
});

// SOLUÇÃO HÍBRIDA - Melhor dos dois mundos
async function ensureScriptsLoaded(tabId) {
  // 1. Verifica se já está carregado (manifest injetou)
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: "ping" });
    if (response.pong) return { method: "already-loaded", success: true };
  } catch {}

  // 2. Se não, INJETA manualmente
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ["content/brands/brandManager.js", "content/brands/gwm.js", "content/content.js"]
    });
    return { method: "injected", success: true };
  } catch {}

  // 3. Se falhar, RECARREGA a página
  await chrome.tabs.reload(tabId);
  await sleep(3000);
  return { method: "reloaded", success: true };
}

// Executar Automacao na Aba Atual
runAutomationBtn.addEventListener("click", async function () {
  const operador = operadorInput.value.trim();

  if (!operador) {
    showStatus("error", "Configure o nome do operador primeiro");
    return;
  }

  try {
    showStatus("loading", "Executando automacao...");
    disableButtons();
    clearLogs();

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab.url.includes("lightning.force.com/lightning/r/Lead/")) {
      showStatus("error", "Abra uma pagina de Lead do Salesforce");
      enableButtons();
      return;
    }

    // SOLUCAO HIBRIDA: Garante que scripts estao carregados
    addLog("info", "Verificando scripts...");
    const loadResult = await ensureScriptsLoaded(tab.id);

    if (loadResult.method === "injected") {
      addLog("info", "Scripts injetados dinamicamente");
    } else if (loadResult.method === "reloaded") {
      addLog("info", "Pagina foi recarregada");
    } else {
      addLog("info", "Scripts ja estavam carregados");
    }

    // Executa automacao
    addLog("info", "Iniciando automacao...");

    const response = await chrome.tabs.sendMessage(tab.id, {
      action: "run-automation",
      brand: brandSelect.value,
      task: taskSelect.value,
    });

    if (response.success) {
      showStatus("success", "Automacao concluida com sucesso!");
      displayLogs(response.logs);
      chrome.storage.local.set({ lastLogs: response.logs });

      setTimeout(async function () {
        try {
          await chrome.tabs.remove(tab.id);
        } catch (e) {
          console.log("Aba ja foi fechada");
        }
      }, 2000);
    } else {
      showStatus("error", "Erro: " + response.error);
      displayLogs(response.logs || []);
    }
  } catch (error) {
    showStatus("error", "Erro: " + error.message);
    addLog("error", error.message);
  } finally {
    enableButtons();
  }
});

// Executar em Todas as Abas
runAllTabsBtn.addEventListener("click", async function () {
  const operador = operadorInput.value.trim();

  if (!operador) {
    showStatus("error", "Configure o nome do operador primeiro");
    return;
  }

  try {
    showStatus("loading", "Processando todas as abas...");
    disableButtons();
    clearLogs();

    const tabs = await chrome.tabs.query({
      url: "https://grupolider.lightning.force.com/lightning/r/Lead/*",
    });

    if (tabs.length === 0) {
      showStatus("error", "Nenhuma aba de Lead aberta");
      enableButtons();
      return;
    }

    addLog("info", "Encontradas " + tabs.length + " aba(s) de Lead");

    let success = 0;
    let failed = 0;

    for (let i = 0; i < tabs.length; i++) {
      const tab = tabs[i];
      try {
        addLog("info", "Processando: " + tab.title);

        // SOLUCAO HIBRIDA: Garante scripts em cada aba
        const loadResult = await ensureScriptsLoaded(tab.id);

        const response = await chrome.tabs.sendMessage(tab.id, {
          action: "run-automation",
          brand: brandSelect.value,
          task: taskSelect.value,
        });

        if (response.success) {
          success++;
          addLog("success", "Sucesso: " + tab.title);

          await new Promise(function (resolve) {
            setTimeout(resolve, 1000);
          });
          try {
            await chrome.tabs.remove(tab.id);
          } catch (e) {
            console.log("Aba ja foi fechada");
          }
        } else {
          failed++;
          addLog("error", "Falhou: " + tab.title + " - " + response.error);
        }

        await new Promise(function (resolve) {
          setTimeout(resolve, 2000);
        });
      } catch (error) {
        failed++;
        addLog("error", "Erro em " + tab.title + ": " + error.message);
      }
    }

    showStatus(
      "success",
      "Concluido! " + success + " sucesso(s), " + failed + " falha(s)"
    );
  } catch (error) {
    showStatus("error", "Erro: " + error.message);
    addLog("error", error.message);
  } finally {
    enableButtons();
  }
});

// Funcoes de UI
function showStatus(type, message) {
  statusDiv.classList.remove("hidden", "loading", "success", "error");
  statusDiv.classList.add(type);
  statusText.textContent = message;

  const icons = {
    loading: "⏳",
    success: "✅",
    error: "❌",
  };
  statusIcon.textContent = icons[type] || "📋";
}

function hideStatus() {
  statusDiv.classList.add("hidden");
}

function disableButtons() {
  runAutomationBtn.disabled = true;
  runAllTabsBtn.disabled = true;
}

function enableButtons() {
  runAutomationBtn.disabled = false;
  runAllTabsBtn.disabled = false;
}

function clearLogs() {
  logsDiv.innerHTML = "";
}

function addLog(type, message) {
  const logEntry = document.createElement("div");
  logEntry.className = "log-entry " + type;
  logEntry.textContent = "[" + new Date().toLocaleTimeString() + "] " + message;
  logsDiv.appendChild(logEntry);
  logsDiv.scrollTop = logsDiv.scrollHeight;
}

function displayLogs(logs) {
  clearLogs();
  for (let i = 0; i < logs.length; i++) {
    addLog(logs[i].type, logs[i].message);
  }
}
