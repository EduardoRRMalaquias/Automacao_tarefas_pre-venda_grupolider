(function () {
  'use strict';
  console.log('🚀 automação de Leads GrupoLider - Content Script Carregado');

  //Verifica se esta em uma pagina de lead
  function isPaginaLead() {
    return window.location.href.includes(
      'lightning.force.com/lightning/r/Lead/',
    );
  }

  //recebe mensagens enviadas do popup
  chrome.runtime.onMessage.addListener(
    (requisicao, remetente, enviarResposta) => {
      console.log('📨 Mensagem recebida:', requisicao);

      if (requisicao.acao === 'ping') {
        enviarResposta({ pong: true });
        return false;
      }

      if (requisicao.acao === 'rodar-automacao') {
        rodarAutomacao(requisicao)
          .then((resposta) => {
            console.log('✅ Automação finalizada:', resposta);
            enviarResposta(resposta);
          })
          .catch((erro) => {
            enviarResposta({
              sucesso: false,
              erro: erro.message,
              logs: [
                {
                  tipo: 'erro',
                  menssagem: erro.message,
                },
              ],
            });
          });

        return true;
      }

      if (requisicao.acao === 'checar-pagina') {
        enviarResposta({
          isPaginaLead: isPaginaLead(),
          url: window.location.href,
        });
        return false;
      }

      enviarResposta({ erro: 'Ação desconhecida' });
      return false;
    },
  );

  //Processar automação
  async function rodarAutomacao(requisicao) {
    const { marca, tarefa } = requisicao;

    //Validações
    if (!isPaginaLead()) {
      return {
        sucesso: false,
        erro: 'Não está em uma página de Lead',
        logs: [
          {
            type: 'erro',
            message: 'Esta página não é uma página de Lead válida',
          },
        ],
      };
    }

    if (!window.gerenciadorMarcas) {
      return {
        sucesso: false,
        erro: 'gerenciadorMarcas não inicializado',
        logs: [
          {
            type: 'erro',
            message: 'Gerenciador de marcas não está disponível',
          },
        ],
      };
    }

    //Verifica se a marca existe
    const configuracaoMarca = window.gerenciadorMarcas.getMarca(marca);
    if (!configuracaoMarca) {
      return {
        sucesso: false,
        erro: `Marca "${marca}" não encontrada`,
        logs: [
          {
            type: 'erro',
            message: `Marca ${marca} não está registrada no sistema`,
          },
        ],
      };
    }

    //Verifica se a marca existe
    const configuracaoTarefa = window.gerenciadorMarcas.getTarefa(
      marca,
      tarefa,
    );
    if (!configuracaoTarefa) {
      return {
        sucesso: false,
        erro: `tarefa "${tarefa}" não encontrada para a marca ${marca}`,
        logs: [
          {
            type: 'erro',
            message: `Tarefa ${tarefa} não disponível para ${marca}`,
          },
        ],
      };
    }

    // Executa a tarefa
    console.log(`🎯 Executando tarefa ${tarefa} da marca ${marca}`);

    try {
      const resposta = await window.gerenciadorMarcas.executarTarefa(
        marca,
        tarefa,
        {
          url: window.location.href,
          dataHora: new Date().toLocaleDateString('pt-BR'),
        },
      );

      return {
        sucesso: resposta.sucesso,
        logs: resposta.resposta?.logs || [],
        erro: resposta.erro,
      };
    } catch (erro) {
      console.error('❌ Erro ao executar tarefa:', erro);
      return {
        sucesso: false,
        erro: erro.menssage,
        logs: [
          {
            type: 'erro',
            message: `Erro fatal: ${erro.message}`,
          },
        ],
      };
    }
  }

  // Aguarda gerenciadorMarcas estar disponível
  let tentativas = 0;
  const maximoTentativas = 50;

  const aguardarGerenciador = setInterval(() => {
    tentativas++;

    if (window.gerenciadorMarcas) {
      clearInterval(aguardarGerenciador);
      console.log('✅ gerenciadorMarcas detectado e pronto');

      // Sinalizar que o content script está pronto
      try {
        const reposta = chrome.runtime.sendMessage({
          acao: 'content-script-pronto',
          url: window.location.href,
        });
      } catch (erro) {}
    }

    if (tentativas >= maximoTentativas) {
      clearInterval(aguardarGerenciador);
      console.error('❌ gerenciadorMarcas não foi carregado após 5 segundos');
    }
  }, 100);

  console.log('✅ Content Script inicializado e aguardando comandos');
})();
