(function () {
  'use strict';
  const seletores = window.seletores;

  // Exporta funções para window.utils
  window.utilitarios = {
    esperar: (tempo) => {
      return new Promise((resolver) => {
        setTimeout(resolver, tempo);
      });
    },

    log: (tipo, mensagem) => {
      const legenda =
        {
          info: '📋',
          sucesso: '✅',
          erro: '❌',
          alerta: '⚠️',
        }[tipo] || '📋';
      console.log(legenda + ' ' + mensagem);
      return { tipo, mensagem };
    },

    esperarElemento: (seletor, tempo = 10000) => {
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
          rejeitar(
            new Error(`Demorou demais ao esperar o elemento ${seletor}`),
          );
        }, tempo);
      });
    },

    ativarEventosElementos: (elemento) => {
      console.log('ativando eventos elementos');
      elemento.dispatchEvent(new Event('click', { bubbles: true }));
      elemento.dispatchEvent(new Event('input', { bubbles: true }));
      elemento.dispatchEvent(new Event('change', { bubbles: true }));
      elemento.dispatchEvent(new Event('blur', { bubbles: true }));
      elemento.dispatchEvent(new Event('keyup', { bubbles: true }));
    },

    clicarElemento: async (elemento, tempo = 300) => {
      elemento.click();
      await window.utilitarios.esperar(300);
    },

    // funçoes de Manipulação da pagina

    ativarModoEdicao: async function (logs) {
      logs.push(window.utilitarios.log('info', 'Ativando modo de edição...'));

      try {
        const botaoEdicao = await window.utilitarios.esperarElemento(
          seletores.salesforce.botoes.editar,
          5000,
        );
        await window.utilitarios.clicarElemento(botaoEdicao);
        logs.push(window.utilitarios.log('sucesso', 'Modo de edicao ativado'));
        await window.utilitarios.esperar(1000);
        return true;
      } catch (erro) {
        logs.push(
          window.utilitarios.log(
            'erro',
            `Falha ao salvar alterações ou desativar edicao: ${erro.message}`,
          ),
        );
        return false;
      }
    },

    salvarDesativarModoEdicao: async function (logs) {
      logs.push(
        window.utilitarios.log(
          'info',
          'Salvando alterações e desativando modo de edição',
        ),
      );

      try {
        const botaoSalvarEdicao = await window.utilitarios.esperarElemento(
          seletores.salesforce.botoes.salvarEdicao,
          5000,
        );

        if (!botaoSalvarEdicao) {
          throw new Error('Botão de salvar edicao não encontrado');
        }

        await window.utilitarios.clicarElemento(botaoSalvarEdicao);
        logs.push(
          window.utilitarios.log(
            'sucesso',
            'Altyerações salvas e modo de edicao desativado',
          ),
        );

        await window.utilitarios.esperar(1000);
        return true;
      } catch (erro) {
        logs.push(
          window.utilitarios.log(
            'erro',
            `Falha ao salvar alterações ou desativar edição: ${erro.message}`,
          ),
        );
        return false;
      }
    },

    formatarNome: async function (logs) {
      logs.push(window.utilitarios.log('info', 'Formatando nome do lead'));

      try {
        const inputPrimeiroNome = await window.utilitarios.esperarElemento(
          seletores.salesforce.inputs.primeiroNome,
        );
        const inputSobrenome = await window.utilitarios.esperarElemento(
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
        window.utilitarios.ativarEventosElementos(inputPrimeiroNome);
        await window.utilitarios.esperar(100);

        inputSobrenome.value = sobrenome;
        window.utilitarios.ativarEventosElementos(inputSobrenome);
        await window.utilitarios.esperar(100);

        logs.push(
          window.utilitarios.log(
            'sucesso',
            'Nome formatado: ' + primeiroNome + ' ' + sobrenome,
          ),
        );
        return { primeiroNome, sobrenome };
      } catch (erro) {
        logs.push(
          window.utilitarios.log(
            'sucesso',
            `Erro ao formatar nome: ${erro.message}`,
          ),
        );
        throw erro;
      }
    },

    formatarNumeroTelefone: async function (logs) {
      logs.push(window.utilitarios.log('info', 'Formatando telefone...'));

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
          (inputCelular.value || '').trim() ||
          (inputCelular.value || '').trim();

        if (!numeroTelefone) {
          logs.push(
            window.utilitarios.log('alerta', 'Nenhum telefone encontrado'),
          );
          return null;
        }

        numeroTelefone = numeroTelefone
          .replace(/^\+?55/, '')
          .replace(/\D/g, '')
          .trim();

        inputCelular.value = numeroTelefone;
        window.utilitarios.ativarEventosElementos(inputCelular);
        await window.utilitarios.esperar(100);

        if (inputTelefone.value) {
          inputTelefone.value = 0;
          window.utilitarios.ativarEventosElementos(inputTelefone);
        }

        logs.push(
          window.utilitarios.log(
            'sucesso',
            `Telefone formatado: ${numeroTelefone}`,
          ),
        );
        return numeroTelefone;
      } catch (erro) {
        logs.push(
          window.utilitarios.log(
            'erro',
            `Erro ao formatar telefone: ${erro.message}`,
          ),
        );
        throw erro;
      }
    },

    selecionarOpcaoCombobox: async function (
      seletorBotao,
      seletorOpcoes,
      opcaoTexto,
      logs,
      label,
    ) {
      try {
        const botao = await window.utilitarios.esperarElemento(
          seletorBotao,
          5000,
        );
        await window.utilitarios.clicarElemento(botao, 500);

        await window.utilitarios.esperar(500);

        const opcoes = Array.from(document.querySelectorAll(seletorOpcoes));

        const opcao = opcoes.find((opcao) => {
          const texto = (opcao.textContent || '').trim().toLocaleUpperCase();
          return texto === opcaoTexto.toLocaleUpperCase();
        });

        if (!opcao) {
          throw new Error(`Opcao ${opcaoTexto} nao encontrada`);
        }

        await window.utilitarios.clicarElemento(opcao);
        logs.push(
          window.utilitarios.log(
            'sucesso',
            `${label} selecionado: ${opcaoTexto}`,
          ),
        );

        await window.utilitarios.esperar(500);

        return true;
      } catch (erro) {
        logs.push(
          window.utilitarios.log(
            'erro',
            `Erro ao selecionar  ${label}: ${erro.message}`,
          ),
        );
        throw erro;
      }
    },

    preencherInputsInteresses: async function (logs) {
      logs.push(
        window.utilitarios.log('info', 'Preenchendo campos de intedesse...'),
      );

      try {
        //Selecionar Marca: GWM
        await window.utilitarios.selecionarOpcaoCombobox(
          seletores.salesforce.comboboxes.marca,
          seletores.salesforce.opcoes.padrao,
          'GWM',
          logs,
          'Marca',
        );
        await window.utilitarios.esperar(500);

        // Categoria: Novos
        await window.utilitarios.selecionarOpcaoCombobox(
          seletores.salesforce.comboboxes.categoria,
          seletores.salesforce.opcoes.padrao,
          'Novos',
          logs,
          'Categoria',
        );
        await window.utilitarios.esperar(500);

        // Interesse em: Carros
        await window.utilitarios.selecionarOpcaoCombobox(
          seletores.salesforce.comboboxes.interesse,
          seletores.salesforce.opcoes.padrao,
          'Carros',
          logs,
          'Interesse em',
        );
        await window.utilitarios.esperar(500);

        logs.push(
          window.utilitarios.log(
            ('sucesso', 'Campos de interesse preenchidos'),
          ),
        );
        return true;
      } catch (erro) {
        logs.push(
          window.utilitarios.log(
            'erro',
            `Erro ao preencher interesse: ${erro.message}`,
          ),
        );
        throw erro;
      }
    },

    formatarModeloInteresse: async function (logs) {
      logs.push(
        window.utilitarios.log('info', 'Formatando modelo de interesse...'),
      );

      try {
        const modeloTextarea = document.querySelector(
          seletores.salesforce.inputs.modelo,
        );

        if (!modeloTextarea) {
          logs.push(
            window.utilitarios.log(
              'alerta',
              'Campo Modelo interesse nao encontrado',
            ),
          );
          return null;
        }

        let modelo = (modeloTextarea.value || '').trim();

        if (!modelo) {
          logs.push(window.utilitarios.log('alerta', 'Modelo interesse vazio'));
          return null;
        }

        modelo = modelo.replace(/_/g, ' ').toUpperCase();

        modeloTextarea.value = modelo;
        window.utilitarios.ativarEventosElementos(modeloTextarea);
        await window.utilitarios.esperar(100);

        logs.push(
          window.utilitarios.log('sucesso', 'Modelo formatado: ' + modelo),
        );
        return modelo;
      } catch (erro) {
        logs.push(
          window.utilitarios.log(
            'erro',
            `Erro ao formatar modelo: " + erro.message`,
          ),
        );
        throw erro;
      }
    },

    enviarTamplateWhatsapp: async function (
      primeiroNome,
      modelo,
      operador,
      logs,
    ) {
      logs.push(
        window.utilitarios.log('info', 'Enviando template WhatsApp...'),
      );

      try {
        let tamplatesAberto = false;

        //Botão "Enviar Tamplate"
        try {
          logs.push(
            window.utilitarios.log('info', 'Tentando botão central...'),
          );
          const botaoEnviarTamplate = await window.utilitarios.esperarElemento(
            seletores.beetalk.botoes.enviarTamplate,
            3000,
          );
          await window.utilitarios.clicarElemento(botaoEnviarTamplate, 800);
          logs.push(window.utilitarios.log('sucesso', 'Botão central clicado'));
          tamplatesAberto = true;
        } catch (erroTentativa1) {
          logs.push(
            window.utilitarios.log(
              'info',
              'Botão central não encontrado, tentando alternativa...',
            ),
          );
        }

        //botao tamplate rapido
        if (!tamplatesAberto) {
          try {
            logs.push(
              window.utilitarios.log('info', 'Tentando quick-messages...'),
            );
            const tampleteRapido = await window.utilitarios.esperarElemento(
              seletores.beetalk.botoes.tamplateRapido,
              3000,
            );
            console.log(tampleteRapido);
            window.utilitarios.ativarEventosElementos(tampleteRapido);
            tamplatesAberto = true;
          } catch (erroTentativa2) {
            throw new Error(
              'Nenhum botão de template encontrado (center-button ou quick-messages)',
            );
          }
        }

        //pasta de tamplates
        await window.utilitarios.esperar(500);
        const pastaTamplate = await window.utilitarios.esperarElemento(
          seletores.beetalk.pastaTamplate('GW LIDER TEMPLATE'),
          5000,
        );
        await window.utilitarios.clicarElemento(pastaTamplate, 800);
        logs.push(
          window.utilitarios.log('sucesso', 'Pasta GW LIDER TEMPLATE aberta'),
        );

        await window.utilitarios.esperar(500);
        const botaoTamplate = await window.utilitarios.esperarElemento(
          seletores.beetalk.botaoTamplate('a0EU6000003BVunMAG'),
          5000,
        );
        await window.utilitarios.clicarElemento(botaoTamplate, 1000);
        logs.push(
          window.utilitarios.log(
            'sucesso',
            'Template SAUDACAO GW 2 selecionado',
          ),
        );

        await window.utilitarios.esperar(800);

        const campo1 = await window.utilitarios.esperarElemento(
          seletores.beetalk.campo(1),
          5000,
        );
        campo1.value = primeiroNome + ' ';
        window.utilitarios.ativarEventosElementos(campo1);
        await window.utilitarios.esperar(200);
        logs.push(
          window.utilitarios.log(
            'sucesso',
            'Campo 1 preenchido: ' + primeiroNome,
          ),
        );

        const campo2 = await window.utilitarios.esperarElemento(
          seletores.beetalk.campo(2),
          5000,
        );
        campo2.value = operador;
        window.utilitarios.ativarEventosElementos(campo2);
        await window.utilitarios.esperar(200);
        logs.push(
          window.utilitarios.log('sucesso', 'Campo 2 preenchido: ' + operador),
        );

        const campo3 = await window.utilitarios.esperarElemento(
          seletores.beetalk.campo(3),
          5000,
        );
        campo3.value = modelo || 'HAVAL H6';
        window.utilitarios.ativarEventosElementos(campo3);
        await window.utilitarios.esperar(200);
        logs.push(
          window.utilitarios.log('sucesso', 'Campo 3 preenchido: ' + modelo),
        );

        const botaoEnviar = Array.from(
          document.querySelectorAll('button'),
        ).find((botao) => {
          return botao.textContent.includes('Enviar');
        });

        if (!botaoEnviar) {
          throw new Error('Botao Enviar nao encontrado');
        }

        await window.utilitarios.clicarElemento(botaoEnviar, 2000);
        logs.push(window.utilitarios.log('sucesso', 'Template enviado'));

        await window.utilitarios.esperar(5000);

        const menssagems = document.querySelectorAll(
          seletores.beetalk.menssagems,
        );
        const menssagemElemento = menssagems[menssagems.length - 1];
        const mensagem = menssagemElemento.textContent.trim();
        logs.push(window.utilitarios.log('sucesso', 'Mensagem capturada'));

        return mensagem;
      } catch (erro) {
        logs.push(
          window.utilitarios.log(
            'erro',
            `Erro ao enviar tamplate: ${erro.message} `,
          ),
        );
        throw erro;
      }
    },

    registrarTarefa: async function (menssagem, logs) {
      logs.push(window.utilitarios.log('info', 'Criando Tarefa...'));

      try {
        const botaoNovaTarefa = await window.utilitarios.esperarElemento(
          seletores.salesforce.botoes.novaTarefa,
          5000,
        );
        await window.utilitarios.clicarElemento(botaoNovaTarefa, 1500);
        logs.push(window.utilitarios.log('sucesso', 'Modal de tarefa aberto'));

        await window.utilitarios.esperar(1000);

        // Campo tipo
        await window.utilitarios.selecionarOpcaoCombobox(
          seletores.salesforce.comboboxes.tipoTarefa,
          seletores.salesforce.opcoes.menu,
          'Contato',
          logs,
          'Tipo',
        );
        await window.utilitarios.esperar(500);

        // Campo assunto
        await window.utilitarios.selecionarOpcaoCombobox(
          seletores.salesforce.comboboxes.assunto,
          seletores.salesforce.opcoes.padrao,
          'Primeiro Contato',
          logs,
          'Assunto',
        );
        await window.utilitarios.esperar(500);

        // Campo Data de Vencimento
        const InputData = await window.utilitarios.esperarElemento(
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
        window.utilitarios.ativarEventosElementos(InputData);

        await window.utilitarios.esperar(500);
        logs.push(
          window.utilitarios.log(
            'sucesso',
            'Data de vencimento: ' + dataFormatada,
          ),
        );

        // Campo Comentario da tarefa
        const textareaComentario = document.querySelector(
          seletores.salesforce.tarefa.textareaComentario,
        );

        if (!textareaComentario) {
          throw new Error(`Campo de comentarios não encontrado`);
        }

        textareaComentario.value = menssagem;
        window.utilitarios.ativarEventosElementos(textareaComentario);

        await window.utilitarios.esperar(300);

        logs.push(window.utilitarios.log('sucesso', 'Comentarios preenchidos'));

        // Check de conjunto de lembretes

        const secaoTarefa = await window.utilitarios.esperarElemento(
          seletores.salesforce.tarefa.secaoTarefa,
        );
        const checkboxLembrete = secaoTarefa.querySelectorAll(
          'lightning-input input[type="checkbox"]',
        );

        if (!checkboxLembrete) {
          if (checkboxLembrete.checked) {
            await window.utilitarios.clicarElemento(checkboxLembrete);
            logs.push(window.utilitarios.log('sucesso', 'Lembrete desmarcado'));
          } else {
            logs.push(
              window.utilitarios.log('info', 'Lembrete ja estava desmarcado'),
            );
          }
        } else {
          logs.push(
            window.utilitarios.log(
              'warning',
              'Checkbox de lembrete nao encontrado (nao critico)',
            ),
          );
        }

        await window.utilitarios.esperar(800);

        // Salvar Tarefa
        const botaoSalvarTarefa = document.querySelector(
          seletores.salesforce.botoes.salvarTarefa,
        );

        if (!botaoSalvarTarefa) {
          throw new Error('Botao Salvar nao encontrado');
        }

        await window.utilitarios.clicarElemento(botaoSalvarTarefa, 2000);
        logs.push(window.utilitarios.log('sucesso', 'tarefa Salva'));

        return true;
      } catch (erro) {
        logs.push(
          window.utilitarios.log(
            'erro',
            `Erro ao criar tarefa: ${erro.message}`,
          ),
        );
        throw erro;
      }
    },
  };

  console.log('✅ Utilitários carregados');
})();
