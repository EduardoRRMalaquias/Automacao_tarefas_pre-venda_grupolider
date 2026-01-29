import { enviarTemplate } from '../tarefasGenericas/enviarTemplate.js';
import {
  log,
  salvarStatusTentativa,
  registrarTarefa,
} from '../ultilitarios/utilitarios.js';

export const segundoContato = {
  nome: 'Segundo Contato',

  async executar({ configMarca }) {
    const logs = [];

    logs.push(log('info', `Iniciando Segundo Contato - ${configMarca.marca}`));

    try {
      try {
        await salvarStatusTentativa(
          {
            numeroTentativa: 1,
            concluido: false,
          },
          logs,
        );
      } catch {}

      const configtemplate = configMarca.templates.segundoContato;

      const resultadoEnviotemplate = await enviarTemplate.executar(
        configMarca.pasta,
        configtemplate,
        undefined,
        undefined,
        undefined,
        logs,
      );

      const { mensagem } = resultadoEnviotemplate;
      const { tipo, assunto } = configtemplate.registroTarefa;

      await registrarTarefa(mensagem, tipo, assunto, logs);

      logs.push(log('sucesso', 'Segundo Contato concluído!'));

      return {
        sucesso: true,
        logs,
      };
    } catch (erro) {
      logs.push(log('erro', `Erro no Segundo Contato: ${erro.message}`));
      return {
        sucesso: false,
        erro: erro.message,
        logs,
      };
    }
  },
};
