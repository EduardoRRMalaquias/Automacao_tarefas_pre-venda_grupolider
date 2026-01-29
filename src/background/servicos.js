import { TIMEOUTS } from '../ultilitarios/utilitarios';

const esperar = (tempo) => {
  return new Promise((resolver) => {
    setTimeout(resolver, tempo);
  });
};

async function enviarLogPopup(tipo, mensagem) {
  try {
    chrome.runtime.sendMessage({
      acao: 'logs-automacao',
      tipo: tipo,
      mensagem: mensagem,
    });
  } catch (erro) {
    // Popup pode estar fechado, ignora erro
  }

  console.log(`[${tipo}] ${mensagem}`);
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
      files: ['content.bundle.js'],
    });

    await esperar(TIMEOUTS.ULTRA_RAPIDO);

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
  await esperar(TIMEOUTS.SISTEMA);

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

export async function processarAba(
  idAba,
  marca,
  tarefa,
  tipoEncaminhamento = null,
) {
  console.log(`\n=== PROCESSANDO ABA ${idAba} ===`);

  try {
    const infoAba = await chrome.tabs.get(idAba);
    const idJanela = infoAba.windowId;

    const infoJanela = await chrome.windows.get(idJanela);

    if (infoJanela.state === 'minimized') {
      console.log(`📍 Janela ${idJanela} está minimizada, restaurando...`);
      await chrome.windows.update(idJanela, {
        state: 'normal',
        focused: false,
      });
      await esperar(TIMEOUTS.TRANSICAO);
    }

    await chrome.tabs.update(idAba, { active: true });

    enviarLogPopup('info', `Processando aba ${idAba}...`);

    const carregamento = await garantirCarregamentoScripts(idAba);
    enviarLogPopup('info', `Scripts: ${carregamento.metodo}`);

    console.log(`→ Aba ${idAba}: Enviando comando de automação...`);

    const resposta = await chrome.tabs.sendMessage(idAba, {
      acao: 'rodar-automacao',
      marca,
      tarefa,
      tipoEncaminhamento,
    });

    if (resposta && resposta.sucesso) {
      console.log(`✅ Aba ${idAba}: Automação concluída`);
      enviarLogPopup('sucesso', `✓ Aba ${idAba} processada`);

      if (resposta.logs && resposta.logs.length > 0) {
        resposta.logs.forEach((log) => {
          enviarLogPopup(log.tipo, log.mensagem);
        });
      }

      await esperar(TIMEOUTS.RAPIDO);

      if (tarefa === 'encaminhar-lead') {
        try {
          const abas = await chrome.tabs.query({ currentWindow: true });

          const indiceAtual = abas.findIndex((aba) => aba.id === idAba);

          if (indiceAtual !== -1 && abas.length > 1) {
            const proximoIndice = (indiceAtual + 1) % abas.length;
            const proximaAba = abas[proximoIndice];

            await chrome.tabs.update(proximaAba.id, { active: true });

            console.log(`➡️ Mudou da aba ${idAba} para a aba ${proximaAba.id}`);
            enviarLogPopup('info', `Avançou para a próxima aba`);
          } else {
            console.log('⚠️ Apenas uma aba aberta ou aba não encontrada.');
          }
        } catch (erro) {
          console.log(`⚠️ Erro ao tentar mudar de aba:`, erro);
        }
      } else {
        //fechar aba
        try {
          await chrome.tabs.remove(idAba);
          console.log(`🗑️ Aba ${idAba} fechada`);
          enviarLogPopup('info', `Aba ${idAba} fechada`);
        } catch (erro) {
          console.log(`⚠️ Não foi possível fechar aba ${idAba}`);
        }
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
    console.error(`❌ Aba ${idAba}: Erro de exceção - ${erro.message}`);
    enviarLogPopup('error', `✗ Aba ${idAba}: ${erro.message}`);

    return {
      sucesso: false,
      idAba,
      erro: erro.message,
    };
  }
}

export async function processarTodasAbas(
  marca,
  tarefa,
  tipoEncaminhamento = null,
) {
  console.log('\n========================================');
  console.log('🚀 INICIANDO PROCESSAMENTO EM LOTE');
  console.log('========================================\n');

  const [abaAtiva] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!abaAtiva) {
    console.error('❌ Nenhuma aba ativa encontrada');
    enviarLogPopup('erro', 'Nenhuma janela ativa detectada');
    return {
      sucesso: false,
      erro: 'Nenhuma janela ativa',
    };
  }

  const idJanela = abaAtiva.windowId;

  console.log(`📍 Processando abas da janela ${idJanela}`);
  enviarLogPopup('info', 'Buscando abas de Lead na janela atual...');

  const abas = await chrome.tabs.query({
    windowId: idJanela,
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

  console.log(
    `📊 Encontradas ${abas.length} aba(s) de Lead na janela ${idJanela}`,
  );
  enviarLogPopup(
    'info',
    `Encontradas ${abas.length} aba(s) de Lead nesta janela`,
  );

  // contadores
  const resultados = { sucesso: [], falhas: [], total: abas.length };

  for (let i = 0; i < abas.length; i++) {
    const aba = abas[i];

    console.log(`\n--- ABA ${i + 1}/${abas.length} ---`);
    console.log(`ID: ${aba.id}`);
    console.log(`Título: ${aba.title}`);

    enviarLogPopup('info', `[${i + 1}/${abas.length}] ${aba.title}`);

    //processa aba
    try {
      const resultado = await processarAba(
        aba.id,
        marca,
        tarefa,
        tipoEncaminhamento,
      );

      if (resultado.sucesso) {
        resultados.sucesso.push(resultado);
      } else {
        resultados.falhas.push(resultado);
      }
    } catch (error) {
      console.error(`❌ Erro crítico na aba ${aba.id}:`, erro);

      resultados.falhas.push({
        sucesso: false,
        idAba: aba.id,
        erro: `Erro crítico: ${erro.message}`,
        stack: erro.stack,
      });

      enviarLogPopup('erro', `✗ Aba ${aba.id}: Erro crítico - continuando...`);
    }

    await esperar(TIMEOUTS.RAPIDO);
  }

  const contagemSucessos = resultados.sucesso.length;
  const contagemFalhas = resultados.falhas.length;

  // Finalizar
  console.log('\n========================================');
  console.log('✅ PROCESSAMENTO CONCLUÍDO');
  console.log(`Sucessos: ${contagemSucessos}/${resultados.total}`);
  console.log(`Falhas: ${contagemFalhas}/${resultados.total}`);
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

export async function processarLeadsEmLote(leads, marca) {
  console.log('\n════════════════════════════════════════');
  console.log('🚀 INICIANDO CADASTRO EM LOTE');
  console.log(`📊 Total de leads: ${leads.length}`);
  console.log(`🏢 Marca: ${marca}`);
  console.log('════════════════════════════════════════\n');

  enviarLogPopup('info', `Iniciando cadastro de ${leads.length} leads...`);

  const [abaAtiva] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });

  if (!abaAtiva) {
    const erro = 'Nenhuma janela ativa encontrada';
    console.error(`❌ ${erro}`);
    enviarLogPopup('erro', erro);
    throw new Error(erro);
  }

  const idJanela = abaAtiva.windowId;
  console.log(`📍 Usando janela ${idJanela}`);

  let abasSalesforce = await chrome.tabs.query({
    url: 'https://grupolider.lightning.force.com/*',
  });

  const abasLeads = abasSalesforce.filter((aba) =>
    aba.url.includes('/lightning/o/Lead/'),
  );

  const abaNovoLead = abasLeads.find((aba) =>
    aba.url.includes('/lightning/o/Lead/new'),
  );

  let idAba;

  if (abaNovoLead) {
    idAba = abaNovoLead.id;
    console.log(`✓ Usando aba existente em /o/Lead/new: ${idAba}`);

    await chrome.tabs.update(idAba, { active: true });
  } else if (abasLeads.length > 0) {
    const temAbaLeadsAtiva = abasLeads.find((aba) => aba.active);

    if (temAbaLeadsAtiva) {
      idAba = temAbaLeadsAtiva.id;
      console.log(`✓ Navegando aba ativa ${idAba} para /o/Lead/new`);

      await chrome.tabs.update(idAba, {
        url: 'https://grupolider.lightning.force.com/lightning/o/Lead/new',
      });
    } else {
      idAba = abasLeads[0].id;
      console.log(`✓ Navegando aba existente ${idAba} para /o/Lead/new`);

      await chrome.tabs.update(idAba, {
        url: 'https://grupolider.lightning.force.com/lightning/o/Lead/new',
        active: true,
      });
    }
  } else {
    console.log(`✓ Criando nova aba na janela ${idJanela}`);

    const aba = await chrome.tabs.create({
      windowId: idJanela,
      url: 'https://grupolider.lightning.force.com/lightning/o/Lead/new',
      active: true,
    });
    idAba = aba.id;
    console.log(`✓ Nova aba criada: ${idAba}`);
  }

  await esperar(TIMEOUTS.SISTEMA);

  const resultados = {
    total: leads.length,
    processados: 0,
    sucessos: 0,
    falhas: 0,
    detalhes: [],
  };

  for (let index = 0; index < leads.length; index++) {
    await garantirCarregamentoScripts(idAba);

    const lead = leads[index];
    const numeroLead = index + 1;

    console.log(`\n─────────────────────────────────────`);
    console.log(`📝 LEAD ${numeroLead}/${leads.length}`);
    console.log(`Nome: ${lead.primeiroNome || ''} ${lead.sobrenome}`);
    console.log(`─────────────────────────────────────`);

    const nomeExibicao = lead.primeiroNome
      ? `${lead.primeiroNome} ${lead.sobrenome}`
      : lead.sobrenome;

    enviarLogPopup('info', `[${numeroLead}/${leads.length}] ${nomeExibicao}`);

    try {
      const infoAba = await chrome.tabs.get(idAba);

      if (!infoAba.url.includes('/o/Lead/new')) {
        console.log('⚠ Não está em /o/Lead/new, navegando...');

        await chrome.tabs.update(idAba, {
          url: 'https://grupolider.lightning.force.com/lightning/o/Lead/new',
        });

        await esperar(TIMEOUTS.LONGO);
        await garantirCarregamentoScripts(idAba);
      }

      console.log('→ Enviando dados do lead...');

      const resposta = await chrome.tabs.sendMessage(idAba, {
        acao: 'cadastrar-um-lead',
        dadosLead: lead,
        marca: marca,
      });

      if (resposta && resposta.sucesso) {
        console.log(`✅ Lead ${numeroLead} cadastrado: ${resposta.leadUrl}`);

        resultados.sucessos++;
        resultados.detalhes.push({
          lead: lead,
          sucesso: true,
          leadUrl: resposta.leadUrl,
          logs: resposta.logs,
        });

        enviarLogPopup('sucesso', `✓ ${nomeExibicao} cadastrado`);

        await esperar(TIMEOUTS.RAPIDO);

        console.log('← Voltando para /o/Lead/new...');

        await chrome.tabs.update(idAba, {
          url: 'https://grupolider.lightning.force.com/lightning/o/Lead/new',
        });

        await esperar(TIMEOUTS.LONGO);
      } else {
        console.error(
          `❌ Falha no lead ${numeroLead}: ${resposta?.erro || 'Sem resposta'}`,
        );

        resultados.falhas++;
        resultados.detalhes.push({
          lead: lead,
          sucesso: false,
          erro: resposta?.erro || 'Sem resposta do content script',
          logs: resposta?.logs || [],
        });

        enviarLogPopup(
          'erro',
          `✗ ${nomeExibicao}: ${resposta?.erro || 'Erro desconhecido'}`,
        );

        await chrome.tabs.update(idAba, {
          url: 'https://grupolider.lightning.force.com/lightning/o/Lead/new',
        });
        await esperar(TIMEOUTS.LONGO);
      }
    } catch (erro) {
      console.error(`❌ Erro crítico no lead ${numeroLead}:`, erro);

      resultados.falhas++;
      resultados.detalhes.push({
        lead: lead,
        sucesso: false,
        erro: `Erro crítico: ${erro.message}`,
        logs: [],
      });

      enviarLogPopup('erro', `✗ Erro crítico: ${erro.message}`);

      try {
        await chrome.tabs.update(idAba, {
          url: 'https://grupolider.lightning.force.com/lightning/o/Lead/new',
        });
        await esperar(TIMEOUTS.LONGO);
      } catch (errorRecuperacao) {
        console.error('❌ Não foi possível recuperar. Abortando lote.');
        enviarLogPopup('erro', 'Processamento abortado - erro irrecuperável');
        break;
      }
    }

    resultados.processados = numeroLead;
    enviarAtualizacaoProgresso(resultados);
  }

  console.log('\n════════════════════════════════════════');
  console.log('✅ CADASTRO EM LOTE CONCLUÍDO');
  console.log(`📊 Total: ${resultados.total}`);
  console.log(`✅ Sucessos: ${resultados.sucessos}`);
  console.log(`❌ Falhas: ${resultados.falhas}`);
  console.log('════════════════════════════════════════\n');

  enviarLogPopup(
    'sucesso',
    `Concluido! ${resultados.sucessos} sucessos, ${resultados.falhas} falhas`,
  );

  return resultados;
}

async function enviarAtualizacaoProgresso(resultados) {
  try {
    await chrome.runtime.sendMessage({
      acao: 'atualizar-progresso',
      progresso: {
        processados: resultados.processados,
        total: resultados.total,
        sucessos: resultados.sucessos,
        falhas: resultados.falhas,
        percentual: Math.round(
          (resultados.processados / resultados.total) * 100,
        ),
      },
    });
  } catch (e) {
    // Ignora se popup fechado
  }
}
