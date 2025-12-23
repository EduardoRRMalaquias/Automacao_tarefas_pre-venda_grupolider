(() => {
  'use strict';

  //Ultilitarios
  const esperar = (tempo) => {
    return new Promise((resolver) => {
      setTimeout(resolver, tempo);
    });
  };

  const log = (tipo, mensagem) => {
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

  const esperarElemento = (seletor, tempo = 10000) => {
    return new Promise((resolver, rejeitar) => {
      const elemento = document.querySelector(seletor);

      if (elemento) return resolver(elemento);

      const observador = new MutationObserver(() => {
        const elementoObservado = document.querySelector(seletor);

        if (elementoObservado) {
          observador.disconnect();
          resolver(elementoObservado);
        }
      });

      observador.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observador.disconnect();
        rejeitar(new Error(`Demorou demais ao esperar o elemento ${elemento}`));
      }, tempo);
    });
  };

  const ativarEventosInputs = (elemento) => {
    elemento.dispatchEvent(new Event('input', { bubbles: true }));
    elemento.dispatchEvent(new Event('change', { bubbles: true }));
    elemento.dispatchEvent(new Event('blur', { bubbles: true }));
    elemento.dispatchEvent(new Event('keyup', { bubbles: true }));
  };

  const clicarElemento = async (elemento, tempo = 300) => {
    console.log(elemento);
    elemento.click();
    await esperar(300);
  };

  // funçoes de Manipulação da pagina
  async function ativarModoEdicao(logs) {
    logs.push(log('info', 'Ativando modo de edição...'));

    try {
      const botaoEdicao = await esperarElemento(
        'button.inline-edit-trigger[title*="Editar"]',
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
  }

  async function savlarDesativarModoEdicao(logs) {
    logs.push(log('info', 'Salvando alterações e desativando modo de edição'));

    try {
      const botaoSalvarEdicao = await esperarElemento(
        'lightning-button button[name="SaveEdit"]',
        5000,
      );

      if (!botaoSalvarEdicao) {
        throw new Error('Botão de salvar edicao não encontrado');
      }

      await clicarElemento(botaoSalvarEdicao);
      logs.push(
        log('sucesso', 'Altyerações salvas e modo de edicao desativado'),
      );

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
  }

  async function formatarNome(logs) {
    logs.push(log('info', 'Formatando nome do lead'));

    try {
      const inputPrimeiroNome = await esperarElemento(
        'input[name="firstName"]',
      );
      const inputSobrenome = await esperarElemento('input[name="lastName"]');

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
      ativarEventosInputs(inputPrimeiroNome);
      await esperar(100);

      inputSobrenome.value = sobrenome;
      ativarEventosInputs(inputSobrenome);
      await esperar(100);

      logs.push(
        log('sucesso', 'Nome formatado: ' + primeiroNome + ' ' + sobrenome),
      );
      return { primeiroNome, sobrenome };
    } catch (erro) {
      logs.push('sucesso', `Erro ao formatar nome: ${erro.message}`);
      throw erro;
    }
  }

  async function formatarNumeroTelefone(logs) {
    logs.push(log('info', 'Formatando telefone...'));

    try {
      const inputCelular = document.querySelector('input[name="MobilePhone"]');
      const inputTelefone = document.querySelector('input[name="Phone"]');

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
      ativarEventosInputs(inputCelular);
      await esperar(100);

      if (inputTelefone.value) {
        inputTelefone.value = 0;
        ativarEventosInputs(inputTelefone);
      }

      logs.push(log('sucesso', `Telefone formatado: ${numeroTelefone}`));
      return numeroTelefone;
    } catch (erro) {
      logs.push(log('erro', `Erro ao formatar telefone: ${erro.message}`));
      throw erro;
    }
  }

  async function selecionarOpcaoCombobox(
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
  }

  async function preencherInputsInteresses(logs) {
    logs.push(log('info', 'Preenchendo campos de intedesse...'));

    try {
      //Selecionar Marca: GWM
      await selecionarOpcaoCombobox(
        'button[role="combobox"][aria-label="Marca"]',
        'lightning-base-combobox-item, [role="option"]',
        'GWM',
        logs,
        'Marca',
      );
      await esperar(500);

      // Categoria: Novos
      await selecionarOpcaoCombobox(
        'button[role="combobox"][aria-label="Categoria"]',
        'lightning-base-combobox-item, [role="option"]',
        'Novos',
        logs,
        'Categoria',
      );
      await esperar(500);

      // Interesse em: Carros
      await selecionarOpcaoCombobox(
        'button[role="combobox"][aria-label="Interesse em"]',
        'lightning-base-combobox-item, [role="option"]',
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
  }

  async function formatarModeloInteresse(logs) {
    logs.push(log('info', 'Formatando modelo de interesse...'));

    try {
      const modeloTextarea = document.querySelector(
        'textarea[id*="input-"][maxlength="255"]',
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
      ativarEventosInputs(modeloTextarea);
      await esperar(100);

      logs.push(log('sucesso', 'Modelo formatado: ' + modelo));
      return modelo;
    } catch (erro) {
      logs.push(log('erro', `Erro ao formatar modelo: " + erro.message`));
      throw erro;
    }
  }

  async function enviarTamplateWhatsapp(primeiroNome, modelo, operador, logs) {
    logs.push(log('info', 'Enviando template WhatsApp...'));

    try {
      const botaoEnviarTamplate = await esperarElemento(
        'p.center-button',
        5000,
      );
      await clicarElemento(botaoEnviarTamplate, 800);
      logs.push(log('sucesso', 'Botao de template clicado'));

      await esperar(500);
      const pastaTamplate = await esperarElemento(
        'p[data-folder-name="GW LIDER TEMPLATE"]',
        5000,
      );
      await clicarElemento(pastaTamplate, 800);
      logs.push(log('sucesso', 'Pasta GW LIDER TEMPLATE aberta'));

      await esperar(500);
      const botaoTamplate = await esperarElemento(
        'p[data-message-id="a0EU6000003BVunMAG"]',
        5000,
      );
      await clicarElemento(botaoTamplate, 1000);
      logs.push(log('sucesso', 'Template SAUDACAO GW 2 selecionado'));

      await esperar(800);

      const campo1 = await esperarElemento('input[data-id="1"]', 5000);
      campo1.value = primeiroNome + ' ';
      ativarEventosInputs(campo1);
      await esperar(200);
      logs.push(log('sucesso', 'Campo 1 preenchido: ' + primeiroNome));

      const campo2 = await esperarElemento('input[data-id="2"]', 5000);
      campo2.value = operador;
      ativarEventosInputs(campo2);
      await esperar(200);
      logs.push(log('sucesso', 'Campo 2 preenchido: ' + operador));

      const campo3 = await esperarElemento('input[data-id="3"]', 5000);
      campo3.value = modelo || 'HAVAL H6';
      ativarEventosInputs(campo3);
      await esperar(200);
      logs.push(log('sucesso', 'Campo 4 preenchido: ' + modelo));

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

      const menssagems = document.querySelectorAll('p[data-id="message-text"]');
      const menssagemElemento = menssagems[menssagems.length - 1];
      const mensagem = menssagemElemento.textContent.trim();
      logs.push(log('sucesso', 'Mensagem capturada'));

      return mensagem;
    } catch (erro) {
      logs.push(log('erro', `Erro ao enviar tamplate: ${erro.message} `));
      throw erro;
    }
  }

  async function registrarTarefa(menssagem, logs) {
    logs.push(log('info', 'Criando Tarefa...'));

    try {
      const botaoNovaTarefa = await esperarElemento(
        'button[aria-label="Nova tarefa"]',
        5000,
      );
      await clicarElemento(botaoNovaTarefa, 1500);
      logs.push(log('sucesso', 'Modal de tarefa aberto'));

      await esperar(1000);

      // Campo tipo
      await selecionarOpcaoCombobox(
        'a[role="combobox"][aria-labelledby*="label"]',
        '.uiMenuItem a',
        'Contato',
        logs,
        'Tipo',
      );
      await esperar(500);

      // Campo assunto
      await selecionarOpcaoCombobox(
        'lightning-grouped-combobox [role="combobox"]',
        'lightning-base-combobox-item',
        'Primeiro Contato',
        logs,
        'Assunto',
      );
      await esperar(500);

      // Campo assunto
      await selecionarOpcaoCombobox(
        'lightning-grouped-combobox [role="combobox"]',
        'lightning-base-combobox-item',
        'Primeiro Contato',
        logs,
        'Assunto',
      );
      await esperar(500);

      // Campo Data de Vencimento
      const InputData = await esperarElemento(
        'lightning-datepicker input[type="text"]',
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
      ativarEventosInputs(InputData);

      await esperar(500);
      logs.push(log('sucesso', 'Data de vencimento: ' + dataFormatada));

      // Campo Comentario da tarefa
      const textareaComentario = document.querySelector(
        'textarea[role="textbox"]',
      );

      if (!textareaComentario) {
        throw new Error(`Campo de comentarios não encontrado`);
      }

      textareaComentario.value = menssagem;
      ativarEventosInputs(textareaComentario);

      await esperar(300);

      logs.push(log('sucesso', 'Comentarios preenchidos'));

      // Check de conjunto de lembretes

      const secaoTarefa = await esperarElemento(
        'fieldset[data-aura-class="forcePageBlockSection forcePageBlockSectionEdit"]',
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
        'button.cuf-publisherShareButton',
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
  }

  const primeiroContatoGWM = {
    nome: 'Primeiro Contato GWM',
    descrição:
      'Formata lead, envia templatede menssagem pelo beetalk e cria tarefa',

    executar: async (contexto) => {
      const logs = [];

      logs.push(log('info', 'Iniciando automacao: Primeiro Contato GWM'));

      try {
        const dadosOperador = await new Promise((resolver) => {
          chrome.storage.local.get('operador', resolver);
        });

        const operador = (dadosOperador.operador || 'Eduardo').split(' ')[0];
        logs.push(log('info', `Operador: ${operador}`));

        await ativarModoEdicao(logs);

        const nomeFormatado = await formatarNome(logs);

        const primeiroNome = nomeFormatado.primeiroNome
          ? nomeFormatado.primeiroNome
          : nomeFormatado.sobrenome;

        await formatarNumeroTelefone(logs);
        await preencherInputsInteresses(logs);

        const modelo = await formatarModeloInteresse(logs);

        await savlarDesativarModoEdicao(logs);

        const menssagem = await enviarTamplateWhatsapp(
          primeiroNome,
          modelo,
          operador,
          logs,
        );

        await registrarTarefa(menssagem, logs);

        return {
          sucesso: true,
          logs: logs,
        };
      } catch (erro) {
        logs.push(log('erro', `Falha na automacao ${erro.message}`));
        return {
          sucesso: false,
          erro: erro.message,
          logs: logs,
        };
      }
    },
  };

  // Registrar Marca GWM
  if (window.gerenciadorMarcas) {
    window.gerenciadorMarcas.cadastrarMarca('gwm', {
      nome: 'GWM',
      descricao: 'Great Wall Motors',
      tarefas: {
        'primeiro-contato': primeiroContatoGWM,
      },
    });

    console.log('Marca GWM registrada com sucesso');
  } else {
    console.error('GerenciadorMarcas não encontrado!');
  }
})();
