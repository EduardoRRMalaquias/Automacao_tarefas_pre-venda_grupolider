'use strict';
import { seletores } from './seletores';

export const TIMEOUTS = {
  ULTRA_RAPIDO: 800,
  RAPIDO: 2000,
  PADRAO: 10000,
  LONGO: 30000,

  DIGITACAO: 100,
  CLIQUE: 200,
  TRANSICAO: 500,

  SISTEMA: 5000,
};

export async function getOperador() {
  return new Promise((resolver) => {
    chrome.storage.local.get(['operador'], (resultado) => {
      const operador = resultado.operador.split(' ')[0];
      resolver(operador);
    });
  });
}

export function isPaginaLead() {
  return window.location.href.includes('lightning.force.com/lightning/r/Lead/');
}

// Exporta funções ultilitari\s
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

export const esperarElemento = async (seletor, tempo = TIMEOUTS.SISTEMA) => {
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
  elemento.dispatchEvent(new Event('click', { bubbles: true }));
  elemento.dispatchEvent(new Event('input', { bubbles: true }));
  elemento.dispatchEvent(new Event('change', { bubbles: true }));
  elemento.dispatchEvent(new Event('blur', { bubbles: true }));
  elemento.dispatchEvent(new Event('keyup', { bubbles: true }));
};

export const clicarElemento = async (elemento, tempo = TIMEOUTS.CLIQUE) => {
  elemento.click();
  await esperar(tempo);
};

export const formatarNumeroTelefone = (numeroTelefone) => {
  return numeroTelefone
    .replace(/^\+?55/, '')
    .replace(/\D/g, '')
    .trim();
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
    await esperar(TIMEOUTS.ULTRA_RAPIDO);
    return true;
  } catch {}
};

