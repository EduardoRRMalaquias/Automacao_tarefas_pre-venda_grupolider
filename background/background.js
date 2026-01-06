// ========== Background Service Worker ==========

import { processarAba } from './servicos.js';
import { processarTodasAbas } from './servicos.js';

console.log(
  '🔧 Grupolider automação de Leads - Background Service Worker Iniciado',
);

// Recebe a mensagem  e executa a respectiva ação
chrome.runtime.onMessage.addListener(
  (requisicao, remetente, enviarResposta) => {
    console.log('📨 Mensagem recebida no background:', requisicao);

    // Executa auitomação em apenas uma aba
    if (requisicao.acao === 'rodar-unica-aba') {
      console.log(`Comando: Processar unica aba ${requisicao.idAba} `);

      processarAba(requisicao.idAba, requisicao.marca, requisicao.tarefa)
        .then((resposta) => {
          console.log(`✅ Aba ${requisicao.idAba} processada:`, resposta);
          enviarResposta(resposta);
        })
        .catch((erro) => {
          console.error(`❌ Erro na aba ${requisicao.idAba}:`, erro);
          enviarResposta({
            successo: false,
            erro: erro.message,
          });
        });

      return true;
    }

    // Executa a automação em varias abas em sequencia
    if (requisicao.acao === 'rodar-todas-abas') {
      console.log(`Comando: Processar TODAS as abas`);

      processarTodasAbas(requisicao.marca, requisicao.tarefa)
        .then((resultado) => {
          console.log('✅ Todas as abas processadas:', resultado);
        })
        .catch((erro) => {
          console.error('❌ Erro no processamento em lote:', erro);
        });

      enviarResposta({
        iniciado: true,
        menssagem: 'Processamento iniciado em segundo plano',
      });

      return false;
    }

    // verificar disponibilidade do content script
    if (requisicao.acao === 'content-script-pronto') {
      console.log(
        `✅ Content script pronto na aba ${remetente.tab?.id}: ${requisicao.url}`,
      );
      enviarResposta({ recebido: true });
      return false;
    }

    //Comando desconhecido
    console.warn('⚠️ Ação desconhecida:', requisicao.acao);
    enviarResposta({ erro: 'Ação desconhecida' });
    return false;
  },
);

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
