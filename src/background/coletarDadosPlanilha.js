import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export async function coletarDadosPlanilha(arquivo) {
  const extensao = arquivo.name.split('.').pop().toLowerCase();

  if (extensao === 'csv') {
    return coletarCSV(arquivo);
  }

  if (['xlsx', 'xls'].includes(extensao)) {
    return coletarExcel(arquivo);
  }

  throw new Error(`Formato não suportado: ${extensao}. Use CSV ou Excel.`);
}

async function coletarCSV(arquivo) {
  return new Promise((resolver, rejeitar) => {
    Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,

      complete: (resultados) => {
        if (resultados.errors.length > 0) {
          console.warn('⚠️ Avisos ao parsear CSV:', resultados.errors);
        }

        const resultado = processarLinhas(resultados.data);
        resolver(resultado);
      },

      error: (error) => {
        rejeitar(new Error(`Erro ao ler CSV ${error.menssage}`));
      },
    });
  });
}

async function coletarExcel(arquivo) {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();

    leitor.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const planilhas = XLSX.read(data, { type: 'array' });

        const primeiraAba = planilhas.SheetNames[0];
        const planilha = planilhas.Sheets[primeiraAba];

        const dadosJson = XLSX.utils.sheet_to_json(planilha);

        const resultado = processarLinhas(dadosJson);
        resolver(resultado);
      } catch (erro) {
        rejeitar(new Error(`Erro ao ler Excel: ${erro.message}`));
      }
    };

    leitor.readAsArrayBuffer(arquivo);
  });
}

function processarLinhas(linhas) {
  const leadsValidos = [];
  const errosEncontrados = [];

  linhas.forEach((linha, index) => {
    const numeroLinha = index + 2;

    try {
      const lead = mapearLead(linha, numeroLinha);
      const validacao = validarlead(lead);

      if (validacao.valido) {
        leadsValidos.push(lead);
      } else {
        errosEncontrados.push({
          linha: numeroLinha,
          erros: validacao.erros,
          dados: linha,
        });
      }
    } catch (erro) {
      errosEncontrados.push({
        linha: numeroLinha,
        erros: `Erro ao processar: ${erro.message}`,
        dados: linha,
      });
    }
  });

  return {
    leads: leadsValidos,
    erros: errosEncontrados,
    total: linhas.length,
    validos: leadsValidos.length,
    invalidos: errosEncontrados.length,
  };
}

function mapearLead(linha, numeroLinha) {
  const getCampo = (chavePrincipal, alternativas = []) => {
    if (linha[chavePrincipal]) {
      return linha[chavePrincipal];
    }

    for (const alternativa of alternativas) {
      if (linha[alternativa]) return linha[alternativa];
    }

    const chaves = Object.keys(linha);
    const chaveEncontrada = chaves.find(
      (chave) => chave.toLowerCase().trim() === chavePrincipal.toLowerCase(),
    );

    return chaveEncontrada ? linha[chaveEncontrada] : null;
  };

  return {
    primeiroNome: getCampo('Primeiro nome', ['Primeiro Nome', 'Nome']),
    sobrenome: getCampo('Sobrenome'),
    celular: getCampo('Celular', ['Telefone', 'Fone']),
    email: getCampo('Email', ['E-mail', 'e-mail']),
    classificacao: getCampo('Classificação', ['Rating', 'Status']),
    cpf: getCampo('CPF'),
    marca: getCampo('Marca'),
    categoria: getCampo('Categoria'),
    modelo: getCampo('Modelo de interesse', ['Modelo', 'Veículo']),
    interesseEm: getCampo('Interesse em', ['Interesse', 'Tipo']),
    origemLead: getCampo('Origem do lead', ['Origem']),
    concessionaria: getCampo('Conssecionaria', ['Concessionária', 'Loja']),

    _linhaPlanilha: numeroLinha,
  };
}

function validarlead(lead) {
  const erros = [];

  if (!lead.sobrenome?.trim()) {
    erros.push('Sobrenome ausente');
  }

  if (!lead.celular?.trim()) {
    erros.push('Celular ausente');
  }

  if (!lead.marca?.trim()) {
    erros.push('Marca ausente');
  }

  if (!lead.categoria?.trim()) {
    erros.push('Categoria ausente');
  }

  if (!lead.interesseEm?.trim()) {
    erros.push('Interesse em ausente');
  }

  if (!lead.origemLead?.trim()) {
    erros.push('Origem do lead ausente');
  }

  if (!lead.concessionaria?.trim()) {
    erros.push('Concessionária ausente');
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
