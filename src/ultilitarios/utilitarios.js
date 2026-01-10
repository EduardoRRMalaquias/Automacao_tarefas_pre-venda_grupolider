'use strict';
import { seletores } from './seletores';

export function isPaginaLead() {
  return window.location.href.includes('lightning.force.com/lightning/r/Lead/');
}

// Exporta funções para window.utils
export const esperar = (tempo) => {
  return new Promise((resolver) => {
    setTimeout(resolver, tempo);
  });
};

export const log = (tipo, mensagem) => {
  const legenda =
    {
      info: '📋',
      sucesso: '✅',
      erro: '❌',
      alerta: '⚠️',
    }[tipo] || '📋';
  console.log(legenda + ' ' + mensagem);
  return { tipo, mensagem };
};

export const esperarElemento = (seletor, tempo = 10000) => {
  return new Promise((resolver, rejeitar) => {
    const elemento = document.querySelector(seletor);

    if (elemento) return resolver(elemento);

    let observadorAtivo = true;

    const observador = new MutationObserver(() => {
      if (!observadorAtivo) return;

      const elementoObservado = document.querySelector(seletor);

      if (elementoObservado) {
        observadorAtivo = false;
        observador.disconnect();
        resolver(elementoObservado);
      }
    });

    observador.observe(document.body, {
      childList: true,
      subtree: true,
    });

    setTimeout(() => {
      if (!observadorAtivo) return;

      observadorAtivo = false;
      observador.disconnect();
      rejeitar(new Error(`Demorou demais ao esperar o elemento ${seletor}`));
    }, tempo);
  });
};

export const ativarEventosElementos = (elemento) => {
  console.log('ativando eventos elementos');
  elemento.dispatchEvent(new Event('click', { bubbles: true }));
  elemento.dispatchEvent(new Event('input', { bubbles: true }));
  elemento.dispatchEvent(new Event('change', { bubbles: true }));
  elemento.dispatchEvent(new Event('blur', { bubbles: true }));
  elemento.dispatchEvent(new Event('keyup', { bubbles: true }));
};

export const clicarElemento = async (elemento, tempo = 300) => {
  elemento.click();
  await esperar(300);
};

// funçoes de Manipulação da pagina

export const ativarModoEdicao = async function (logs) {
  logs.push(log('info', 'Ativando modo de edição...'));

  try {
    const botaoEdicao = await esperarElemento(
      seletores.salesforce.botoes.editar,
      5000,
    );
    await clicarElemento(botaoEdicao);
    logs.push(log('sucesso', 'Modo de edicao ativado'));
    await esperar(1000);
    return true;
  } catch (erro) {
    logs.push(
      log(
        'erro',
        `Falha ao salvar alterações ou desativar edicao: ${erro.message}`,
      ),
    );
    return false;
  }
};

export const salvarDesativarModoEdicao = async function (logs) {
  logs.push(log('info', 'Salvando alterações e desativando modo de edição'));

  try {
    const botaoSalvarEdicao = await esperarElemento(
      seletores.salesforce.botoes.salvarEdicao,
      5000,
    );

    if (!botaoSalvarEdicao) {
      throw new Error('Botão de salvar edicao não encontrado');
    }

    await clicarElemento(botaoSalvarEdicao);
    logs.push(log('sucesso', 'Altyerações salvas e modo de edicao desativado'));

    await esperar(1000);
    return true;
  } catch (erro) {
    logs.push(
      log(
        'erro',
        `Falha ao salvar alterações ou desativar edição: ${erro.message}`,
      ),
    );
    return false;
  }
};

export const formatarNome = async function (logs) {
  logs.push(log('info', 'Formatando nome do lead'));

  try {
    const inputPrimeiroNome = await esperarElemento(
      seletores.salesforce.inputs.primeiroNome,
    );
    const inputSobrenome = await esperarElemento(
      seletores.salesforce.inputs.sobrenome,
    );

    if (!inputPrimeiroNome || !inputSobrenome) {
      throw new Error('Campos de nome nao encontrados');
    }

    let primeiroNome = (inputPrimeiroNome.value || '').trim();
    let sobrenome = (inputSobrenome.value || '').trim();

    const nomeCompleto = `${primeiroNome} ${sobrenome}`.trim();

    const partesNome = nomeCompleto.split(/\s+/);

    if (partesNome.length === 0) {
      throw new Error('Nome invalido/Lead Sem nome');
    }

    if (partesNome.length === 1) {
      primeiroNome = '';
      sobrenome = partesNome[0];
    } else {
      primeiroNome = partesNome[0];
      sobrenome = partesNome.slice(1).join(' ');
    }

    primeiroNome = primeiroNome.toUpperCase();
    sobrenome = sobrenome.toUpperCase();

    inputPrimeiroNome.value = primeiroNome;
    ativarEventosElementos(inputPrimeiroNome);
    await esperar(100);

    inputSobrenome.value = sobrenome;
    ativarEventosElementos(inputSobrenome);
    await esperar(100);

    logs.push(
      log('sucesso', 'Nome formatado: ' + primeiroNome + ' ' + sobrenome),
    );
    return { primeiroNome, sobrenome };
  } catch (erro) {
    logs.push(log('sucesso', `Erro ao formatar nome: ${erro.message}`));
    throw erro;
  }
};

