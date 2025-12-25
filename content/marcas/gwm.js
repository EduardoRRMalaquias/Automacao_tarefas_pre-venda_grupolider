(() => {
  'use strict';

  //Utilitarios
  const log = window.utilitarios.log;

  // funçoes de Manipulação da pagina
  const ativarModoEdicao = window.utilitarios.ativarModoEdicao;
  const savlarDesativarModoEdicao =
    window.utilitarios.savlarDesativarModoEdicao;
  const formatarNome = window.utilitarios.formatarNome;
  const formatarNumeroTelefone = window.utilitarios.formatarNumeroTelefone;
  const preencherInputsInteresses =
    window.utilitarios.preencherInputsInteresses;
  const formatarModeloInteresse = window.utilitarios.formatarModeloInteresse;
  const enviarTamplateWhatsapp = window.utilitarios.enviarTamplateWhatsapp;
  const registrarTarefa = window.utilitarios.registrarTarefa;

  const primeiroContatoGWM = {
    nome: 'Primeiro Contato GWM',
    descrição:
      'Formata lead, envia templatede menssagem pelo beetalk e cria tarefa',

    executar: async (contexto) => {
      const logs = [];

      logs.push(log('info', 'Iniciando automacao: Primeiro Contato GWM'));

      try {
        const dadosOperador = await new Promise((resolver) => {
          chrome.storage.local.get('operador', resolver);
        });

        const operador = (dadosOperador.operador || 'Eduardo').split(' ')[0];
        logs.push(log('info', `Operador: ${operador}`));

        await ativarModoEdicao(logs);

        const nomeFormatado = await formatarNome(logs);

        const primeiroNome = nomeFormatado.primeiroNome
          ? nomeFormatado.primeiroNome
          : nomeFormatado.sobrenome;

        await formatarNumeroTelefone(logs);
        await preencherInputsInteresses(logs);

        const modelo = await formatarModeloInteresse(logs);

        await savlarDesativarModoEdicao(logs);

        const menssagem = await enviarTamplateWhatsapp(
          primeiroNome,
          modelo,
          operador,
          logs,
        );

        await registrarTarefa(menssagem, logs);

        return {
          sucesso: true,
          logs: logs,
        };
      } catch (erro) {
        logs.push(log('erro', `Falha na automacao ${erro.message}`));
        return {
          sucesso: false,
          erro: erro.message,
          logs: logs,
        };
      }
    },
  };

  // Registrar Marca GWM
  if (window.gerenciadorMarcas) {
    window.gerenciadorMarcas.cadastrarMarca('gwm', {
      nome: 'GWM',
      descricao: 'Great Wall Motors',
      tarefas: {
        'primeiro-contato': primeiroContatoGWM,
      },
    });

    console.log('Marca GWM registrada com sucesso');
  } else {
    console.error('GerenciadorMarcas não encontrado!');
  }
})();
