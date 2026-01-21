import {
  log,
  esperar,
  esperarElemento,
  selecionarOpcaoCombobox,
  ativarEventosElementos,
  ativarModoEdicao,
  salvarDesativarModoEdicao,
  formatarNumeroTelefone,
} from '../ultilitarios/utilitarios.js';
import { seletores } from '../ultilitarios/seletores.js';

export const tratarLead = {
  nome: 'tratar Lead',

  async executar(configMarca, logs = []) {
    const { marca, categoria, classificacao = 'Cold' } = configMarca;
    logs.push(log('info', '📋 Tratando lead...'));

    try {
      await ativarModoEdicao(logs);

      const { primeiroNome, sobrenome } = await formatarNome(logs);

      const nomeFormatado = primeiroNome ? primeiroNome : sobrenome;

      const numeroTelefone = await preencherNumeroTelefone(logs);

      await preencherClassificacao(classificacao, logs);

      await preencherInputsInteresses(marca, categoria, logs);

      const modelo = await formatarModeloInteresse(logs);

      await salvarDesativarModoEdicao(logs);

      logs.push(log('sucess', '✅ Lead tratado com sucesso!'));

      return {
        sucesso: true,
        dadosLeads: {
          nomeFormatado,
          primeiroNome,
          sobrenome,
          numeroTelefone,
          modelo,
          classificacao,
        },
      };
    } catch (erro) {
      logs.push(log('sucess', '✅ Lead tratado com sucesso!'));
      throw erro;
    }
  },
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

export const preencherNumeroTelefone = async function (logs) {
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
      (inputCelular.value || '').trim() || (inputTelefone.value || '').trim();

    if (!numeroTelefone) {
      logs.push(log('alerta', 'Nenhum telefone encontrado'));
      return null;
    }

    numeroTelefone = formatarNumeroTelefone(numeroTelefone);

    inputCelular.value = numeroTelefone;
    ativarEventosElementos(inputCelular);
    await esperar(100);

    if (inputTelefone.value) {
      inputTelefone.value = '';
      ativarEventosElementos(inputTelefone);
    }

    logs.push(log('sucesso', `Telefone formatado: ${numeroTelefone}`));
    return numeroTelefone;
  } catch (erro) {
    logs.push(log('erro', `Erro ao formatar telefone: ${erro.message}`));
    throw erro;
  }
};

export const preencherClassificacao = async function (classificacao, logs) {
  logs.push(log('info', `Definindo classificação como ${classificacao}...`));

  try {
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.classificacao,
      seletores.salesforce.opcoes.padrao,
      classificacao,
      logs,
      'Classificação',
    );
    await esperar(300);

    logs.push(log('sucesso', `Classificação definida: ${classificacao}`));
    return true;
  } catch (erro) {
    logs.push(log('erro', `Erro ao definir classificação: ${erro.message}`));
    throw erro;
  }
};

export const preencherInputsInteresses = async function (
  marca,
  categoria,
  logs,
) {
  logs.push(log('info', 'Preenchendo campos de intedesse...'));

  try {
    //Selecionar Marca: GWM
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.marca,
      seletores.salesforce.opcoes.padrao,
      marca.toUpperCase(),
      logs,
      'Marca',
    );
    await esperar(500);

    // Categoria: Novos
    await selecionarOpcaoCombobox(
      seletores.salesforce.comboboxes.categoria,
      seletores.salesforce.opcoes.padrao,
      categoria || 'Novos',
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