export const formatarNumeroTelefone = async function (logs) {
  logs.push(log('info', 'Formatando telefone...'));

  try {
    const inputCelular = document.querySelector(
      seletores.salesforce.inputs.celular,
    );
    const inputTelefone = document.querySelector(
      seletores.salesforce.inputs.telefone,
    );

    if (!inputCelular || !inputTelefone) {
      throw new Error('Campos de telefone não encontrados');
    }

    let numeroTelefone =
      (inputCelular.value || '').trim() || (inputCelular.value || '').trim();

    if (!numeroTelefone) {
      logs.push(log('alerta', 'Nenhum telefone encontrado'));
      return null;
    }

    numeroTelefone = numeroTelefone
      .replace(/^\+?55/, '')
      .replace(/\D/g, '')
      .trim();

    inputCelular.value = numeroTelefone;
    ativarEventosElementos(inputCelular);
    await esperar(100);

    if (inputTelefone.value) {
      inputTelefone.value = 0;
      ativarEventosElementos(inputTelefone);
    }

    logs.push(log('sucesso', `Telefone formatado: ${numeroTelefone}`));
    return numeroTelefone;
  } catch (erro) {
    logs.push(log('erro', `Erro ao formatar telefone: ${erro.message}`));
    throw erro;
  }
};

export const selecionarOpcaoCombobox = async function (
  seletorBotao,
  seletorOpcoes,
  opcaoTexto,
  logs,
  label,
) {
  try {
    const botao = await esperarElemento(seletorBotao, 5000);
    await clicarElemento(botao, 500);

    await esperar(500);

    const opcoes = Array.from(document.querySelectorAll(seletorOpcoes));

    const opcao = opcoes.find((opcao) => {
      const texto = (opcao.textContent || '').trim().toLocaleUpperCase();
      return texto === opcaoTexto.toLocaleUpperCase();
    });

    if (!opcao) {
      throw new Error(`Opcao ${opcaoTexto} nao encontrada`);
    }

    await clicarElemento(opcao);
    logs.push(log('sucesso', `${label} selecionado: ${opcaoTexto}`));

    await esperar(500);

    return true;
  } catch (erro) {
    logs.push(log('erro', `Erro ao selecionar  ${label}: ${erro.message}`));
    throw erro;
  }
};

export const preencherInputsInteresses = async function (logs) {
  logs.push(log('info', 'Preenchendo campos de intedesse...'));

  try {
    //Selecionar Marca: GWM
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.marca,
      seletores.salesforce.opcoes.padrao,
      'GWM',
      logs,
      'Marca',
    );
    await esperar(500);

    // Categoria: Novos
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.categoria,
      seletores.salesforce.opcoes.padrao,
      'Novos',
      logs,
      'Categoria',
    );
    await esperar(500);

    // Interesse em: Carros
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.interesse,
      seletores.salesforce.opcoes.padrao,
      'Carros',
      logs,
      'Interesse em',
    );
    await esperar(500);

    logs.push(log(('sucesso', 'Campos de interesse preenchidos')));
    return true;
  } catch (erro) {
    logs.push(log('erro', `Erro ao preencher interesse: ${erro.message}`));
    throw erro;
  }
};

export const formatarModeloInteresse = async function (logs) {
  logs.push(log('info', 'Formatando modelo de interesse...'));

  try {
    const modeloTextarea = document.querySelector(
      seletores.salesforce.inputs.modelo,
    );

    if (!modeloTextarea) {
      logs.push(log('alerta', 'Campo Modelo interesse nao encontrado'));
      return null;
    }

    let modelo = (modeloTextarea.value || '').trim();

    if (!modelo) {
      logs.push(log('alerta', 'Modelo interesse vazio'));
      return null;
    }

    modelo = modelo.replace(/_/g, ' ').toUpperCase();

    modeloTextarea.value = modelo;
    ativarEventosElementos(modeloTextarea);
    await esperar(100);

    logs.push(log('sucesso', 'Modelo formatado: ' + modelo));
    return modelo;
  } catch (erro) {
    logs.push(log('erro', `Erro ao formatar modelo: " + erro.message`));
    throw erro;
  }
};

