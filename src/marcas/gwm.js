'use strict';
import { gerenciadorMarcas } from './gerenciadorMarcas.js';
import {
  log,
  ativarModoEdicao,
  salvarDesativarModoEdicao,
  formatarNome,
  formatarNumeroTelefone,
  preencherInputsInteresses,
  formatarModeloInteresse,
  enviarTamplateWhatsapp,
  registrarTarefa,
} from '../ultilitarios/utilitarios.js';

const primeiroContatoGWM = {
  nome: 'Primeiro Contato GWM',
  descrição:
    'Formata lead, envia templatede mensagem pelo beetalk e cria tarefa',

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

      await salvarDesativarModoEdicao(logs);

      const mensagem = await enviarTamplateWhatsapp(
        primeiroNome,
        modelo,
        operador,
        logs,
      );

      await registrarTarefa(mensagem, logs);

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

gerenciadorMarcas.cadastrarMarca('gwm', {
  nome: 'GWM',
  descricao: 'Great Wall Motors',
  tarefas: {
    'primeiro-contato': primeiroContatoGWM,
  },
});

console.log('Marca GWM registrada com sucesso');
