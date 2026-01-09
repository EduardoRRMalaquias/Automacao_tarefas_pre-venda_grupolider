// babel.config.js
module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          chrome: '88', // Chrome 88+ (suporta Manifest V3)
        },
        modules: false, // Deixa Webpack gerenciar módulos
      },
    ],
    [
      '@babel/preset-react',
      {
        runtime: 'automatic', // Não precisa importar React em cada arquivo
      },
    ],
  ],
};
