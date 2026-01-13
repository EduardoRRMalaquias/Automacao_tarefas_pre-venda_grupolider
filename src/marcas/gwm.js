import { gerenciadorMarcas } from './gerenciadorMarcas';
import { tratarLead } from '../tarefasGenericas/tratarLead';
import { primeiroContato } from '../tarefasDiarias/primeiroContato';

const configuracaoGWM = {
  marca: 'GWM',
  categoria: 'Novos',

  pasta: 'GW LIDER TEMPLATE',

  tamplates: {
    primeiroContatoModelo: {
      nomeTamplate: 'SAUDACAO GW 2',
      idTamplate: 'a0EU6000003BVunMAG',
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
      nomeTamplate: 'PRIMEIRO CONTATO GW 2',
      idTamplate: 'a0EU6000003BVy1MAG',
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
      nomeTamplate: 'SEGUNDA TENTAT',
      idTamplate: 'a0EU6000002sFwzMAE',
      registroTarefa: {
        tipo: 'Contato',
        assunto: 'Enviado Nova Mensagem',
      },
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
  },
});

console.log('✅ Marca GWM registrada com sucesso');
