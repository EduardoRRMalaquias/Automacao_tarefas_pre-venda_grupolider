import { gerenciadorMarcas } from './gerenciadorMarcas';
import { tratarLead } from '../tarefasGenericas/tratarLead';
import { primeiroContato } from '../tarefasDiarias/primeiroContato';
import { segundoContato } from '../tarefasDiarias/segundoContato';
import { encaminharLead } from '../tarefasDiarias/encaminharLead';

const configuracaoGWM = {
  marca: 'GWM',
  categoria: 'Novos',

  pasta: 'GW LIDER TEMPLATE',

  templates: {
    primeiroContatoModelo: {
      nometemplate: 'SAUDACAO GW 2',
      idtemplate: 'a0EU6000003BVunMAG',
      campos: [
        { id: 1, valor: 'nome' },
        { id: 2, valor: 'operador' },
        { id: 3, valor: 'modelo' },
      ],
      registroTarefa: {
        tipo: 'Contato',
        assunto: 'Primeiro Contato',
      },
    },

    primeiroContatoSemModelo: {
      nometemplate: 'PRIMEIRO CONTATO GW 2',
      idtemplate: 'a0EU6000003BVy1MAG',
      campos: [
        { id: 1, valor: 'nome' },
        { id: 2, valor: 'saudacao' },
        { id: 3, valor: 'operador' },
      ],
      registroTarefa: {
        tipo: 'Contato',
        assunto: 'Primeiro Contato',
      },
    },

    segundoContato: {
      nometemplate: 'SEGUNDA TENTAT',
      idtemplate: 'a0EU6000002sFwzMAE',
      registroTarefa: {
        tipo: 'Contato',
        assunto: 'Enviado Nova Mensagem',
      },
    },
  },

  encaminhamento: {
    direto:
      'Oportunidade de OLX/Webmotors/DigitalDrive encaminhada direto conforme autorizado por Melissa. Favor dar seguimento.',
    portal: {
      mensagem: 'Cliente identificado no GDMC',
      assuntoPadrao: 'PORTAL GDMC',
    },
  },
};

gerenciadorMarcas.cadastrarMarca('gwm', {
  nome: 'GWM',
  descricao: 'Great Wall Motors',
  config: configuracaoGWM,

  tarefas: {
    'tratar-lead': {
      ...tratarLead,
      executar: () => tratarLead.executar(configuracaoGWM),
    },

    'primeiro-contato': {
      ...primeiroContato,
      executar: (contexto) =>
        primeiroContato.executar({
          ...contexto,
          configMarca: configuracaoGWM,
        }),
    },

    'segundo-contato': {
      ...segundoContato,
      executar: (contexto) =>
        segundoContato.executar({
          ...contexto,
          configMarca: configuracaoGWM,
        }),
    },

    'encaminhar-lead': {
      ...encaminharLead,
      executar: (contexto) => {
        const { tipoEncaminhamento } = contexto;

        console.log(`Encaminhando lead - Tipo: ${tipoEncaminhamento}`);

        return encaminharLead.executar({
          ...contexto,
          configMarca: configuracaoGWM,
          tipoEncaminhamento, // ✅ Passa explicitamente
        });
      },
    },
  },
});

console.log('✅ Marca GWM registrada com sucesso');
