// Configuracao da Marca GWM - ARQUIVO COMPLETO CORRIGIDO

(function () {
  "use strict";

  // Utilitarios Globais
  const sleep = function (ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  };

  const log = function (type, message) {
    const prefix =
      {
        info: "📋",
        success: "✅",
        error: "❌",
        warning: "⚠️",
      }[type] || "📋";
    console.log(prefix + " " + message);
    return { type: type, message: message };
  };

  const waitForElement = function (selector, timeout) {
    timeout = timeout || 10000;
    return new Promise(function (resolve, reject) {
      const el = document.querySelector(selector);
      if (el) return resolve(el);

      const observer = new MutationObserver(function () {
        const e = document.querySelector(selector);
        if (e) {
          observer.disconnect();
          resolve(e);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(function () {
        observer.disconnect();
        reject(new Error("Timeout ao esperar: " + selector));
      }, timeout);
    });
  };

  const fireInputEvents = function (element) {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
    element.dispatchEvent(new Event("keyup", { bubbles: true }));
  };

  const clickElement = async function (element, waitMs) {
    waitMs = waitMs || 300;
    element.click();
    await sleep(waitMs);
  };

  // Funcoes de Manipulacao do Lead

  async function activateEditMode(logs) {
    logs.push(log("info", "Ativando modo de edicao..."));

    try {
      const editButton = await waitForElement(
        'button.inline-edit-trigger[title*="Editar"]',
        5000
      );
      await clickElement(editButton);
      logs.push(log("success", "Modo de edicao ativado"));
      await sleep(1000);
      return true;
    } catch (error) {
      logs.push(log("error", "Falha ao ativar edicao: " + error.message));
      return false;
    }
  }

  async function saveDesactivateEditMode(logs) {
    logs.push(
      log("info", "Salvando alterações e desativando modo de edicao...")
    );

    try {
      const saveEditButton = await waitForElement(
        'lightning-button button[name="SaveEdit"]',
        5000
      );
      await clickElement(saveEditButton);
      logs.push(
        log("success", "Alterações salvas e modo de edicao desativado")
      );
      await sleep(1000);
      return true;
    } catch (error) {
      logs.push(
        log(
          "error",
          "Falha ao salvar alterações ou desativar edicao: " + error.message
        )
      );
      return false;
    }
  }

  async function formatLeadName(logs) {
    logs.push(log("info", "Formatando nome do lead..."));

    try {
      const firstNameInput = document.querySelector('input[name="firstName"]');
      const lastNameInput = document.querySelector('input[name="lastName"]');

      if (!firstNameInput || !lastNameInput) {
        throw new Error("Campos de nome nao encontrados");
      }

      let firstName = (firstNameInput.value || "").trim();
      let lastName = (lastNameInput.value || "").trim();

      const partsFirstName = firstName.split(/\s+/);
      const partsLastName = lastName.split(/\s+/);

      if (partsFirstName.length > 1 || partsLastName.length > 1) {
        if (firstName && !lastName) {
          firstName = partsFirstName[0];
          lastName = partsFirstName.slice(1).join(" ");
        }

        if (!firstName && lastName) {
          firstName = partsLastName[0];
          lastName = partsLastName.slice(1).join(" ");
        }
      } else {
        lastName = partsFirstName[0] + partsLastName[0];
      }

      firstName = firstName.toUpperCase();
      lastName = lastName.toUpperCase();

      firstNameInput.value = firstName;
      fireInputEvents(firstNameInput);
      await sleep(100);

      lastNameInput.value = lastName;
      fireInputEvents(lastNameInput);
      await sleep(100);

      logs.push(
        log("success", "Nome formatado: " + firstName + " " + lastName)
      );
      return { firstName: firstName, lastName: lastName };
    } catch (error) {
      logs.push(log("error", "Erro ao formatar nome: " + error.message));
      throw error;
    }
  }

  async function formatPhoneNumber(logs) {
    logs.push(log("info", "Formatando telefone..."));

    try {
      const mobileInput = document.querySelector('input[name="MobilePhone"]');
      const phoneInput = document.querySelector('input[name="Phone"]');

      if (!mobileInput || !phoneInput) {
        throw new Error("Campos de telefone nao encontrados");
      }

      let phoneNumber =
        (mobileInput.value || "").trim() || (phoneInput.value || "").trim();

      if (!phoneNumber) {
        logs.push(log("warning", "Nenhum telefone encontrado"));
        return null;
      }

      phoneNumber = phoneNumber.replace(/^\+?55/, "").replace(/\D/g, '').trim();

      mobileInput.value = phoneNumber;
      fireInputEvents(mobileInput);
      await sleep(100);

      if (phoneInput.value) {
        phoneInput.value = "";
        fireInputEvents(phoneInput);
      }

      logs.push(log("success", "Telefone formatado: " + phoneNumber));
      return phoneNumber;
    } catch (error) {
      logs.push(log("error", "Erro ao formatar telefone: " + error.message));
      throw error;
    }
  }

  async function selectComboboxOption(
    buttonSelector,
    optionText,
    logs,
    labelText
  ) {
    try {
      const button = await waitForElement(buttonSelector, 5000);
      await clickElement(button, 500);

      await sleep(500);

      const options = Array.from(
        document.querySelectorAll(
          'lightning-base-combobox-item, [role="option"]'
        )
      );
      const option = options.find(function (opt) {
        const text = (opt.textContent || "").trim().toUpperCase();
        return text === optionText.toUpperCase();
      });

      if (!option) {
        throw new Error('Opcao "' + optionText + '" nao encontrada');
      }

      await clickElement(option);
      logs.push(log("success", labelText + " selecionado: " + optionText));
      return true;
    } catch (error) {
      logs.push(
        log("error", "Erro ao selecionar " + labelText + ": " + error.message)
      );
      throw error;
    }
  }

  async function fillInterestFields(logs) {
    logs.push(log("info", "Preenchendo campos de interesse..."));

    try {
      // Marca: GWM
      await selectComboboxOption(
        'button[role="combobox"][aria-label="Marca"]',
        "GWM",
        logs,
        "Marca"
      );
      await sleep(500);

      // Categoria: Novos - CORRIGIDO
      await selectComboboxOption(
        'button[role="combobox"][aria-label="Categoria"]',
        "Novos",
        logs,
        "Categoria"
      );
      await sleep(500);

      // Interesse em: Carros
      await selectComboboxOption(
        'button[role="combobox"][aria-label="Interesse em"]',
        "Carros",
        logs,
        "Interesse em"
      );
      await sleep(500);

      logs.push(log("success", "Campos de interesse preenchidos"));
      return true;
    } catch (error) {
      logs.push(log("error", "Erro ao preencher interesse: " + error.message));
      throw error;
    }
  }

  async function formatModeloInteresse(logs) {
    logs.push(log("info", "Formatando modelo de interesse..."));

    try {
      const modeloTextarea = document.querySelector(
        'textarea[id*="input-"][maxlength="255"]'
      );

      if (!modeloTextarea) {
        logs.push(log("warning", "Campo Modelo interesse nao encontrado"));
        return null;
      }

      let modelo = (modeloTextarea.value || "").trim();

      if (!modelo) {
        logs.push(log("warning", "Modelo interesse vazio"));
        return null;
      }

      modelo = modelo.replace(/_/g, ' ').toUpperCase();

      modeloTextarea.value = modelo;
      fireInputEvents(modeloTextarea);
      await sleep(100);

      logs.push(log("success", "Modelo formatado: " + modelo));
      return modelo;
    } catch (error) {
      logs.push(log("error", "Erro ao formatar modelo: " + error.message));
      throw error;
    }
  }

  async function sendWhatsAppTemplate(firstName, modelo, operador, logs) {
    logs.push(log("info", "Enviando template WhatsApp..."));

    try {
      const selectTemplateBtn = await waitForElement("p.center-button", 5000);
      await clickElement(selectTemplateBtn, 800);
      logs.push(log("success", "Botao de template clicado"));

      await sleep(500);
      const folderBtn = await waitForElement(
        'p[data-folder-name="GW LIDER TEMPLATE"]',
        5000
      );
      await clickElement(folderBtn, 800);
      logs.push(log("success", "Pasta GW LIDER TEMPLATE aberta"));

      await sleep(500);
      const templateBtn = await waitForElement(
        'p[data-message-id="a0EU6000003BVunMAG"]',
        5000
      );
      await clickElement(templateBtn, 1000);
      logs.push(log("success", "Template SAUDACAO GW 2 selecionado"));

      await sleep(800);

      const campo1 = await waitForElement('input[data-id="1"]', 5000);
      campo1.value = firstName + " ";
      fireInputEvents(campo1);
      await sleep(200);
      logs.push(log("success", "Campo 1 preenchido: " + firstName));

      const campo2 = await waitForElement('input[data-id="2"]', 5000);
      campo2.value = operador;
      fireInputEvents(campo2);
      await sleep(200);
      logs.push(log("success", "Campo 2 preenchido: " + operador));

      const campo3 = await waitForElement('input[data-id="3"]', 5000);
      campo3.value = modelo || "HAVAL H6";
      fireInputEvents(campo3);
      await sleep(200);
      logs.push(log("success", "Campo 3 preenchido: " + (modelo || "VEICULO")));

      const sendBtn = Array.from(document.querySelectorAll("button")).find(
        function (btn) {
          return btn.textContent.includes("Enviar");
        }
      );

      if (!sendBtn) {
        throw new Error("Botao Enviar nao encontrado");
      }

      await clickElement(sendBtn, 2000);
      logs.push(log("success", "Template enviado"));

      await sleep(1500);
      const messageEl = await waitForElement('p[data-id="message-text"]', 8000);
      const message = messageEl.textContent.trim();
      logs.push(log("success", "Mensagem capturada"));

      return message;
    } catch (error) {
      logs.push(log("error", "Erro ao enviar template: " + error.message));
      throw error;
    }
  }

  async function createTask(message, logs) {
    logs.push(log("info", "Criando tarefa..."));

    try {
      const newTaskBtn = await waitForElement(
        'button[aria-label="Nova tarefa"]',
        5000
      );
      await clickElement(newTaskBtn, 1500);
      logs.push(log("success", "Modal de tarefa aberto"));

      await sleep(1000);

      const tipoCombobox = await waitForElement(
        'a[role="combobox"][aria-labelledby*="label"]',
        5000
      );
      await clickElement(tipoCombobox, 500);

      const tipoOption = Array.from(
        document.querySelectorAll(".uiMenuItem a")
      ).find(function (a) {
        return (a.textContent || "").trim() === "Contato";
      });

      if (tipoOption) {
        await clickElement(tipoOption, 500);
        logs.push(log("success", "Tipo selecionado: Contato"));
      }

      await sleep(500);
      const assuntoInput = document.querySelector(
        'lightning-grouped-combobox [role="combobox"]'
      );

      if (assuntoInput) {
        assuntoInput.value = "Primeiro Contato";
        fireInputEvents(assuntoInput);
        await sleep(500);

        const assuntoOption = Array.from(
          document.querySelectorAll("lightning-base-combobox-item")
        ).find(function (item) {
          return item.textContent.includes("Primeiro Contato");
        });

        if (assuntoOption) {
          await clickElement(assuntoOption, 500);
          logs.push(log("success", "Assunto selecionado: Primeiro Contato"));
        }
      }

      await sleep(500);
      const dateInput = document.querySelector(
        'lightning-datepicker input[type="text"]'
      );

      if (dateInput) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, "0");
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const yyyy = today.getFullYear();
        const dateStr = dd + "/" + mm + "/" + yyyy;

        dateInput.value = dateStr;
        fireInputEvents(dateInput);
        await sleep(300);
        logs.push(log("success", "Data de vencimento: " + dateStr));
      }

      await sleep(500);
      const commentTextarea = document.querySelector(
        'textarea[role="textbox"]'
      );

      if (commentTextarea) {
        commentTextarea.value = message;
        fireInputEvents(commentTextarea);
        await sleep(300);
        logs.push(log("success", "Comentarios preenchidos"));
      }

      await sleep(500);
      const reminderLightning = Array.from(
        document.querySelectorAll("lightning-input")
      ).find(function (el) {
        const label = el.querySelector(
          'span.slds-form-element__label, span[part="label"]'
        );
        return label && label.textContent.includes("Conjunto de lembretes");
      });

      if (reminderLightning) {
        const reminderCheckbox = reminderLightning.querySelector(
          'input[type="checkbox"]'
        );

        if (reminderCheckbox && reminderCheckbox.checked) {
          await clickElement(reminderCheckbox, 300);
          logs.push(log("success", "Lembrete desmarcado"));
        } else if (reminderCheckbox) {
          logs.push(log("info", "Lembrete ja estava desmarcado"));
        }
      } else {
        logs.push(
          log("warning", "Checkbox de lembrete nao encontrado (nao critico)")
        );
      }

      await sleep(800);
      const saveBtn = document.querySelector("button.cuf-publisherShareButton");

      if (!saveBtn) {
        throw new Error("Botao Salvar nao encontrado");
      }

      await clickElement(saveBtn, 2000);
      logs.push(log("success", "Tarefa salva"));

      return true;
    } catch (error) {
      logs.push(log("error", "Erro ao criar tarefa: " + error.message));
      throw error;
    }
  }

  // Tarefa Principal: Primeiro Contato

  const primeiroContatoGWM = {
    name: "Primeiro Contato GWM",
    description: "Formata lead, envia template e cria tarefa",

    execute: async function (context) {
      const logs = [];
      logs.push(log("info", "Iniciando automacao: Primeiro Contato GWM"));

      try {
        const operadorData = await new Promise(function (resolve) {
          chrome.storage.local.get("operador", resolve);
        });
        const operador = (operadorData.operador || "Operador").split(" ")[0];
        logs.push(log("info", "Operador: " + operador));

        await activateEditMode(logs);
        const nameResult = await formatLeadName(logs);
        const firstName = nameResult.firstName
          ? nameResult.firstName
          : nameResult.lastName;
        await formatPhoneNumber(logs);
        await fillInterestFields(logs);
        const modelo = await formatModeloInteresse(logs);
        await saveDesactivateEditMode(logs);
        const message = await sendWhatsAppTemplate(
          firstName,
          modelo,
          operador,
          logs
        );
        await createTask(message, logs);

        logs.push(log("success", "Automacao concluida com sucesso!"));

        return {
          success: true,
          logs: logs,
        };
      } catch (error) {
        logs.push(log("error", "Falha na automacao: " + error.message));
        return {
          success: false,
          error: error.message,
          logs: logs,
        };
      }
    },
  };

  // Registro da Marca GWM

  if (window.brandManager) {
    window.brandManager.registerBrand("gwm", {
      name: "GWM",
      description: "Great Wall Motors",
      tasks: {
        "primeiro-contato": primeiroContatoGWM,
      },
    });

    console.log("Marca GWM registrada com sucesso");
  } else {
    console.error("BrandManager nao encontrado!");
  }
})();
