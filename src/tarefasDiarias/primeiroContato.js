import { tratarLead } from '../tarefasGenericas/tratarLead.js';
import { enviarTemplate } from '../tarefasGenericas/enviarTemplate.js';
import {
  getOperador,
  log,
  registrarTarefa,
} from '../ultilitarios/utilitarios.js';

export const primeiroContato = {
  nome: 'Primeiro Contato',

  async executar({ configMarca }) {
    const logs = [];

    logs.push(log('info', `Iniciando Primeiro Contato - ${configMarca.marca}`));

    try {
      const operador = await getOperador();

      const resultadoTratamentoLeads = await tratarLead.executar(
        configMarca,
        logs,
      );
      const { nomeFormatado, modelo } = resultadoTratamentoLeads.dadosLeads;

      //Resolver configuração template
      const { primeiroContatoModelo, primeiroContatoSemModelo } =
        configMarca.templates;

      let configtemplate;
      if (modelo) {
        configtemplate = primeiroContatoModelo;
      } else {
        configtemplate = primeiroContatoSemModelo;
      }

      const resultadoEnviotemplate = await enviarTemplate.executar(
        configMarca.pasta,
        configtemplate,
        nomeFormatado,
        modelo,
        operador,
        logs,
      );

      const { mensagem } = resultadoEnviotemplate;
      const { tipo, assunto } = configtemplate.registroTarefa;

      await registrarTarefa(mensagem, tipo, assunto, logs);

      logs.push(log('sucesso', 'Primeiro Contato concluído!'));

      return {
        sucesso: true,
        logs,
      };
    } catch (erro) {
      logs.push(log('erro', `Erro no Primeiro Contato: ${erro.message}`));
      return {
        sucesso: false,
        erro: erro.message,
        logs,
      };
    }
  },
};
