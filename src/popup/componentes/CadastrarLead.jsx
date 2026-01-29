import React, { useEffect } from 'react';
import { coletarDadosPlanilha } from '../../background/coletarDadosPlanilha';

const CadastrarLead = ({
  configuracao,
  setStatus,
  carregando,
  setCarregando,
  arquivo,
  setArquivo,
  textoUpload,
  adicionarLog,
  limparLogs,
}) => {
  const carregarArquivo = (e) => {
    const arquivoSelecionado = e.target.files[0];
    if (arquivoSelecionado) {
      setArquivo(arquivoSelecionado);
      adicionarLog('info', `Arquivo selecionado: ${arquivoSelecionado.name}`);
    }
  };

  const rodarCadastrarLeads = async () => {
    const { operador, marcaSelecionada } = configuracao;

    if (!operador) {
      setStatus({
        tipo: 'erro',
        mensagem: 'Config o nome do operador primeiro',
      });
      return;
    }

    if (!arquivo) {
      {
        setStatus({
          tipo: 'erro',
          mensagem: 'Selecione uma planilha primeiro',
        });
        return;
      }
    }

    try {
      setStatus({ tipo: 'carregando', mensagem: 'Processando planilha...' });
      setCarregando(true);
      limparLogs();

      adicionarLog('info', `📄 Lendo arquivo: ${arquivo.name}`);

      const resultado = await coletarDadosPlanilha(arquivo);
      console.log(resultado);

      adicionarLog('info', `📊 Total de linhas: ${resultado.total}`);
      adicionarLog('sucesso', `✅ Leads válidos: ${resultado.validos}`);

      if (resultado.invalidos > 0) {
        adicionarLog('alerta', `⚠️ Leads inválidos: ${resultado.invalidos}`);

        const errosExibir = resultado.erros.slice(0, 5);
        errosExibir.forEach((erro) => {
          const mensagemErro = erro.erros;
          adicionarLog('erro', `  Linha ${erro.linha}: ${mensagemErro} erros`);
        });
      }

      if (resultado.invalidos > 5) {
        adicionarLog(`info`, `... e mais ${resultado.invalidos - 5}`);
      }

      if (resultado.validos === 0) {
        setStatus({
          tipo: 'erro',
          mensagem: 'Nenhum lead válido encontrado na planilha',
        });
        setCarregando(false);
        adicionarLog('erro', 'Corrija os erros na planilha e tente novamente');
        return;
      }

      const tempoEstimado = Math.ceil(resultado.validos * 0.5);

      const confirmar = window.confirm(
        `📊 Encontrados ${resultado.validos} leads válidos.\n` +
          (resultado.invalidos > 0
            ? `⚠️ ${resultado.invalidos} leads com erros serão ignorados.\n\n`
            : '/n'),
        `⏱️ Tempo estimado: ~${tempoEstimado} minuto(s)\n\n` +
          `Continuar com o cadastro?`,
      );

      if (!confirmar) {
        setStatus({
          tipo: 'info',
          mensagem: '❌ Cadastro cancelado pelo usuário',
        });
        setCarregando(false);
        adicionarLog('info', '❌ Cadastro cancelado pelo usuário');
        return;
      }

      adicionarLog(
        'info',
        `🚀 Enviando ${resultado.validos} leads para processamento...`,
      );

      setStatus({
        tipo: 'carregando',
        mensagem: `Processando ${resultado.validos} leads...`,
      });

      chrome.runtime.sendMessage({
        acao: 'processar-leads-planilha',
        leads: resultado.leads,
        marca: marcaSelecionada,
      });

      adicionarLog(
        'sucesso',
        '✅ Processamento iniciado! Acompanhe o progresso abaixo.',
      );
    } catch (erro) {
      console.error('❌ Erro ao processar planilha:', erro);
      setStatus({ tipo: 'erro', mensagem: `Erro: ${erro.message}` });
      adicionarLog('erro', `❌ ${erro.message}`);
      setCarregando(false);
    }
  };

  useEffect(() => {
    const listener = (requisicao) => {
      if (requisicao.acao === 'atualizar-progresso') {
        const { progresso } = requisicao;

        setStatus({
          tipo: 'carregando',
          mensagem: `Processando: ${progresso.processados}/${progresso.total} (${progresso.percentual}%) - ✅ ${progresso.sucessos} OK, ❌ ${progresso.falhas} erros`,
        });

        if (progresso.processados === progresso.total) {
          setStatus({
            tipo: progresso.falhas === 0 ? 'sucesso' : 'alerta',
            mensagem: `✅ Concluído! ${progresso.sucessos} sucessos, ${progresso.falhas} falhas`,
          });
          setCarregando(false);
        }
      }
    };

    chrome.runtime.onMessage.addListener(listener);

    return () => {
      chrome.runtime.onMessage.removeListener(listener);
    };
  }, [[setStatus, setCarregando]]);

  return (
    <>
      <div className="secao-upload">
        <label htmlFor="carregarArquivo" className="botao-carregar-arquivo">
          {textoUpload || '📄 Selecionar Arquivo'}
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
      <button
        onClick={rodarCadastrarLeads}
        disabled={carregando}
        className="botao-primario"
      >
        {carregando ? '⏳ Processando...' : '📤 Cadastrar Leads'}
      </button>
    </>
  );
};

export default CadastrarLead;
