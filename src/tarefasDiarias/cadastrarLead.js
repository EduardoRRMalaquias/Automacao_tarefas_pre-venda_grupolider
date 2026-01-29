import {
  log,
  esperar,
  esperarElemento,
  clicarElemento,
  ativarEventosElementos,
  selecionarOpcaoCombobox,
  TIMEOUTS,
} from '../ultilitarios/utilitarios';
import { seletores } from '../ultilitarios/seletores';

export const cadastrarLeads = {
  nome: 'Cadastrar Leads',
  descricao: 'Preenche formulário de novo lead no Salesforce',

  async executar(dadosLead) {
    const logs = [];

    try {
      const nomeCompleto = dadosLead.primeiroNome
        ? `${dadosLead.primeiroNome} ${dadosLead.sobrenome}`
        : dadosLead.sobrenome;

      logs.push(log('info', `📝 Cadastrando: ${nomeCompleto}`));

      validarContexto();
      logs.push(log('sucesso', 'Contexto validado'));

      await aguardarFormulario(logs);
      await preencherFormulario(dadosLead, logs);
      const leadUrl = await salvar(logs);

      logs.push(log('sucesso', `✅ Lead cadastrado: ${leadUrl}`));

      return {
        sucesso: true,
        leadUrl,
        dadosLead,
        logs,
        dataHora: new Date().toISOString(),
      };
    } catch (erro) {
      logs.push(log('erro', `❌ Falha: ${erro.message}`));

      return {
        sucesso: false,
        erro: erro.message,
        dadosLead,
        logs,
        timestamp: new Date().toISOString(),
      };
    }
  },
};

const validarContexto = () => {
  const url = window.location.href;

  if (!url.includes('/lightning/o/Lead/new')) {
    throw new Error(`Contexto inválido. Esperado: /o/Lead/new | Atual: ${url}`);
  }

  return true;
};

const aguardarFormulario = async (logs) => {
  logs.push(log('info', '⏳ Aguardando formulário...'));

  await esperarElemento(seletores.salesforce.inputs.sobrenome, 5000);
  await esperar(TIMEOUTS.ULTRA_RAPIDO);

  logs.push(log('sucesso', '✓ Formulário pronto'));
};

const preencherFormulario = async (dadosLead, logs) => {
  logs.push(log('info', '📝 Preenchendo campos...'));

  if (dadosLead.primeiroNome) {
    await preencherInput(
      seletores.salesforce.inputs.primeiroNome,
      dadosLead.primeiroNome,
      'Primeiro Nome',
      logs,
      false,
    );
  }

  //Sobrenome
  await preencherInput(
    seletores.salesforce.inputs.sobrenome,
    dadosLead.sobrenome,
    'Sobrenome',
    logs,
    true,
  );

  //Celular
  await preencherInput(
    seletores.salesforce.inputs.celular,
    dadosLead.celular,
    'Celular',
    logs,
    true,
  );

  if (dadosLead.email) {
    await preencherInput(
      seletores.salesforce.novoLead.inputs.email,
      dadosLead.email,
      'Email',
      logs,
      true,
    );
  }

  if (dadosLead.cpf) {
    await preencherInput(
      seletores.salesforce.novoLead.inputs.cpf,
      dadosLead.cpf,
      'CPF',
      logs,
      false,
    );
  }

  if (dadosLead.classificacao) {
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.classificacao,
      seletores.salesforce.opcoes.padrao,
      dadosLead.classificacao,
      logs,
      'Classificação',
    );
    await esperar(TIMEOUTS.CLIQUE);
  }

  // Marca
  await selecionarOpcaoCombobox(
    seletores.salesforce.comboboxes.marca,
    seletores.salesforce.opcoes.padrao,
    dadosLead.marca,
    logs,
    'Marca',
  );
  await esperar(TIMEOUTS.DIGITACAO);

  //Categoria: ex: Novos, seminovos
  await selecionarOpcaoCombobox(
    seletores.salesforce.comboboxes.categoria,
    seletores.salesforce.opcoes.padrao,
    dadosLead.categoria,
    logs,
    'Categoria',
  );
  await esperar(TIMEOUTS.CLIQUE);

  //Interesse em: ex: Carros, motos
  await selecionarOpcaoCombobox(
    seletores.salesforce.comboboxes.interesse,
    seletores.salesforce.opcoes.padrao,
    dadosLead.interesseEm,
    logs,
    'Interesse em',
  );
  await esperar(TIMEOUTS.CLIQUE);

  // MODELO
  if (dadosLead.modelo) {
    await preencherInput(
      seletores.salesforce.inputs.modelo,
      dadosLead.modelo,
      'Modelo',
      logs,
      false,
    );
  }

  //Origem do Lead
  await selecionarOpcaoCombobox(
    seletores.salesforce.novoLead.comboboxes.origem,
    seletores.salesforce.opcoes.padrao,
    dadosLead.origemLead,
    logs,
    'Origem do Lead',
  );
  await esperar(TIMEOUTS.ULTRA_RAPIDO);

  //Conssecionaria
  await preencherInput(
    seletores.salesforce.novoLead.comboboxes.conssecionaria,
    dadosLead.concessionaria,
    'Concessionária',
    logs,
    true,
  );
  await esperar(TIMEOUTS.ULTRA_RAPIDO);

  await selecionarOpcaoCombobox(
    seletores.salesforce.novoLead.comboboxes.conssecionaria,
    seletores.salesforce.opcoes.padrao,
    dadosLead.concessionaria,
    logs,
    'Concessionária',
  );
  await esperar(TIMEOUTS.CLIQUE);

  logs.push(log('sucesso', '✓ Todos os campos preenchidos'));
};

const preencherInput = async (
  seletor,
  valor,
  label,
  logs,
  obrigatorio = false,
) => {
  try {
    const tempoEspera = obrigatorio ? TIMEOUTS.SISTEMA : TIMEOUTS.ULTRA_RAPIDO;
    const input = await esperarElemento(seletor, tempoEspera);

    input.value = valor;
    ativarEventosElementos(input);
    await esperar(TIMEOUTS.DIGITACAO);

    logs.push(log('sucesso', `  ✓ ${label}: ${valor}`));
  } catch (erro) {
    if (obrigatorio) {
      throw new Error(`Campo obrigatorio "${label}" não encontrado`);
    }
    logs.push(log('alerta', `  ⚠ ${label}: não encontrado (ignorado)`));
  }
};

const salvar = async (logs) => {
  logs.push(log('info', '💾 Salvando...'));

  const botaoSalvar = await esperarElemento(
    seletores.salesforce.botoes.salvarEdicao,
    TIMEOUTS.SISTEMA,
  );

  await clicarElemento(botaoSalvar);
  logs.push(log('info', '  Aguardando salvamento...'));

  await esperar(TIMEOUTS.SISTEMA);

  console.log(window.location.href);
  if (
    window.location.href.includes(
      'https://grupolider.lightning.force.com/lightning/r/',
    )
  ) {
    const leadUrl = window.location.href;
    logs.push(log('sucesso', `  URL capturada: ${leadUrl}`));
    return leadUrl;
  }

  logs.push(log('info', '  Aguardando mais...'));
  await esperar(TIMEOUTS.SISTEMA);

  if (
    window.location.href.includes(
      'https://grupolider.lightning.force.com/lightning/r/',
    )
  ) {
    const leadUrl = window.location.href;
    logs.push(log('sucesso', `  URL capturada (2ª tentativa): ${leadUrl}`));
    return leadUrl;
  }

  throw new Error('Timeout ao capturar URL do lead');
};

console.log('✅ Tarefa cadastrarLeads carregada');
