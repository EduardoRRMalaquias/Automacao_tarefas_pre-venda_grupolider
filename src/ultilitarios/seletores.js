export const seletores = {
  // ========== SALESFORCE ==========
  salesforce: {
    // Botões de edição
    botoes: {
      editar: 'button.inline-edit-trigger[title*="Editar"]',
      salvarEdicao: 'lightning-button button[name="SaveEdit"]',
      novaTarefa: 'button[aria-label="Nova tarefa"]',
      salvarTarefa: "button.cuf-publisherShareButton",
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
      marca: 'button[role="combobox"][aria-label="Marca"]',
      categoria: 'button[role="combobox"][aria-label="Categoria"]',
      interesse: 'button[role="combobox"][aria-label="Interesse em"]',
      tipoTarefa: 'a[role="combobox"][aria-labelledby*="label"]',
      assunto: 'lightning-grouped-combobox [role="combobox"]',
    },

    // Opções de combobox
    opcoes: {
      padrao: 'lightning-base-combobox-item, [role="option"]',
      menu: ".uiMenuItem a",
    },

    // Task fields
    tarefa: {
      inputData: 'lightning-datepicker input[type="text"]',
      textareaComentario: 'textarea[role="textbox"]',
      checkboxLembrete: 'lightning-input input[type="checkbox"]',
      secaoTarefa:
        'fieldset[data-aura-class="forcePageBlockSection forcePageBlockSectionEdit"]',
    },
  },

  // ========== BEETALK (WhatsApp) ==========
  beetalk: {
    botoes: {
      enviarTamplate: "p.center-button",
      tamplateRapido: 'use[data-name="quick-messages"]',
      enviar: 'button:has-text("Enviar")', // Precisa ajustar
    },

    //Templates
    pastaTamplate: (idPasta) => `p[data-folder-name="${idPasta}"]`,
    botaoTamplate: (idTemplate) => `p[data-message-id="${idTemplate}"]`,

    // Campos do template
    campo: (fieldId) => `input[data-id="${fieldId}"]`,

    // Mensagens enviadas
    mensagems: 'p[data-id="message-text"]',
  },
};
