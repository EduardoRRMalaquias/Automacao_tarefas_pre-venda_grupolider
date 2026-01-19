import React from 'react';

const CadastrarLead = ({
  setStatus,
  arquivo,
  setArquivo,
  textoUpload,
  adicionarLog,
}) => {
  const carregarArquivo = (e) => {
    const arquivo = e.target.files[0];
    if (arquivo) {
      setArquivo(arquivo);
      adicionarLog('info', `Arquivo selecionado: ${arquivo.name}`);
    }
  };

  const rodarCadastrarLeads = async () => {
    if (!arquivo) {
      setStatus({
        tipo: 'erro',
        mensagem: 'Selecione uma planilha primeiro',
      });
      return;
    }

    try {
      setStatus({ tipo: 'carregando', mensagem: 'Processando planilha...' });
      setCarregando(true);
      limparLogs();

      adicionarLog('info', `📄 Lendo arquivo: ${arquivo.name}`);

      // ────────────────────────────────────────────────
      // ETAPA 1: Parse planilha
      // ────────────────────────────────────────────────

      // POR QUE NO POPUP?
      // - FileReader só funciona onde arquivo foi selecionado
      // - Background não tem acesso ao File object
      // - Parse é rápido (< 1 segundo)
      const resultado = await PlanilhaParser.parse(arquivo);

      adicionarLog('info', `📊 Total de linhas: ${resultado.total}`);
      adicionarLog('sucesso', `✅ Leads válidos: ${resultado.validos}`);

      // Mostra erros se houver
      if (resultado.invalidos > 0) {
        adicionarLog('alerta', `⚠️ Leads inválidos: ${resultado.invalidos}`);

        // Lista primeiros 5 erros (para não poluir UI)
        const errosExibir = resultado.erros.slice(0, 5);
        errosExibir.forEach((erro) => {
          const mensagemErro = erro.erros ? erro.erros.join(', ') : erro.erro;
          adicionarLog('erro', `Linha ${erro.linha}: ${mensagemErro}`);
        });

        if (resultado.invalidos > 5) {
          adicionarLog('info', `... e mais ${resultado.invalidos - 5} erros`);
        }
      }

      // Validação: precisa ter pelo menos 1 lead válido
      if (resultado.validos === 0) {
        setStatus({
          tipo: 'erro',
          mensagem: 'Nenhum lead válido encontrado na planilha',
        });
        setCarregando(false);
        return;
      }

      // ────────────────────────────────────────────────
      // ETAPA 2: Confirmação do usuário
      // ────────────────────────────────────────────────

      // POR QUE CONFIRMAR?
      // - Processo é longo (pode levar 10+ minutos)
      // - Usuário vê quantos leads serão processados
      // - Pode cancelar se identificar problema
      const confirmar = window.confirm(
        `Encontrados ${resultado.validos} leads válidos.\n` +
          (resultado.invalidos > 0
            ? `${resultado.invalidos} leads com erros serão ignorados.\n\n`
            : '\n') +
          `Tempo estimado: ~${Math.ceil(resultado.validos * 0.5)} minutos\n\n` +
          `Continuar com o cadastro?`,
      );

      if (!confirmar) {
        setStatus({ tipo: '', mensagem: '' });
        setCarregando(false);
        adicionarLog('info', 'Cadastro cancelado pelo usuário');
        return;
      }

      // ────────────────────────────────────────────────
      // ETAPA 3: Enviar para background processar
      // ────────────────────────────────────────────────

      adicionarLog(
        'info',
        `🚀 Enviando ${resultado.validos} leads para processamento...`,
      );

      setStatus({
        tipo: 'carregando',
        mensagem: `Processando ${resultado.validos} leads...`,
      });

      // POR QUE NÃO USAR AWAIT?
      // - Processo é longo (10+ minutos para 50 leads)
      // - chrome.runtime.sendMessage tem timeout de ~30s
      // - Não conseguimos aguardar resposta completa
      // - Receberemos atualizações via 'atualizar-progresso'
      chrome.runtime.sendMessage({
        acao: 'processar-leads-planilha',
        leads: resultado.leads,
        marca: marcaSelecionada,
      });

      adicionarLog(
        'sucesso',
        '✅ Processamento iniciado! Acompanhe o progresso abaixo.',
      );

      // NÃO seta carregando=false aqui
      // Será desativado quando receber último 'atualizar-progresso'
    } catch (erro) {
      console.error('Erro ao processar planilha:', erro);
      setStatus({ tipo: 'erro', mensagem: `Erro: ${erro.message}` });
      adicionarLog('erro', `❌ ${erro.message}`);
      setCarregando(false);
    }
  };

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
      <div></div>
    </>
  );
};

export default CadastrarLead;
