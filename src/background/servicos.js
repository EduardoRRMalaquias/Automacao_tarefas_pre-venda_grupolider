const esperar = (tempo) => {
  return new Promise((resolver) => {
    setTimeout(resolver, tempo);
  });
};

async function enviarLogPopup(tipo, menssagem) {
  try {
    const resposta = chrome.runtime.sendMessage({
      acao: 'logs-automacao',
      tipo: tipo,
      menssagem: menssagem,
    });
  } catch {}

  console.log(`[${tipo}] ${menssagem}`);
}

async function garantirCarregamentoScripts(idAba) {
  console.log(`🔍 Verificando scripts na aba ${idAba}...`);

  // Verifica se Script ja esta carregado
  try {
    const resposta = await chrome.tabs.sendMessage(idAba, { acao: 'ping' });

    if (resposta && resposta.pong) {
      console.log(`✅ Aba ${idAba}: Scripts já carregados`);
      return { metodo: 'carregado', sucesso: true };
    }
  } catch (erro) {
    console.log(`⚠️ Aba ${idAba}: Scripts não responderam ao ping`);
  }

  //Injetar Script na pagina
  try {
    console.log(`Aba ${idAba}: Injetando scripts...`);

    await chrome.scripting.executeScript({
      target: { tabId: idAba, allFrames: true },
      files: [
        'content/utilitarios.js',
        'content/marcas/gerenciadorMarcas.js',
        'content/marcas/gwm.js',
        'content/content.js',
      ],
    });

    await esperar(1000);

    const teste = await chrome.tabs.sendMessage(idAba, { acao: 'ping' });

    if (teste && teste.pong) {
      console.log(`✅ Aba ${idAba}: Scripts injetados com sucesso`);
      return { metodo: 'injetado', sucesso: true };
    }
  } catch (erro) {
    console.log(`⚠️ Aba ${idAba}: Injeção falhou - ${erro.message}`);
  }

  // Regarregar pagina
  console.log(`Aba ${idAba}: Recarregando pagina...`);
  await chrome.tabs.reload(idAba);
  await esperar(4000);

  try {
    const teste = await chrome.tabs.sendMessage(idAba, { acao: 'ping' });

    if (teste && teste.pong) {
      console.log(`✅ Aba ${idAba}: Scripts recarregada com sucesso`);
      return { metodo: 'recarregar', sucesso: true };
    }
  } catch (erro) {
    console.error(`❌ Aba ${idAba}: Todas estratégias falharam`);
    throw new Error('Não foi possível carregar scripts');
  }
}

export async function processarAba(idAba, marca, tarefa) {
  console.log(`\n=== PROCESSANDO ABA ${idAba} ===`);

  try {
    enviarLogPopup('info', `Processando aba ${idAba}...`);

    const carregamento = await garantirCarregamentoScripts(idAba);
    enviarLogPopup('info', `Scripts: ${carregamento.metodo}`);

    console.log(`→ Aba ${idAba}: Enviando comando de automação...`);

    const resposta = await chrome.tabs.sendMessage(idAba, {
      acao: 'rodar-automacao',
      marca,
      tarefa,
    });

    if (resposta && resposta.sucesso) {
      console.log(`✅ Aba ${idAba}: Automação concluída`);
      enviarLogPopup('sucesso', `✓ Aba ${idAba} processada`);

      if (resposta.logs && resposta.logs.length > 0) {
        resposta.logs.forEach((log) => {
          enviarLogPopup(log.tipo, log.menssagem);
        });
      }

      //tenta fechar aba
      try {
        await chrome.tabs.remove(idAba);
        console.log(`🗑️ Aba ${idAba} fechada`);
        enviarLogPopup('info', `Aba ${idAba} fechada`);
      } catch (erro) {
        console.log(`⚠️ Não foi possível fechar aba ${idAba}`);
      }

      return {
        sucesso: true,
        idAba,
        logs: resposta.logs,
      };
    } else {
      console.error(`❌ Aba ${idAba}: Automação falhou - ${resposta?.erro}`);
      enviarLogPopup(
        'erro',
        `✗ Aba ${idAba}: ${resposta?.erro || 'Erro desconhecido'}`,
      );

      return {
        sucesso: false,
        idAba,
        error: resposta?.erro || 'Erro desconhecido',
      };
    }
  } catch (erro) {
    console.error(`❌ Aba ${idAba}: Exceção - ${erro.message}`);
    enviarLogPopup('error', `✗ Aba ${idAba}: ${erro.message}`);

    return {
      sucesso: false,
      idAba,
      erro: erro.message,
    };
  }
}

export async function processarTodasAbas(marca, tarefa) {
  console.log('\n========================================');
  console.log('🚀 INICIANDO PROCESSAMENTO EM LOTE');
  console.log('========================================\n');

  enviarLogPopup('info', 'Bucando abas dd Lead...');

  const abas = await chrome.tabs.query({
    url: 'https://grupolider.lightning.force.com/lightning/r/Lead/*',
  });

  if (abas.length === 0) {
    console.log('⚠️ Nenhuma aba de Lead encontrada');
    enviarLogPopup('error', 'Nenhuma aba de Lead aberta');
    return {
      sucesso: false,
      erro: 'Nenuma aba encontrada',
    };
  }

  console.log(`📊 Encontradas ${abas.length} aba(s) de Lead`);
  enviarLogPopup('info', `Encontradas ${abas.length} aba(s) de Lead`);

  // contadores
  let contagemSucessos = 0;
  let contagemFalhas = 0;
  const resultados = [];

  for (let i = 0; i < abas.length; i++) {
    const aba = abas[i];

    console.log(`\n--- ABA ${i + 1}/${abas.length} ---`);
    console.log(`ID: ${aba.id}`);
    console.log(`Título: ${aba.title}`);

    enviarLogPopup('info', `[${i + 1}/${abas.length}] ${aba.title}`);

    //processa aba
    const resultado = await processarAba(aba.id, marca, tarefa);
    resultados.push(resultado);

    if (resultado.sucesso) {
      contagemSucessos++;
    } else {
      contagemFalhas++;
    }

    await esperar(3000);
  }

  // Finalizar
  console.log('\n========================================');
  console.log('✅ PROCESSAMENTO CONCLUÍDO');
  console.log(`Sucessos: ${contagemSucessos}`);
  console.log(`Falhas: ${contagemFalhas}`);
  console.log('========================================\n');

  enviarLogPopup(
    'sucesso',
    `Concluído! ${contagemSucessos} sucesso(s), ${contagemFalhas} falha(s)`,
  );

  return {
    sucesso: true,
    totalAbas: abas.length,
    contagemSucessos,
    contagemFalhas,
    resultados,
  };
}
