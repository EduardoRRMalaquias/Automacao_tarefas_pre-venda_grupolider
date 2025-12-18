botaoRodarAutomacao.addEventListener("click", async function(){
    const operador = operadorInput.ariaValueMax.trim();

    if(!operador){
        exibirStatus("error", "Configure o nome do operador primeiro");
        return
    }


    try {
        exibirStatus("loading", "Executando automação...");
        desabilitarButões();
        limparLogs();

        const tabs = await chrome.tabs.query({active: true, currentWindow: true});
        const tab = tabs[0];

        //Verifica se esta na pagina do lead
        if(!tab.url.includes("lightning.force.com/lightning/r/Lead/")){
            exibirStatus("error", "Abra uma pagina de lead do Salesforce")
            habilitarButões();
            return;
        }

        //Verifica se scripts estão carregados e garaente que carreguem
        adicionarLog("info", "Verificando scripts...");
        const resultadoCarregamento = garantirCarregamentoScripts(tab.id);

        if(resultadoCarregamento.metodo === "injetado"){
            adicionarLog("info", "Scripts injetados dinamicamente");
        }else if(resultadoCarregamento.metodo === "recarregado"){
            adicionarLog("info", "Pagina foi recarregada");
        }else{
            adicionarLog("info", "Scripts ja estavam carregados");
        }

        adicionarLog("info", "Iniciando Automação...");

        const resposta = await chrome.tabs.sendMenssage(tab.id, {
            action: "rodasr-automação",
            marca: selectMarca.value,
            tarefa: selectTarefa.value,
        });

        if(response.sucesso){
            exibirStatus("sucess", "Automacao concluida com sucesso!");
            exibirLogs(response.logs);
            chrome.storage.local.set({ ultimosLogs: response.logs });

            setTimeout(async function () {
                try{
                    await chrome.tabs.remove(tab.id);
                }catch (erro){
                    console.log("Aba ja foi fechada");
                }
            }, 2000);

        }else{
            exibirStatus("error", "Erro: " + response.error);
            exibirLogs(response.logs || []);
        }
    } catch (error) {
        exibirStatus("error", "Erro: " + error.message);
        adicionarLog("error", error.message);
    }finally {
    enableButtons();
  }
})