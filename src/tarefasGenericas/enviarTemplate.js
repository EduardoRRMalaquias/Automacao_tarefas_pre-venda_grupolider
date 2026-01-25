import { seletores } from '../ultilitarios/seletores';
import {
  log,
  esperar,
  esperarElemento,
  clicarElemento,
  ativarEventosElementos,
} from '../ultilitarios/utilitarios.js';

export const enviartemplate = {
  nome: 'Enviar template Whatsapp',

  async executar(
    pasta,
    { nometemplate, idtemplate, campos },
    nomeFormatado = '',
    modelo = '',
    operador = '',
    logs,
  ) {
    logs.push(log('info', 'Enviando template WhatsApp...'));

    try {
      await abrirModaltemplate(logs);

      await selecionarPastatemplate(pasta, logs);

      await selecionartemplate(nometemplate, idtemplate, logs);

      if (campos && campos.length > 0) {
        await preencherCampostemplate(
          campos,
          nomeFormatado,
          modelo,
          operador,
          logs,
        );
      }

      await enviarMensagemtemplate(logs);

      const { mensagem } = await capturarMensagems(logs);

      logs.push(
        log('sucesso', 'Template de mensagem enviado e capturado com sucesso!'),
      );

      return {
        sucesso: true,
        mensagem,
      };
    } catch (erro) {
      logs.push(log('erro', `Erro ao enviar template: ${erro.message} `));
      throw erro;
    }
  },
};

const abrirModaltemplate = async (logs) => {
  let templatesAberto = false;

  //Botão "Enviar template"
  try {
    logs.push(log('info', 'Tentando botão central...'));
    const botaoEnviartemplate = await esperarElemento(
      seletores.beetalk.botoes.enviartemplate,
      3000,
    );
    await clicarElemento(botaoEnviartemplate, 800);
    logs.push(log('sucesso', 'Botão central clicado'));
    templatesAberto = true;
  } catch (erroTentativa1) {
    logs.push(
      log('info', 'Botão central não encontrado, tentando alternativa...'),
    );
  }

  //botao template rapido
  if (!templatesAberto) {
    try {
      logs.push(log('info', 'Tentando quick-messages...'));
      const tampleteRapido = await esperarElemento(
        seletores.beetalk.botoes.templateRapido,
        3000,
      );
      console.log(tampleteRapido);
      ativarEventosElementos(tampleteRapido);
      templatesAberto = true;
    } catch (erroTentativa2) {
      throw new Error(
        'Nenhum botão de template encontrado (center-button ou quick-messages)',
      );
    }
  }
};

const selecionarPastatemplate = async (nomePasta, logs) => {
  await esperar(500);
  const pastatemplate = await esperarElemento(
    seletores.beetalk.pastatemplate('GW LIDER TEMPLATE'),
    5000,
  );
  await clicarElemento(pastatemplate, 800);
  logs.push(log('sucesso', `Pasta "${nomePasta}" aberta`));
};

const selecionartemplate = async (nometemplate, idtemplate, logs) => {
  await esperar(500);
  const botaotemplate = await esperarElemento(
    seletores.beetalk.botaotemplate(idtemplate),
    5000,
  );
  await clicarElemento(botaotemplate, 1000);
  logs.push(log('sucesso', `Template ${nometemplate} selecionado`));
};

const preencherCampostemplate = async (
  campos,
  nome,
  modelo,
  operador,
  logs,
) => {
  logs.push(log('info', `Preenchendo ${campos.length} campos do template`));

  for (const campo of campos) {
    await esperar(200);

    const input = await esperarElemento(
      seletores.beetalk.campo(campo.id),
      5000,
    );

    //Valor do  campo
    let valorCampo;
    if (campo.valor === 'nome') {
      valorCampo = nome + ' ';
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

const enviarMensagemtemplate = async (logs) => {
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

export const capturarMensagems = async (logs = []) => {
  logs.push(log('info', 'Capturando mensagens enviadas...'));

  try {
    await esperar(2000);

    const elementosMensagems = document.querySelectorAll(
      seletores.beetalk.mensagems,
    );

    if (!elementosMensagems || elementosMensagems.length === 0) {
      console.error('Nenhuma mensagem encontrada');
      return {
        mensagem: '', // ✅ String da última
        mensagens: [], // ✅ Array completo
        totalMensagens: 0,
      };
    }

    const mensagens = Array.from(elementosMensagems).map((elemento, index) => ({
      numero: index + 1,
      texto: elemento.textContent.trim(),
    }));

    const ultimaMensagem = mensagens[mensagens.length - 1];

    logs.push(log('sucesso', `${mensagens.length} mensagem(ns) capturada(s)`));
    logs.push(
      log('info', `Última: "${ultimaMensagem.texto.substring(0, 50)}..."`),
    );

    return {
      mensagem: ultimaMensagem.texto, // ✅ String da última
      mensagens: mensagens, // ✅ Array completo
      totalMensagens: mensagens.length,
    };
  } catch (erro) {
    logs.push(log('erro', `Erro ao capturar mensagens: ${erro.message}`));
    throw erro;
  }
};
