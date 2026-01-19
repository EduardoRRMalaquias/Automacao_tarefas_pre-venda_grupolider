import React from 'react';

const BotaoRodarAutomacao = ({
  configuracao,
  setConfiguracao,
  setStatus,
  carregando,
  setCarregando,
  adicionarLog,
  limparLogs,
  tipoEncaminhamento,
  textoBotao,
}) => {
  const rodarAutomacao = async () => {
    const { operador, marcaSelecionada, tarefaSelecionada } = configuracao;

    if (!operador) {
      setStatus({
        tipo: 'error',
        mensagem: 'Configure o nome do operador primeiro',
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
        tipoEncaminhamento,
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

  return (
    <button
      onClick={rodarAutomacao}
      disabled={carregando}
      className="botao-primario"
    >
      {carregando ? '⏳ Executando...' : textoBotao || '▶️ Executar Automação'}
    </button>
  );
};

export default BotaoRodarAutomacao;
