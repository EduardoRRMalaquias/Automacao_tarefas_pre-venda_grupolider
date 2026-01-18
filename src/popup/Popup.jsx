// src/popup/App.jsx
import React, { useState, useEffect } from 'react';
import PainelAcoes from './componentes/PainelAcoes';

function Popup() {
  const [configuracao, setConfiguracao] = useState({
    operador: '',
    marcaSelecionada: 'gwm',
    tarefaSelecionada: 'primeiro-contato',
    ultimosLogs: [],
  });
  const [status, setStatus] = useState({ tipo: '', mensagem: '' });
  const [carregando, setCarregando] = useState(false);

  // Carrega configurações salvas
  useEffect(() => {
    chrome.storage.local.get(
      [
        'operador',
        'marcaSelecionada',
        'tarefaSelecionada',
        'marcaSelecionada',
        'ultimosLogs',
      ],
      (configuracoes) => {
        setConfiguracao((configuracao) => ({
          ...configuracao,
          operador: configuracoes.operador,
          marcaSelecionada: configuracoes.marcaSelecionada || 'gwm',
          tarefaSelecionada:
            configuracoes.tarefaSelecionada || 'primeiro-contato',
          ultimosLogs: configuracoes.ultimosLogs || [],
        }));
      },
    );
  }, []);

  //Recebe logs do background em tempo real
  useEffect(() => {
    const recebedorLogs = (requisicao, remetente, enviarResposta) => {
      if (requisicao.acao === 'logs-automacao') {
        adicionarLog(requisicao.tipo, requisicao.mensagem);
        enviarResposta({ recebido: true });
      }
      return false;
    };

    chrome.runtime.onMessage.addListener(recebedorLogs);
    console.log('Listener de logs ativo');

    return () => {
      chrome.runtime.onMessage.removeListener(recebedorLogs);
    };
  }, []);

  const salvarOperator = () => {
    const { operador } = configuracao;

    if (!operador.trim()) {
      setStatus({ tipo: 'erro', mensagem: 'Digite um nome válido' });
      return;
    }

    chrome.storage.local.set({ operador: operador }, () => {
      setStatus({ tipo: 'sucesso', mensagem: 'Nome salvo com sucesso!' });
      setTimeout(() => setStatus({ tipo: '', mensagem: '' }), 2000);
    });
  };

  const mudarMarca = (e) => {
    const marca = e.target.value;
    setConfiguracao((configuracao) => ({
      ...configuracao,
      marcaSelecionada: marca,
    }));
    chrome.storage.local.set({ marcaSelecionada: marca });
  };

  const mudarTarefa = (e) => {
    const tarefa = e.target.value;
    setConfiguracao((configuracao) => ({
      ...configuracao,
      tarefaSelecionada: tarefa,
    }));
    chrome.storage.local.set({ tarefaSelecionada: tarefa });
  };

  const adicionarLog = (tipo, mensagem) => {
    setConfiguracao((configuracao) => ({
      ...configuracao,
      ultimosLogs: [
        ...configuracao.ultimosLogs,
        { tipo, mensagem, timestamp: new Date().toLocaleTimeString() },
      ],
    }));
  };

  const limparLogs = () => {
    setConfiguracao((configuracao) => ({ ...configuracao, ultimosLogs: [] }));
  };

  return (
    <>
      <div className="container">
        <header>
          <img src="../icons/logo-48.png" alt="" />
          <div>
            <h1>Automatização de tarefas grupolíder</h1>
            <p>Criado por Eduardo R. R. Malaquias</p>
          </div>
        </header>

        <main>
          <section>
            <article className="config-section">
              <label htmlFor="operador">👤 Nome do Operador:</label>
              <input
                type="text"
                id="operador"
                value={configuracao.operador}
                onChange={(e) =>
                  setConfiguracao({ ...configuracao, operador: e.target.value })
                }
                placeholder="Digite seu nome"
                maxLength="50"
              />
              <button
                onClick={salvarOperator}
                id="savarOperador"
                className="botao-secondario"
              >
                Salvar Nome
              </button>
            </article>

            <article className="secao-marca">
              <label htmlFor="marca">🚗 Marca:</label>
              <select
                id="marca"
                value={configuracao.marcaSelecionada}
                onChange={mudarMarca}
              >
                <option value="gwm">GWM</option>
              </select>
            </article>

            <article className="secao-tarefa">
              <label htmlFor="tarefa">📋 Tarefa:</label>
              <select
                id="tarefa"
                value={configuracao.tarefaSelecionada}
                onChange={mudarTarefa}
              >
                <option value="tratar-lead">Tratar Lead</option>
                <option value="primeiro-contato">Primeiro Contato</option>
                <option value="segundo-contato">Segundo Contato</option>
                <option value="cadastrar-leads">cadastrar Leads</option>
                <option value="encaminhar-lead">Encaminhar Lead</option>
                <option value="ligacoes">Ligações</option>
              </select>
            </article>
          </section>

          <section>
            <article className="secao-status">
              {status.mensagem && (
                <div className={`status ${status.tipo}`}>
                  <span className="icone-status">
                    {status.tipo === 'sucesso'
                      ? '✅'
                      : status.tipo === 'erro'
                      ? '❌'
                      : '⏳'}
                  </span>
                  <span className="texto-status">{status.mensagem}</span>
                </div>
              )}
            </article>

            <PainelAcoes
              configuracao={configuracao}
              setConfiguracao={setConfiguracao}
              setStatus={setStatus}
              carregando={carregando}
              setCarregando={setCarregando}
              adicionarLog={adicionarLog}
              limparLogs={limparLogs}
            />
          </section>
        </main>

        <section className="secao-logs">
          <div className="logs-header">
            <h3>📊 Logs da Execução</h3>
            {configuracao.ultimosLogs.length > 0 && (
              <button onClick={limparLogs} className="botao-limpar-logs">
                🗑️ Limpar
              </button>
            )}
          </div>
          <div id="logs" className="logs">
            {configuracao.ultimosLogs?.length > 0
              ? configuracao.ultimosLogs.map((log, index) => (
                  <div key={index} className={`entrada-log ${log.tipo}`}>
                    <span className="log-time">[{log.timestamp}]</span>
                    <span className="log-message">{log.mensagem}</span>
                  </div>
                ))
              : 'Nenhum log ainda...'}
          </div>
        </section>
      </div>

      <footer>
        <p>Desenvolvido por - Eduardo Rodrigues Rangel Malaquuias</p>
        <p>© - GrupoLider 2025</p>
      </footer>
    </>
  );
}

export default Popup;
