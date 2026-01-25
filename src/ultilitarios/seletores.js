export const seletores = {
  // ========== SALESFORCE ==========
  salesforce: {
    // Botões de edição
    botoes: {
      editar: 'button.inline-edit-trigger[title*="Editar"]',
      salvarEdicao: 'lightning-button button[name="SaveEdit"]',
      novaTarefa: 'button[aria-label="Nova tarefa"]',
      salvarTarefa: 'button.cuf-publisherShareButton',
      abrirModalTentativa:
        'button[title*="Salvar Status"][title*="Tentativa"]:not([style*="margin"])',
      salvarTentativa:
        'footer button[title*="Salvar Status"][title*="Tentativa"]:not([style*="margin"])',
    },

    // Inputs de Lead
    inputs: {
      primeiroNome: 'input[name="firstName"]',
      sobrenome: 'input[name="lastName"]',
      celular: 'input[name="MobilePhone"]',
      telefone: 'input[name="Phone"]',
      modelo: 'textarea[id*="input-"][maxlength="255"]',
    },

    // Comboboxes
    comboboxes: {
      classificacao: 'button[role="combobox"][aria-label="Classificação"]',
      marca: 'button[role="combobox"][aria-label="Marca"]',
      categoria: 'button[role="combobox"][aria-label="Categoria"]',
      interesse: 'button[role="combobox"][aria-label="Interesse em"]',
      tipoTarefa: 'a[role="combobox"][aria-labelledby*="label"]',
      assunto: 'lightning-grouped-combobox [role="combobox"]',
      status: 'button[role="combobox"][aria-label="Status"]',
      tipoContato: 'button[role="combobox"][aria-label="Tipo de tentativa"]',
    },

    // Opções de combobox
    opcoes: {
      padrao: 'lightning-base-combobox-item, [role="option"]',
      menu: '.uiMenuItem a',
    },

    // Task fields
    tarefa: {
      inputData: 'lightning-datepicker input[type="text"]',
      textareaComentario: 'textarea[role="textbox"]',
      checkboxLembrete: 'lightning-input input[type="checkbox"]',
      secaoTarefa:
        'fieldset[data-aura-class="forcePageBlockSection forcePageBlockSectionEdit"]',
    },

    novoLead: {
      inputs: {
        email: 'input[name="Email"]',
        cpf: 'input[name="CPF__c"]',
      },

      comboboxes: {
        origem: 'button[role="combobox"][aria-label="Origem do lead"]',
        conssecionaria: 'input[placeholder="Pesquisar Contas…"]',
      },
    },
  },

  // ========== BEETALK (WhatsApp) ==========
  beetalk: {
    botoes: {
      enviartemplate: 'p.center-button',
      templateRapido: 'use[data-name="quick-messages"]',
      enviar: 'button:has-text("Enviar")', // Precisa ajustar
    },

    //Templates
    pastatemplate: (idPasta) => `p[data-folder-name="${idPasta}"]`,
    botaotemplate: (idTemplate) => `p[data-message-id="${idTemplate}"]`,

    // Campos do template
    campo: (fieldId) => `input[data-id="${fieldId}"]`,

    // Mensagens enviadas
    mensagems: 'p[data-id="message-text"]',
  },
};
