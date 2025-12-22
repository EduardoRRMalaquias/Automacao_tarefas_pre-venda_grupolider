// Gerenciador de Marcas

class GerenciadorMarcas {
    constructor(){
        this.marcas = new Map();
        this.tarefas = new Map();
    }

    cadastrarMarca(nomeMarca, configuracaoMarca){
        if (this.marcas.has(nomeMarca)){
            console.warn(`"Marca ${nomeMarca} ja registrada. Sobrescrevendo...`);
        }

        this.marcas.set(nomeMarca, configuracaoMarca);
        console.log(`Marca registrada:  ${nomeMarca}`);

        if(configuracaoMarca.tarefas){
            Object.entries(configuracaoMarca.tarefas).forEach(([nomeTarefa, configuracaoMarca]) => {
                const nomeTarefaMarca = `${nomeTarefa}: ${nomeMarca}`;

                this.tarefas.set(nomeTarefaMarca, {
                    ...configuracaoMarca,
                    nomeMarca,
                    nomeTarefa
                })
            })
        }
    };



    getMarca(nomeMarca){
        return this.marcas.get(nomeMarca) || null;
    }


    getTarefa(nomeMarca, nomeTarefa){
        const nomeTarefaMarca = `${nomeTarefa}: ${nomeMarca}`;

        return this.tarefas.get(nomeTarefaMarca) || null;
    }

    //Executar tarefa
    async executarTarefa(nomeMarca, nomeTarefa, contexto = {}){
        const tarefa = this.getTarefa(nomeMarca, nomeTarefa);

        if(!tarefa){
            throw new Error(`Tarefa ${nomeTarefa} não encontrada para a marca ${nomeMarca}`);
        };

        console.log(`Executando Tarefa ${nomeTarefa} da marca ${nomeMarca}...`);
        
        try {
            const resposta = await tarefa.executar(contexto);

            return{
                sucesso: true,
                nomeMarca,
                nomeTarefa,
                resposta
            };
        } catch (erro) {
            console.error(`Erro ao executar a tarefa ${nomeTarefa} da marca ${nomeMarca}: ${erro}`);
            return {
                sucesso: false,
                nomeMarca,
                nomeTarefa,
                erro: erro.message,
            };
        }

    };

    listarMarcas(){
        return [...this.marcas.keys()];
    }

    listarTarefasMarca(nomeMarca){
         const chaveMarca = `${nomeMarca}:`;

         return [...this.tarefas.keys()]
         .filter(chave => chave.startsWith(chaveMarca))
         .map(chave => chave.split(":")[1]);
    }
};


window.gerenciadorMarcas = new GerenciadorMarcas();

console.log("Gerenciador de Marcas inicializado");