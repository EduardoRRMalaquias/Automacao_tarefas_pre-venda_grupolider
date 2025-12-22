(function(){
    'use sctrict';

    console.log("🚀 automação de Leads GrupoLider - Content Script Carregado")

    //Verifica se esta em uma pagina de lead
    function isPaginaLead(){
        return window.location.href.includes("lightning.force.com/lightning/r/Lead/");
    }


    //recebe mensagens enviadas do popup
    chrome.runtime.onMessage.addListener(async (requisicao, data, enviarResposta) =>{
        console.log("📨 Mensagem recebida:", requisicao);

        if(requisicao.acao === "rodar-automacao"){
            try {
                const resposta = await rodarAutomacao(requisicao);

                if(resposta.sucesso){
                    console.log("✅ Automação finalizada:", resposta);
                    enviarResposta(resposta);
                }

            } catch (error) {
                console.error("❌ Erro na automação:", error);
                enviarResposta({
                    sucesso: false,
                    error: error.message,
                    logs: [
                        {
                            type: "erro",
                            message: error.message,
                        },
                    ],
                });
            }
            
            return true; // Mantém o canal aberto
        }


        if(requisicao.acao === 'checar-pagina'){
            enviarResposta({
                isPaginaLead: isPaginaLead(),
                url: window.location.href,
            });
            return false;
        }

        enviarResposta({error: "Ação desconhecida"});
        return false;
    });

    //Processar automação
    async function rodarAutomacao(requisicao) {
        const {marca, tarefa} = requisicao;

        //Validações
        if(!isPaginaLead()){
            return {
                sucesso: false,
                error: "Não está em uma página de Lead",
                logs: [
                    {
                        type: "erro",
                        message: "Esta página não é uma página de Lead válida",
                    },
                ],
            };
        }

        if(!window.gerenciadorMarcas){
            return {
                sucesso: false,
                error: "gerenciadorMarcas não inicializado",
                logs: [
                    {
                        type: "erro",
                        message: "Gerenciador de marcas não está disponível",
                    },
                ],
            };
        }

        //Verifica se a marca existe
        const configuracaoMarca = window.gerenciadorMarcas.getMarca(marca);
        if(!configuracaoMarca){
            return {
                sucesso: false,
                error: `Marca "${marca}" não encontrada`,
                logs: [
                    {
                        type: "erro",
                        message: `Marca ${marca} não está registrada no sistema`,
                    }
                ]
            }
        }

         //Verifica se a marca existe
        const configuracaoTarefa = window.gerenciadorMarcas.getTarefa(marca, tarefa);
        if(!configuracaoTarefa){
            return {
                sucesso: false,
                error: `tarefa "${tarefa}" não encontrada para a marca ${marca}`,
                logs: [
                    {
                        type: "erro",
                        message: `Tarefa ${tarefa} não disponível para ${marca}`,
                    }
                ]
            }
        }

        // Executa a tarefa
        console.log(`🎯 Executando tarefa ${tarefa} da marca ${marca}`);

        try {
            const resposta = await window.gerenciadorMarcas.executarTarefa(marca, tarefa, {
                url: window.location.href,
                dataHora: new Date().toLocaleDateString('pt-BR'),
            });

            return {
                sucesso: resposta.sucesso,
                logs: resposta.resposta?.logs || [],
                error: resposta.error,
            }
        } catch (erro) {
            console.error("❌ Erro ao executar tarefa:", erro);
            return {
                sucesso: false,
                error: error.menssage,
                logs: [
                    {
                        type: "erro",
                        message: `Erro fatal: ${error.message}`,
                    },
                ],
            };
        }
    }

    // Aguarda gerenciadorMarcas estar disponível
    let tentativas = 0;
    const maximoTentativas = 50;

    const aguardarGerenciador = setInterval(() => {
        tentativas++

        if(window.gerenciadorMarcas){
            clearInterval(aguardarGerenciador);
            console.log("✅ gerenciadorMarcas detectado e pronto");

            // Sinalizar que o content script está pronto
            try {
                const reposta = chrome.runtime.sendMessage({
                    acao: "content-script-pronto",
                    url: window.location.href,
                })
            } catch (error) {
                
            }
        };

        if(tentativas >= maximoTentativas){
            clearInterval(aguardarGerenciador);
            console.error("❌ gerenciadorMarcas não foi carregado após 5 segundos");
        }
    }, 100)

    console.log("✅ Content Script inicializado e aguardando comandos");
})()