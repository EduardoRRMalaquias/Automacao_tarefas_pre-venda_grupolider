import React, { useState } from 'react';

const PainelAcoes = ({
  configuracao,
  setConfiguracao,
  setStatus,
  carregando,
  setCarregando,
  adicionarLog,
  limparLogs,
}) => {
  const [arquivo, setArquivo] = useState(null);

  const { tarefaSelecionada } = configuracao;

  const acoesConfig = {
    'primeiro-contato': {
      mostrarBotaoUnico: true,
      mostrarBotaoTodas: true,
      mostrarUpload: false,
    },
    'segundo-contato': {
      mostrarBotaoUnico: true,
      mostrarBotaoTodas: true,
      mostrarUpload: false,
    },
    'encaminhar-leads': {
      mostrarBotaoUnico: true,
      mostrarBotaoTodas: false,
      mostrarUpload: true,
      textoUpload: '📄 Adicione Planilha de Leads (.xlsx)',
      textoBotaoUnico: '📤 cadastrar e encaminhar Leads',
    },
    'cadastrar-leads': {
      mostrarBotaoUnico: true,
      mostrarBotaoTodas: false,
      mostrarUpload: true,
      textoUpload: '📄 Adicione Planilha de Leads (.xlsx)',
      textoBotaoUnico: '📤 Cadastrar Leads',
    },
    ligacoes: {
      mostrarBotaoUnico: false,
      mostrarBotaoTodas: true,
      mostrarUpload: false,
      textoBotaoTodas: '📞 Processar Ligações',
    },
  };

  const config =
    acoesConfig[tarefaSelecionada] || acoesConfig['primeiro-contato'];

  const rodarAutomacao = async () => {
    const { operador, marcaSelecionada, tarefaSelecionada } = configuracao;

    if (!operador) {
      setStatus({
        tipo: 'error',
        mensagem: 'Configure o nome do operador primeiro',
      });
      return;
    }

    if (
      (tarefaSelecionada === 'encaminhar-leads' ||
        tarefaSelecionada === 'cadastrar-leads') &&
      !arquivo
    ) {
      setStatus({
        tipo: 'erro',
        mensagem: 'Selecione uma planilha primeiro',
      });
      return;
    }

    try {
      setStatus({ tipo: 'carregando', mensagem: 'Executando automação...' });
      setCarregando(true);
      limparLogs();

      adicionarLog('info', 'Verificando aba ativa...');

      const [aba] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!aba.url.includes('lightning.force.com/lightning/r/Lead/')) {
        setStatus({ tipo: 'error', mensagem: 'Abra uma página de Lead' });
        setCarregando(false);
        return;
      }

      adicionarLog('info', 'Aba de Lead detectada');
      adicionarLog('info', `Marca: ${marcaSelecionada}`);
      adicionarLog('info', `Tarefa: ${tarefaSelecionada}`);
      adicionarLog('info', 'Enviando comando para background...');

      // Envia para background E AGUARDA resposta
      const resposta = await chrome.runtime.sendMessage({
        acao: 'rodar-unica-aba',
        idAba: aba.id,
        marca: marcaSelecionada,
        tarefa: tarefaSelecionada,
        arquivo: arquivo ? arquivo.name : null,
      });

      if (resposta && resposta.sucesso) {
        setStatus({
          tipo: 'sucesso',
          mensagem: 'Automação concluída com sucesso!',
        });

        if (resposta.logs && resposta.logs.length > 0) {
          setConfiguracao((configuracao) => ({
            ...configuracao,
            ultimosLogs: [configuracao.ultimosLogs, ...resposta.logs],
          }));

          // Salva logs no storage
          chrome.storage.local.set({
            ultimosLogs: [...configuracao.ultimosLogs, ...resposta.logs],
          });
        }
      } else {
        setStatus({ tipo: 'error', mensagem: `Erro: ${resposta?.erro}` });

        if (resposta?.logs) {
          setConfiguracao((configuracao) => ({
            ...configuracao,
            ultimosLogs: [...configuracao.ultimosLogs, ...resposta.logs],
          }));
        }
      }
    } catch (erro) {
      setStatus({ tipo: 'erro', mensagem: `Erro: ${erro.message}` });
      adicionarLog('erro', erro.message);
    } finally {
      setCarregando(false);
    }
  };

  const rodarTodasAbas = async () => {
    const { operador, marcaSelecionada, tarefaSelecionada } = configuracao;

    if (!operador) {
      setStatus({
        tipo: 'error',
        mensagem: 'Configure o nome do operador primeiro',
      });
      return;
    }

    try {
      setStatus({
        tipo: 'carregando',
        mensagem: 'Processando todas as abas...',
      });
      setCarregando(true);
      limparLogs();

      adicionarLog('info', 'Buscando abas de Lead...');

      const resposta = await chrome.runtime.sendMessage({
        acao: 'rodar-todas-abas',
        marca: marcaSelecionada,
        tarefa: tarefaSelecionada,
      });

      if (resposta && resposta.iniciado) {
        adicionarLog(
          'info',
          'Processamento em lote iniciado. Acompanhe os logs abaixo.',
        );
      }

      setCarregando(false);
    } catch (error) {
      setStatus({ tipo: 'erro', mensagem: `Erro: ${erro.message}` });
      adicionarLog('erro', erro.message);
      setCarregando(false);
    }
  };

  // ✅ Upload arquivo (para encaminhar-leads)
  const carregarArquivo = (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
      setArquivo(arquivo);
      adicionarLog('info', `Arquivo selecionado: ${arquivo.name}`);
    }
  };

  return (
    <article className="acoes">
      {config.mostrarUpload && (
        <div className="secao-upload">
          <label htmlFor="carregarArquivo" className="botao-carregar-arquivo">
            {config.textoUpload || '📄 Selecionar Arquivo'}
          </label>
          <input
            id="carregarArquivo"
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={carregarArquivo}
            style={{ display: 'none' }}
          />
          {arquivo && <span className="arquivo-nome">✅ {arquivo.name}</span>}
        </div>
      )}

      {config.mostrarBotaoUnico && (
        <button
          onClick={rodarAutomacao}
          disabled={carregando}
          className="botao-primario"
        >
          {carregando
            ? '⏳ Executando...'
            : config.textoBotaoUnico || '▶️ Executar Automação'}
        </button>
      )}

      {config.mostrarBotaoTodas && (
        <button
          onClick={rodarTodasAbas}
          disabled={carregando}
          className="botao-primario"
        >
          {carregando
            ? '⏳ Processando...'
            : config.textoBotaoTodas || '🔄 Executar em Todas as Abas'}
        </button>
      )}
    </article>
  );
};

export default PainelAcoes;
