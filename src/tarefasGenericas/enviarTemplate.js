import { seletores } from '../ultilitarios/seletores';
import {
  log,
  esperar,
  esperarElemento,
  clicarElemento,
  ativarEventosElementos,
} from '../ultilitarios/utilitarios.js';

export const enviarTamplate = {
  nome: 'Enviar Tamplate Whatsapp',

  async executar(
    pasta,
    { nomeTamplate, idTamplate, campos },
    nomeFormatado = '',
    modelo = '',
    operador = '',
    logs,
  ) {
    logs.push(log('info', 'Enviando template WhatsApp...'));

    try {
      await abrirModalTamplate(logs);

      await selecionarPastaTamplate(pasta, logs);

      await selecionarTamplate(nomeTamplate, idTamplate, logs);

      if (campos && campos > 0) {
        await preencherCamposTamplate(
          campos,
          nomeFormatado,
          modelo,
          operador,
          logs,
        );
      }

      await enviarMensagemTamplate(logs);

      const { mensagem } = await capturarMensagem(logs);

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

const abrirModalTamplate = async (logs) => {
  let tamplatesAberto = false;

  //Botão "Enviar Tamplate"
  try {
    logs.push(log('info', 'Tentando botão central...'));
    const botaoEnviarTamplate = await esperarElemento(
      seletores.beetalk.botoes.enviarTamplate,
      3000,
    );
    await clicarElemento(botaoEnviarTamplate, 800);
    logs.push(log('sucesso', 'Botão central clicado'));
    tamplatesAberto = true;
  } catch (erroTentativa1) {
    logs.push(
      log('info', 'Botão central não encontrado, tentando alternativa...'),
    );
  }

  //botao tamplate rapido
  if (!tamplatesAberto) {
    try {
      logs.push(log('info', 'Tentando quick-messages...'));
      const tampleteRapido = await esperarElemento(
        seletores.beetalk.botoes.tamplateRapido,
        3000,
      );
      console.log(tampleteRapido);
      ativarEventosElementos(tampleteRapido);
      tamplatesAberto = true;
    } catch (erroTentativa2) {
      throw new Error(
        'Nenhum botão de template encontrado (center-button ou quick-messages)',
      );
    }
  }
};

const selecionarPastaTamplate = async (nomePasta, logs) => {
  await esperar(500);
  const pastaTamplate = await esperarElemento(
    seletores.beetalk.pastaTamplate('GW LIDER TEMPLATE'),
    5000,
  );
  await clicarElemento(pastaTamplate, 800);
  logs.push(log('sucesso', `Pasta "${nomePasta}" aberta`));
};

const selecionarTamplate = async (nomeTamplate, idTamplate, logs) => {
  await esperar(500);
  const botaoTamplate = await esperarElemento(
    seletores.beetalk.botaoTamplate(idTamplate),
    5000,
  );
  await clicarElemento(botaoTamplate, 1000);
  logs.push(log('sucesso', `Template ${nomeTamplate} selecionado`));
};

const preencherCamposTamplate = async (
  campos,
  nome,
  modelo,
  operador,
  logs,
) => {
  logs.push(log('info', `Preenchendo ${campos.length} campos do tamplate`));

  for (const campo of campos) {
    await esperar(200);

    const input = await esperarElemento(
      seletores.beetalk.campo(campo.id),
      5000,
    );

    //Valor do  campo
    let valorCampo;
    if (campo.valor === 'nome') {
      valorCampo = nome;
    } else if (campo.valor === 'modelo') {
      valorCampo = modelo;
    } else if (campo.valor === 'saudacao') {
      const hora = new Date().getHours();
      const saudacao = hora < 12 ? 'Bom dia' : 'Boa tarde';

      valorCampo = saudacao;
    } else if (campo.valor === 'operador') {
      valorCampo = operador;
    } else {
      valorCampo = campo.value;
    }

    input.value = valorCampo;
    ativarEventosElementos(input);

    logs.push(log('sucesso', `Campo ${campo.id} preenchido: ${valorCampo}`));
  }
};

const enviarMensagemTamplate = async (logs) => {
  const botaoEnviar = Array.from(document.querySelectorAll('button')).find(
    (botao) => {
      return botao.textContent.includes('Enviar');
    },
  );

  if (!botaoEnviar) {
    throw new Error('Botao Enviar nao encontrado');
  }

  await clicarElemento(botaoEnviar, 2000);
  logs.push(log('sucesso', 'Template enviado'));
  await esperar(5000);
};

const capturarMensagem = async (logs) => {
  const mensagems = document.querySelectorAll(seletores.beetalk.mensagems);

  const ultimaMensagem = mensagems[mensagems.length - 1];

  if (!ultimaMensagem) {
    throw new Error('Não foi possível encontrar nenhuma mensagem enviada');
  }

  const mensagem = ultimaMensagem.textContent.trim();
  logs.push(log('sucesso', 'Mensagem capturada'));

  return { mensagem, mensagems };
};