export const salvarDesativarModoEdicao = async function (logs) {
  logs.push(log('info', 'Salvando alterações e desativando modo de edição'));

  try {
    const botaoSalvarEdicao = await esperarElemento(
      seletores.salesforce.botoes.salvarEdicao,
      TIMEOUTS.SISTEMA,
    );

    if (!botaoSalvarEdicao) {
      throw new Error('Botão de salvar edicao não encontrado');
    }

    await clicarElemento(botaoSalvarEdicao);
    logs.push(log('sucesso', 'Altyerações salvas e modo de edicao desativado'));

    await esperar(TIMEOUTS.ULTRA_RAPIDO);
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

//Salvar Satatus Tentativa
export const salvarStatusTentativa = async (config, logs) => {
  const { numeroTentativa, concluido, tipoContato = null } = config;

  logs.push(log('info', `Salvando status da ${numeroTentativa}ª tentativa...`));

  try {
    if (!numeroTentativa || numeroTentativa < 1 || numeroTentativa > 3) {
      throw new Error('Número de tentativa inválido (1, 2 ou 3)');
    }

    if (concluido && !tipoContato) {
      throw new Error('Tipo de contato obrigatório quando concluído');
    }

    const botaoAbrirModal = await esperarElemento(
      seletores.salesforce.botoes.abrirModalTentativa,
      TIMEOUTS.RAPIDO,
    );

    if (!botaoAbrirModal) {
      throw new Error('Botão de salvar tentativa não encontrado');
    }

    const textoBotao = botaoAbrirModal.textContent.trim();
    const tentativaAtualMatch = textoBotao.match(/(\d).*Tentativa/);

    if (!concluido && tentativaAtualMatch) {
      const tentativaAtual = parseInt(tentativaAtualMatch[1]);

      if (tentativaAtual > numeroTentativa) {
        logs.push(log('info', `${numeroTentativa}ª tentativa já registrada`));
        return { sucesso: true, jaRegistrada: true };
      }
    }

    await clicarElemento(botaoAbrirModal);
    await esperar(TIMEOUTS.ULTRA_RAPIDO);
    logs.push(log('info', 'Modal de tentativa aberto'));

    const status = concluido ? 'Concluído' : 'Não Concluído';

    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.status,
      seletores.salesforce.opcoes.padrao,
      status,
      logs,
      'Status',
    );
    await esperar(TIMEOUTS.CLIQUE);

    if (concluido && tipoContato) {
      const tipoTexto = tipoContato === 'whatsapp' ? 'WhatsApp' : 'Ligação';

      await selecionarOpcaoCombobox(
        seletores.salesforce.comboboxes.tipoContato,
        seletores.salesforce.opcoes.padrao,
        tipoTexto,
        logs,
        'Tipo de tentativa',
      );
      await esperar(TIMEOUTS.ULTRA_RAPIDO);
    }

    const botaoSalvar = document.querySelector(
      seletores.salesforce.botoes.salvarTentativa,
    );

    if (!botaoSalvar) {
      // Fallback: tenta encontrar botão "Salvar" dentro do modal
      const modal = document.querySelector('[role="dialog"]');
      if (modal) {
        const botoesDentroModal = modal.querySelectorAll(
          'button[title*="Salvar"]',
        );
        const botaoCorreto = Array.from(botoesDentroModal).find(
          (btn) => !btn.textContent.includes('Cancelar'),
        );

        if (botaoCorreto) {
          await clicarElemento(botaoCorreto);
        } else {
          throw new Error('Botão salvar não encontrado no modal');
        }
      } else {
        throw new Error('Modal não encontrado');
      }
    } else {
      await clicarElemento(botaoSalvar);
    }

    await esperar(TIMEOUTS.ULTRA_RAPIDO);

    logs.push(log('sucesso', `${numeroTentativa}ª tentativa: ${status}`));

    return {
      sucesso: true,
      numeroTentativa,
      status,
      tipoContato: concluido ? tipoContato : null,
    };
  } catch (erro) {
    logs.push(log('erro', `Erro ao salvar tentativa: ${erro.message}`));
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
    const botao = await esperarElemento(seletorBotao, TIMEOUTS.SISTEMA);
    await clicarElemento(botao, TIMEOUTS.TRANSICAO);

    await esperar(TIMEOUTS.TRANSICAO);

    const opcoes = Array.from(document.querySelectorAll(seletorOpcoes));

    const opcao = opcoes.find((opcao) => {
      const texto = (opcao.textContent || '').trim().toUpperCase();
      return texto === opcaoTexto.toUpperCase();
    });

    if (!opcao) {
      throw new Error(`Opcao ${opcaoTexto} nao encontrada`);
    }

    await clicarElemento(opcao);
    logs.push(log('sucesso', `${label} selecionado: ${opcaoTexto}`));

    await esperar(TIMEOUTS.TRANSICAO);

    return true;
  } catch (erro) {
    logs.push(log('erro', `Erro ao selecionar  ${label}: ${erro.message}`));
    throw erro;
  }
};

export const enviarTemplateWhatsapp = async function (
  primeiroNome,
  modelo,
  operador,
  logs,
) {
  logs.push(log('info', 'Enviando template WhatsApp...'));

  try {
    //Botão "Enviar template"
    try {
      logs.push(log('info', 'Tentando botão central...'));
      const botaoEnviarTemplate = await esperarElemento(
        seletores.beetalk.botoes.enviarTemplate,
        TIMEOUTS.LONGO,
      );
      await clicarElemento(botaoEnviarTemplate, 800);
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
          TIMEOUTS.LONGO,
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

    //pasta de templates
    await esperar(TIMEOUTS.TRANSICAO);
    const pastatemplate = await esperarElemento(
      seletores.beetalk.pastatemplate('GW LIDER TEMPLATE'),
      TIMEOUTS.SISTEMA,
    );
    await clicarElemento(pastatemplate, 800);
    logs.push(log('sucesso', 'Pasta GW LIDER TEMPLATE aberta'));

    await esperar(TIMEOUTS.TRANSICAO);
    const botaotemplate = await esperarElemento(
      seletores.beetalk.botaotemplate('a0EU6000003BVunMAG'),
      TIMEOUTS.SISTEMA,
    );
    await clicarElemento(botaotemplate, TIMEOUTS.ULTRA_RAPIDO);
    logs.push(log('sucesso', 'Template SAUDACAO GW 2 selecionado'));

    await esperar(TIMEOUTS.ULTRA_RAPIDO);

    const campo1 = await esperarElemento(
      seletores.beetalk.campo(1),
      TIMEOUTS.SISTEMA,
    );
    campo1.value = primeiroNome + ' ';
    ativarEventosElementos(campo1);
    await esperar(TIMEOUTS.CLIQUE);
    logs.push(log('sucesso', 'Campo 1 preenchido: ' + primeiroNome));

    const campo2 = await esperarElemento(
      seletores.beetalk.campo(2),
      TIMEOUTS.SISTEMA,
    );
    campo2.value = operador;
    ativarEventosElementos(campo2);
    await esperar(TIMEOUTS.CLIQUE);
    logs.push(log('sucesso', 'Campo 2 preenchido: ' + operador));

    const campo3 = await esperarElemento(
      seletores.beetalk.campo(3),
      TIMEOUTS.SISTEMA,
    );
    campo3.value = modelo || 'HAVAL H6';
    ativarEventosElementos(campo3);
    await esperar(TIMEOUTS.CLIQUE);
    logs.push(log('sucesso', 'Campo 3 preenchido: ' + modelo));

    if (!botaoEnviar) {
      throw new Error('Botao Enviar nao encontrado');
    }

    await clicarElemento(botaoEnviar, TIMEOUTS.PADRAO);
    logs.push(log('sucesso', 'Template enviado'));
    await esperar(TIMEOUTS.SISTEMA);
  } catch (erro) {
    logs.push(log('erro', `Erro ao enviar template: ${erro.message} `));
    throw erro;
  }
};

export const registrarTarefa = async function (mensagem, tipo, assunto, logs) {
  logs.push(log('info', 'Criando Tarefa...'));

  try {
    const botaoNovaTarefa = await esperarElemento(
      seletores.salesforce.botoes.novaTarefa,
      TIMEOUTS.PADRAO,
    );
    await clicarElemento(botaoNovaTarefa, TIMEOUTS.PADRAO);
    logs.push(log('sucesso', 'Modal de tarefa aberto'));

    await esperar(TIMEOUTS.ULTRA_RAPIDO);

    // Campo tipo
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.tipoTarefa,
      seletores.salesforce.opcoes.menu,
      tipo,
      logs,
      'Tipo',
    );
    await esperar(TIMEOUTS.TRANSICAO);

    // Campo assunto
    try {
      await selecionarOpcaoCombobox(
        seletores.salesforce.comboboxes.assunto,
        seletores.salesforce.opcoes.padrao,
        assunto,
        logs,
        'Assunto',
      );
      await esperar(TIMEOUTS.TRANSICAO);
    } catch (error) {
      const campoAssunto = await esperarElemento(
        seletores.salesforce.comboboxes.assunto,
      );
      campoAssunto.value = assunto;
      ativarEventosElementos(campoAssunto);
    }

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

    await esperar(TIMEOUTS.CLIQUE);

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

    await esperar(TIMEOUTS.ULTRA_RAPIDO);

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