export const enviarTamplateWhatsapp = async function (
  primeiroNome,
  modelo,
  operador,
  logs,
) {
  logs.push(log('info', 'Enviando template WhatsApp...'));

  try {
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

    //pasta de tamplates
    await esperar(500);
    const pastaTamplate = await esperarElemento(
      seletores.beetalk.pastaTamplate('GW LIDER TEMPLATE'),
      5000,
    );
    await clicarElemento(pastaTamplate, 800);
    logs.push(log('sucesso', 'Pasta GW LIDER TEMPLATE aberta'));

    await esperar(500);
    const botaoTamplate = await esperarElemento(
      seletores.beetalk.botaoTamplate('a0EU6000003BVunMAG'),
      5000,
    );
    await clicarElemento(botaoTamplate, 1000);
    logs.push(log('sucesso', 'Template SAUDACAO GW 2 selecionado'));

    await esperar(800);

    const campo1 = await esperarElemento(seletores.beetalk.campo(1), 5000);
    campo1.value = primeiroNome + ' ';
    ativarEventosElementos(campo1);
    await esperar(200);
    logs.push(log('sucesso', 'Campo 1 preenchido: ' + primeiroNome));

    const campo2 = await esperarElemento(seletores.beetalk.campo(2), 5000);
    campo2.value = operador;
    ativarEventosElementos(campo2);
    await esperar(200);
    logs.push(log('sucesso', 'Campo 2 preenchido: ' + operador));

    const campo3 = await esperarElemento(seletores.beetalk.campo(3), 5000);
    campo3.value = modelo || 'HAVAL H6';
    ativarEventosElementos(campo3);
    await esperar(200);
    logs.push(log('sucesso', 'Campo 3 preenchido: ' + modelo));

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

    const mensagems = document.querySelectorAll(seletores.beetalk.mensagems);
    const mensagemElemento = mensagems[mensagems.length - 1];
    const mensagem = mensagemElemento.textContent.trim();
    logs.push(log('sucesso', 'Mensagem capturada'));

    return mensagem;
  } catch (erro) {
    logs.push(log('erro', `Erro ao enviar tamplate: ${erro.message} `));
    throw erro;
  }
};

export const registrarTarefa = async function (mensagem, logs) {
  logs.push(log('info', 'Criando Tarefa...'));

  try {
    const botaoNovaTarefa = await esperarElemento(
      seletores.salesforce.botoes.novaTarefa,
      5000,
    );
    await clicarElemento(botaoNovaTarefa, 1500);
    logs.push(log('sucesso', 'Modal de tarefa aberto'));

    await esperar(1000);

    // Campo tipo
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.tipoTarefa,
      seletores.salesforce.opcoes.menu,
      'Contato',
      logs,
      'Tipo',
    );
    await esperar(500);

    // Campo assunto
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.assunto,
      seletores.salesforce.opcoes.padrao,
      'Primeiro Contato',
      logs,
      'Assunto',
    );
    await esperar(500);

    // Campo Data de Vencimento
    const InputData = await esperarElemento(
      seletores.salesforce.tarefa.inputData,
    );

    if (!InputData) {
      throw new Error(`Campo de data não encontrado`);
    }

    const hoje = new Date();
    const dia = String(hoje.getDate()).padStart(2, '0');
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const ano = hoje.getFullYear();
    const dataFormatada = `${dia}/${mes}/${ano}`;

    InputData.value = dataFormatada;
    ativarEventosElementos(InputData);

    await esperar(500);
    logs.push(log('sucesso', 'Data de vencimento: ' + dataFormatada));

    // Campo Comentario da tarefa
    const textareaComentario = document.querySelector(
      seletores.salesforce.tarefa.textareaComentario,
    );

    if (!textareaComentario) {
      throw new Error(`Campo de comentarios não encontrado`);
    }

    textareaComentario.value = mensagem;
    ativarEventosElementos(textareaComentario);

    await esperar(300);

    logs.push(log('sucesso', 'Comentarios preenchidos'));

    // Check de conjunto de lembretes

    const secaoTarefa = await esperarElemento(
      seletores.salesforce.tarefa.secaoTarefa,
    );
    const checkboxLembrete = secaoTarefa.querySelectorAll(
      'lightning-input input[type="checkbox"]',
    );

    if (!checkboxLembrete) {
      if (checkboxLembrete.checked) {
        await clicarElemento(checkboxLembrete);
        logs.push(log('sucesso', 'Lembrete desmarcado'));
      } else {
        logs.push(log('info', 'Lembrete ja estava desmarcado'));
      }
    } else {
      logs.push(
        log('warning', 'Checkbox de lembrete nao encontrado (nao critico)'),
      );
    }

    await esperar(800);

    // Salvar Tarefa
    const botaoSalvarTarefa = document.querySelector(
      seletores.salesforce.botoes.salvarTarefa,
    );

    if (!botaoSalvarTarefa) {
      throw new Error('Botao Salvar nao encontrado');
    }

    await clicarElemento(botaoSalvarTarefa, 2000);
    logs.push(log('sucesso', 'tarefa Salva'));

    return true;
  } catch (erro) {
    logs.push(log('erro', `Erro ao criar tarefa: ${erro.message}`));
    throw erro;
  }
};

console.log('✅ Utilitários carregados');
