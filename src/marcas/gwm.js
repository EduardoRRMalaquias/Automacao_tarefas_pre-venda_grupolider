import { gerenciadorMarcas } from "./gerenciadorMarcas";
import { tratarLead } from "../tarefasGenericas/tratarLead";
import { primeiroContato } from "../tarefasDiarias/primeiroContato";
import { segundoContato } from "../tarefasDiarias/segundoContato";

const configuracaoGWM = {
  marca: "GWM",
  categoria: "Novos",

  pasta: "GW LIDER TEMPLATE",

  tamplates: {
    primeiroContatoModelo: {
      nome: "SAUDACAO GW 2",
      id: "a0EU6000003BVunMAG",
      campos: [
        { id: 1, valor: "nome" },
        { id: 2, valor: "operador" },
        { id: 3, valor: "modelo" },
      ],
    },

    primeiroContatosemModelo: {
      nome: "PRIMEIRO CONTATO GW 2",
      id: "a0EU6000003BVy1MAG",
      campos: [
        { id: 1, valor: "nome" },
        { id: 2, valor: "saudacao" },
        { id: 3, valor: "operador" },
      ],
    },

    segundoContato: {
      nome: "'SEGUNDA TENTAT",
      id: "a0EU6000002sFwzMAE",
    },
  },
};

gerenciadorMarcas.cadastrarMarca("gwm", {
  nome: "GWM",
  descricao: "Great Wall Motors",
  config: configuracaoGWM,

  tarefas: {
    "tratar-leads": {
      ...tratarLead,
      executar: (contexto) =>
        tratarLead.executar({
          ...contexto,
          configMarca: configuracaoGWM,
        }),
    },

    "primeiro-contato": {
      ...primeiroContato,
      executar: (contexto) =>
        primeiroContato.executar({
          ...contexto,
          configMarca: configuracaoGWM,
        }),
    },
  },
});

console.log("✅ Marca GWM registrada com sucesso");
