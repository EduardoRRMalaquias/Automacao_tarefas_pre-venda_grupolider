import { tratarLead } from '../tarefasGenericas/tratarLead';
import { capturarMensagems } from '../tarefasGenericas/enviarTemplate';
import {
  esperar,
  getOperador,
  log,
  registrarTarefa,
  salvarStatusTentativa,
} from '../ultilitarios/utilitarios';

export const encaminharLead = {
  nome: 'Encaminhar Lead',

  async executar({ configMarca }, tipoEncaminhamento) {
    const logs = [];

    logs.push(
      log('info', `Iniciando Encaminhamento - Tipo: ${tipoEncaminhamento}`),
    );

    try {
      const operador = await getOperador();

      const configTentativa =
        determinarTentativaEncaminhamento(tipoEncaminhamento);

      if (!configTentativa) {
        await salvarStatusTentativa(configTentativa, logs);
      }

      const resultadoTratamento = await tratarLead.executar(
        {
          ...configMarca,
          classificacao: 'Hot',
        },
        logs,
      );

      const { nomeFormatado, numeroTelefone, modelo } =
        resultadoTratamento.dadosLeads;

      const { menssagemTextoPadrao, assuntoTextoPadrao } =
        await montarTextoPadraotarefa(configMarca, tipoEncaminhamento);

      await registrarTarefa(
        menssagemTextoPadrao,
        'Contato',
        assuntoTextoPadrao,
        logs,
      );

      await esperar(800);

      const { menssagemMascaraTarefa, assuntoMascaraTarefa } =
        montarMascaraTarefa(
          configMarca,
          {
            nomeFormatado,
            numeroTelefone,
            modelo,
          },
          tipoEncaminhamento,
        );

      console.log(menssagemMascaraTarefa, assuntoMascaraTarefa);
      await esperar(800);

      await registrarTarefa(
        menssagemMascaraTarefa,
        'Agendamento',
        assuntoMascaraTarefa,
        logs,
      );

      logs.push(
        log('sucesso', 'Lead pronto para ser encaminhado com sucesso!'),
      );

      return {
        sucesso: true,
        logs,
      };
    } catch (erro) {
      logs.push(
        log('erro', `Erro ao preparar encaminhamento do lead: ${erro.message}`),
      );
      return {
        sucesso: false,
        erro: erro.message,
        logs,
      };
    }
  },
};

function determinarTentativaEncaminhamento(tipoEncaminhamento) {
  const tipoContato = tipoEncaminhamento === 'contato' ? 'Whatsapp' : 'Ligação';

  return {
    numeroTentaiva: 1,
    concluido: true,
    tipoContato,
  };
}

async function montarTextoPadraotarefa(configMarca, tipoEncaminhamento) {
  const { mensagens } = await capturarMensagems();
  console.log(mensagens);

  if (tipoEncaminhamento === 'contato' && mensagens.length > 0) {
    let menssagemTextoPadrao = '';

    mensagens.forEach(({ texto }) => {
      menssagemTextoPadrao += texto + '\n\n';
    });

    return { menssagemTextoPadrao, assuntoTextoPadrao: 'Conversa Digisac' };
  } else if (tipoEncaminhamento === 'direto') {
    return {
      menssagemTextoPadrao: configMarca.encaminhamento.direto,
      assuntoTextoPadrao: 'Primeiro Contato',
    };
  } else {
    return {
      menssagemTextoPadrao: configMarca.encaminhamento.portal.mensagem,
      assuntoTextoPadrao: configMarca.encaminhamento.portal.assuntoPadrao,
    };
  }
}

function montarMascaraTarefa(configMarca, dadosLead, tipoEncaminhamento) {
  const { nomeFormatado, numeroTelefone, modelo } = dadosLead;

  const formaContato =
    tipoEncaminhamento === 'contato' ? 'WHATSAPP' : 'PORTAL/DIRETO';

  const assuntoMascaraTarefa =
    tipoEncaminhamento === 'portal'
      ? configMarca.encaminhamento.portal.assuntoEncaminhamento ||
        'Encaminhado p/ Consultor'
      : 'Encaminhado p/ Consultor';
  const menssagemMascaraTarefa =
    `CLIENTE: ${nomeFormatado}\n` +
    `CONTATO: ${numeroTelefone}\n` +
    `VEÍCULO DE INTERESSE: ${modelo || 'NÃO INFORMADO'}\n` +
    `FORMA DE CONTATO: ${formaContato}\n` +
    `OBS: CLIENTE DESEJA SABER MAIS INFORMAÇÕES DE VALORES E CONDIÇÕES DO ${
      modelo || 'VEÍCULO\n'
    }` +
    `Favor realizar tentativa de contato com o cliente.`;

  return { menssagemMascaraTarefa, assuntoMascaraTarefa };
}
