import { seletores } from '../ultilitarios/seletores';
import {
  log,
  esperar,
  esperarElemento,
  clicarElemento,
  ativarEventosElementos,
} from '../ultilitarios/utilitarios';

export const enviarTamplate = {
  nome: 'Enviar Tamplate Whatsapp',

  async executar(tamplateComfig, dadosLeads, operador, logs) {
    logs.push(log('info', 'Enviando template WhatsApp...'));

    try {
      await abrirModalTamplate(logs);

      await selecionarPastaTamplate(tamplateComfig.pasta, logs);

      await selecionarTamplate(tamplateComfig.idTamplate, logs);

      if (tamplateComfig.campos && tamplateComfig.campos > 0) {
        await preencherCamposTamplate(
          tamplateComfig.campos,
          dadosLeads,
          operador,
          logs,
        );
      }

      await enviarMenssagemTamplate(logs);

      const mensagem = await capturarMenssagem(logs);

      logs.push(
        log(
          'sucesso',
          'Template de menssagem enviado e capturado com sucesso!',
        ),
      );

      return {
        sucesso: true,
        mensagem,
      };
    } catch (erro) {
      logs.push(log('erro', `Erro ao enviar tamplate: ${erro.message} `));
      throw erro;
    }
  },
};


async abrirModalTamplate(logs){

}
