import React from 'react';

const BotaoRodarTodasAbas = ({
  configuracao,
  setStatus,
  carregando,
  setCarregando,
  adicionarLog,
  limparLogs,
  tipoEncaminhamento,
  textoBotao,
}) => {
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
        tipoEncaminhamento,
      });

      if (resposta && resposta.iniciado) {
        adicionarLog(
          'info',
          'Processamento em lote iniciado. Acompanhe os logs abaixo.',
        );
      }

      setCarregando(false);
    } catch (erro) {
      setStatus({ tipo: 'erro', mensagem: `Erro: ${erro.message}` });
      adicionarLog('erro', erro.message);
      setCarregando(false);
    }
  };

  return (
    <button
      onClick={rodarTodasAbas}
      disabled={carregando}
      className="botao-primario"
    >
      {carregando
        ? '⏳ Processando...'
        : textoBotao || '🔄 Executar em Todas as Abas'}
    </button>
  );
};

export default BotaoRodarTodasAbas;
