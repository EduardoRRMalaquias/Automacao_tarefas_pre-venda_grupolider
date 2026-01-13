import { enviarTamplate } from '../tarefasGenericas/enviarTemplate.js';
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
      await salvarStatusTentativa(2, logs);

      const configTamplate = configMarca.tamplates.segundoContato;

      const resultadoEnvioTamplate = await enviarTamplate.executar(
        configMarca.pasta,
        configTamplate,
        undefined,
        undefined,
        undefined,
        logs,
      );

      const { mensagem } = resultadoEnvioTamplate;
      const { tipo, assunto } = configTamplate.registroTarefa;

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
