// popup.js
// Elementos do DOM
const operadorInput = document.getElementById("operador");
const botaoSalvarOperador = document.getElementById("savarOperador");
const selectMarca = document.getElementById("marca");
const selectTarefa = document.getElementById("tarefa");
const botaoRodarAutomacao = document.getElementById("rodarAutomacao");
const botoaoRodarTodasAbas = document.getElementById("rodarTodasAbas");
const statusDiv = document.getElementById("status");
const textoStatus = statusDiv.querySelector(".texto-status");
const Iconestatus = statusDiv.querySelector(".icone-status");
const logsDiv = document.getElementById("logs");

// Carrega Configuracoes
chrome.storage.local.get(
  ["operador", "selectedBrand", "selectedTask", "lastLogs"],
  function (configuracoes) {
    operadorInput.value = configuracoes.operador || "";
    selectMarca.value = configuracoes.selecionarMarca || "gwm";
    selectTarefa.value = configuracoes.selecionarTarefa || "primeiro-contato";

    if (configuracoes.ultimosLogs) {
      exibirLogs(configuracoes.ultimosLogs);
    }
  }
);

// Salvar Nome do Operador
botaoSalvarOperador.addEventListener("click", function () {
  const nome = operadorInput.value.trim();

  if (!nome) {
    exibirStatus("erro", "Digite um nome valido");
    return;
  }

  chrome.storage.local.set({ operador: nome }, function () {
    exibirStatus("sucesso", "Nome salvo com sucesso!");
    setTimeout(function () {
      ocultarStatus();
    }, 2000);
  });
});

// Salvar Marca e Tarefa
selectMarca.addEventListener("change", function () {
  chrome.storage.local.set({ SelecionarMarca: selectMarca.value });
});

selectTarefa.addEventListener("change", function () {
  chrome.storage.local.set({ SelecionarTarefa: selectTarefa.value });
});

// SOLUÇÃO HÍBRIDA - Melhor dos dois mundos
async function garantirCarregamentoScripts(tabId){
    // Verificar se script esta carregado
    try{
        const resposta = await chrome.tabs.sendMenssage(tabId, {acao: 'ping'});
        if(resposta.pong) return { metodo: "script-carregado", sucesso: true}
    }catch{}

    // Injetar script se não estiver carregado
    try{
        await chrome.scripting.executeScript({
            target: {tabId, allFrames: true},
            files: ["content/marcas/gerenciadorMarcas.js", "content/marcas/gwm.js", "content/content.js"]
        });
        return {metodo: "injetado", susesso: true};
    }catch{}

    await chrome.tabs.reload(tabId);
    await sleep(3000);
    return {metodo: "recarregado", sucesso: true}
}

// Executar Automacao na Aba Atual
botaoRodarAutomacao.addEventListener("click", async function () {
  const operador = operadorInput.value.trim();

  if (!operador) {
    exibirStatus("erro", "Configure o nome do operador primeiro");
    return;
  }

  try {
    exibirStatus("loading", "Executando automacao...");
    desabilitarButoes();
    limparLogs();

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab.url.includes("lightning.force.com/lightning/r/Lead/")) {
      exibirStatus("erro", "Abra uma pagina de Lead do Salesforce");
      habilitarButões();
      return;
    }

    // SOLUCAO HIBRIDA: Garante que scripts estao carregados
    adicionarLog("info", "Verificando scripts...");
    const resultadoCarregamento = await garantirCarregamentoScripts(tab.id);

    if (resultadoCarregamento.metodo === "injetado") {
      adicionarLog("info", "Scripts injetados dinamicamente");
    } else if (resultadoCarregamento.metodo === "recarregado") {
      adicionarLog("info", "Pagina foi recarregada");
    } else {
      adicionarLog("info", "Scripts ja estavam carregados");
    }

    // Executa automacao
    adicionarLog("info", "Iniciando automacao...");

    const response = await chrome.tabs.sendMessage(tab.id, {
      acao: "rodar-automacao",
      marca: selectMarca.value,
      tarefa: selectTarefa.value,
    });

    if (response.success) {
      exibirStatus("sucesso", "Automacao concluida com sucesso!");
      exibirLogs(response.logs);
      chrome.storage.local.set({ ultimosLogs: response.logs });

      setTimeout(async function () {
        try {
          await chrome.tabs.remove(tab.id);
        } catch (e) {
          console.log("Aba ja foi fechada");
        }
      }, 2000);
    } else {
      exibirStatus("erro", "Erro: " + response.error);
      exibirLogs(response.logs || []);
    }
  } catch (error) {
    exibirStatus("erro", "Erro: " + error.message);
    adicionarLog("erro", error.message);
  } finally {
    desabilitarButoes();
  }
});

// Funcoes de UI
function exibirStatus(tipo, menssagem) {
  statusDiv.classList.remove("hidden", "carregando", "sucesso", "erro");
  statusDiv.classList.add(tipo);
  textoStatus.textContent = menssagem;

  const icones = {
    carregando: "⏳",
    sucesso: "✅",
    erro: "❌",
  };
  Iconestatus.textContent = icones[tipo] || "📋";
}

function ocultarStatus() {
  statusDiv.classList.add("hidden");
}

function desabilitarButoes() {
  botaoRodarAutomacao.disabled = true;
  botoaoRodarTodasAbas.disabled = true;
}

function habilitarButões() {
  botaoRodarAutomacao.disabled = false;
  botoaoRodarTodasAbas.disabled = false;
}

function limparLogs() {
  logsDiv.innerHTML = "";
}

function adicionarLog(tipo, messagem) {
  const logEntry = document.createElement("div");
  logEntry.className = "entrada-log " + tipo;
  logEntry.textContent = "[" + new Date().toLocaleTimeString() + "] " + messagem;
  logsDiv.appendChild(logEntry);
  logsDiv.scrollTop = logsDiv.scrollHeight;
}

function exibirLogs(logs) {
  limparLogs();
  for (let i = 0; i < logs.length; i++) {
    adicionarLog(logs[i].type, logs[i].messagem);
  }
}
