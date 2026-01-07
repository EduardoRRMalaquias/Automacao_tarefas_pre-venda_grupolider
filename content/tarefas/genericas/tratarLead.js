const ativarModoEdicao = window.utilitarios.ativarModoEdicao;
const salvarDesativarModoEdicao = window.utilitarios.salvarDesativarModoEdicao;
const formatarNome = window.utilitarios.formatarNome;
const formatarNumeroTelefone = window.utilitarios.formatarNumeroTelefone;
const preencherInputsInteresses = window.utilitarios.preencherInputsInteresses;
const formatarModeloInteresse = window.utilitarios.formatarModeloInteresse;

export const tratarLead = {
  nome: 'Tratar Lead',

  async execute(config, logs) {
    logs.push(window.utilitarios.log('info', '📋 Tratando lead...'));

    try {
      await ativarModoEdicao(logs);

      const { primeiroNome, sobrenome } = await formatarNome(logs);

      const nomeFormatado = primeiroNome ? primeiroNome : sobrenome;

      const numeroTelefone = await formatarNumeroTelefone(logs);
      await preencherInputsInteresses(logs);

      const modelo = await formatarModeloInteresse(logs);

      await salvarDesativarModoEdicao(logs);

      logs.push(
        window.utilitarios.log('success', '✅ Lead tratado com sucesso!'),
      );

      return {
        successo: true,
        cliente: {
          nomeFormatado,
          primeiroNome,
          sobrenome,
          numeroTelefone,
          modelo,
        },
      };
    } catch (erro) {
      logs.push(
        window.utilitarios.log('success', '✅ Lead tratado com sucesso!'),
      );
      throw erro;
    }
  },
};
