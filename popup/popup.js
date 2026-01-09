// popup.js
// Elementos do DOM
const operadorInput = document.getElementById('operador');
const botaoSalvarOperador = document.getElementById('savarOperador');
const selectMarca = document.getElementById('marca');
const selectTarefa = document.getElementById('tarefa');
const botaoRodarAutomacao = document.getElementById('rodarAutomacao');
const botoaoRodarTodasAbas = document.getElementById('rodarTodasAbas');
const statusDiv = document.getElementById('status');
const textoStatus = statusDiv.querySelector('.texto-status');
const Iconestatus = statusDiv.querySelector('.icone-status');
const logsDiv = document.getElementById('logs');

// // Carrega Configuracoes
// chrome.storage.local.get(
//   ['operador', 'marcaSelecionada', 'tarefaSelecionada', 'marcaSelecionada'],
//   (configuracoes) => {
//     operadorInput.value = configuracoes.operador || '';
//     selectMarca.value = configuracoes.selecionarMarca || 'gwm';
//     selectTarefa.value = configuracoes.selecionarTarefa || 'primeiro-contato';

//     if (configuracoes.ultimosLogs) {
//       exibirLogs(configuracoes.ultimosLogs);
//     }
//   },
// );

// // Salvar Nome do Operador
// botaoSalvarOperador.addEventListener('click', () => {
//   const nome = operadorInput.value.trim();

//   if (!nome) {
//     exibirStatus('erro', 'Digite um nome valido');
//     return;
//   }

//   chrome.storage.local.set({ operador: nome }, () => {
//     exibirStatus('sucesso', 'Nome salvo com sucesso!');
//     setTimeout(() => {
//       ocultarStatus();
//     }, 2000);
//   });
// });

// Salvar Marca e Tarefa
selectMarca.addEventListener('change', () => {
  chrome.storage.local.set({ SelecionarMarca: selectMarca.value });
});

selectTarefa.addEventListener('change', () => {
  chrome.storage.local.set({ SelecionarTarefa: selectTarefa.value });
});

botaoRodarAutomacao.addEventListener('click', async () => {
  const operador = operadorInput.value.trim();

  if (!operador) {
    exibirStatus('error', 'Primeiro configure o operador ');
    return;
  }

  try {
    exibirStatus('loading', 'Executando automação...');
    desabilitarButoes();
    limparLogs();

    const [aba] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });

    if (!aba.url.includes('lightning.force.com/lightning/r/Lead/')) {
      exibirStatus('error', 'Abra uma página de Lead');
      habilitarButoes();
      return;
    }

    adicionarLog('info', 'Enviando comando da automação para o background...');

    // Envia para background E AGUARDA resposta
    const resposta = await chrome.runtime.sendMessage({
      acao: 'rodar-unica-aba',
      idAba: aba.id,
      marca: selectMarca.value,
      tarefa: selectTarefa.value,
    });

    if (resposta.sucesso) {
      exibirStatus('sucesso', 'Automação concluída!');

      if (resposta.logs) {
        exibirLogs(resposta.logs);
      }
    } else {
      exibirStatus('error', `Erro: ${resposta.erro}`);
    }
  } catch (erro) {
    exibirStatus('erro', `Erro: ${erro.message}`);
    adicionarLog('erro', erro.message);
  } finally {
    habilitarButoes();
  }
});

// executar automação para todas as abas
botoaoRodarTodasAbas.addEventListener('click', async () => {
  const operador = operadorInput.value.trim();

  if (!operador) {
    exibirStatus('error', 'Primeiro configure o operador ');
    return;
  }

  try {
    exibirStatus('loading', 'Executando automação em todas as abas...');
    desabilitarButoes();
    limparLogs();

    // Envia para background (NÃO aguarda processamento completo!)
    chrome.runtime.sendMessage({
      acao: 'rodar-todas-abas',
      marca: selectMarca.value,
      tarefa: selectTarefa.value,
    });

    exibirStatus('sucesso', 'Processamento iniciado!');
  } catch (erro) {
    exibirStatus('erro', `Erro: ${erro.message}`);
    adicionarLog('erro', erro.message);
  } finally {
    setTimeout(() => habilitarButoes(), 1000);
  }
});

//Receber Logs
chrome.runtime.onMessage.addListener(
  (requisicao, remetente, enviarResposta) => {
    console.log('📨 Popup recebeu mensagem de logs:', requisicao);

    // Log da automação
    if (requisicao.acao === 'logs-automacao') {
      adicionarLog(requisicao.tipo, requisicao.menssagem);
      enviarResposta({ recebido: true });
      return false;
    }

    enviarResposta({ recebido: false });
    return false;
  },
);

// // Funcoes de UI
// function exibirStatus(tipo, menssagem) {
//   statusDiv.classList.remove('hidden', 'carregando', 'sucesso', 'erro');
//   statusDiv.classList.add(tipo);
//   textoStatus.textContent = menssagem;

//   const icones = {
//     carregando: '⏳',
//     sucesso: '✅',
//     erro: '❌',
//   };
//   Iconestatus.textContent = icones[tipo] || '📋';
// }

// function ocultarStatus() {
//   statusDiv.classList.add('hidden');
// }

function desabilitarButoes() {
  botaoRodarAutomacao.disabled = true;
  botoaoRodarTodasAbas.disabled = true;
}

function habilitarButoes() {
  botaoRodarAutomacao.disabled = false;
  botoaoRodarTodasAbas.disabled = false;
}

// function limparLogs() {
//   logsDiv.innerHTML = '';
// }

// function adicionarLog(tipo, menssagem) {
//   const entradaLog = document.createElement('div');
//   entradaLog.className = 'entrada-log ' + tipo;
//   entradaLog.textContent =
//     '[' + new Date().toLocaleTimeString() + '] ' + menssagem;
//   logsDiv.appendChild(entradaLog);
//   logsDiv.scrollTop = logsDiv.scrollHeight;
// }

// function exibirLogs(logs) {
//   limparLogs();
//   for (let i = 0; i < logs.length; i++) {
//     adicionarLog(logs[i].tipo, logs[i].menssagem);
//   }
// }
