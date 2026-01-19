import React, { useState } from 'react';
import BotaoRodarAutomacao from './BotaoRodarAutomacao';
import BotaoRodarTodasAbas from './BotaoRodarTodasAbas';
import SeletorTipoEncaminhamento from './SeletorTipoEncaminhamento';
import CadastrarLead from './CadastrarLead';

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
  const [tipoEncaminhamento, setTipoEncaminhamento] = useState('portal');

  const { tarefaSelecionada } = configuracao;

  const acoesConfig = {
    'tratar-lead': {
      mostrarBotaoUnico: true,
      mostrarBotaoTodas: true,
      textoBotaoUnico: '📋 Tratar Lead',
      textoBotaoTodas: '📋 Tratar Leads abertos',
    },
    'primeiro-contato': {
      mostrarBotaoUnico: true,
      mostrarBotaoTodas: true,
      textoBotaoUnico: '▶️ Executar Primeiro Contato',
    },
    'segundo-contato': {
      mostrarBotaoUnico: true,
      mostrarBotaoTodas: true,
      textoBotaoUnico: '▶️ Executar Segundo Contato',
    },
    'encaminhar-leads': {
      mostrarBotaoUnico: true,
      mostrarBotaoTodas: true,
      mostrarTipoEncaminhamento: true, // ✅ NOVO
      textoBotaoUnico: '📤 Encaminhar Lead',
      textoBotaoTodas: '📤 Encaminhar Leads abertos',
    },
    'cadastrar-leads': {
      cadastrarLeads: true,
    },
    ligacoes: {
      mostrarBotaoTodas: true,
      textoBotaoTodas: '📞 Processar Ligações',
    },
  };

  const config =
    acoesConfig[tarefaSelecionada] || acoesConfig['primeiro-contato'];

  return (
    <article className="acoes">
      {config.mostrarTipoEncaminhamento && (
        <SeletorTipoEncaminhamento
          tipoEncaminhamento={tipoEncaminhamento}
          setTipoEncaminhamento={setTipoEncaminhamento}
        />
      )}

      {config.cadastrarLeads && (
        <CadastrarLead
          setStatus={setStatus}
          arquivo={arquivo}
          setArquivo={setArquivo}
          textoUpload={config.textoUpload}
          adicionarLog={adicionarLog}
        />
      )}

      {config.mostrarBotaoUnico && (
        <BotaoRodarAutomacao
          configuracao={configuracao}
          setConfiguracao={setConfiguracao}
          setStatus={setStatus}
          carregando={carregando}
          setCarregando={setCarregando}
          adicionarLog={adicionarLog}
          limparLogs={limparLogs}
          tipoEncaminhamento={tipoEncaminhamento} // ✅ PASSA TIPO
          textoBotao={config.textoBotaoUnico}
        />
      )}

      {config.mostrarBotaoTodas && (
        <BotaoRodarTodasAbas
          configuracao={configuracao}
          setStatus={setStatus}
          carregando={carregando}
          setCarregando={setCarregando}
          adicionarLog={adicionarLog}
          limparLogs={limparLogs}
          tipoEncaminhamento={tipoEncaminhamento} // ✅ PASSA TIPO
          textoBotao={config.textoBotaoTodas}
        />
      )}
    </article>
  );
};

export default PainelAcoes;
