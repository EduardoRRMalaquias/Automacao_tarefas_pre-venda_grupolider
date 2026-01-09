// webpack.config.js
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDev = argv.mode === 'development';

  return {
    mode: isDev ? 'development' : 'production',

    // Source maps para debug
    devtool: isDev ? 'inline-source-map' : false,

    // Entry points: onde começam os scripts
    entry: {
      content: './src/content.js',
      background: './src/background/background.js',
      popup: './src/popup/index.jsx',
    },

    // Output: onde salvar compilados
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
      clean: true, // Limpa dist/ antes de compilar
    },

    // Como processar cada tipo de arquivo
    module: {
      rules: [
        // JavaScript/JSX
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },

        // CSS
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },

    // Plugins
    plugins: [
      // Copia manifest.json para dist/
      new CopyPlugin({
        patterns: [
          {
            from: 'public/manifest.json',
            to: 'manifest.json',
            transform(content) {
              const manifest = JSON.parse(content);

              // Em dev, ajusta CSP
              if (isDev) {
                manifest.content_security_policy = {
                  extension_pages: "script-src 'self'; object-src 'self'",
                };
              }

              return JSON.stringify(manifest, null, 2);
            },
          },
          { from: 'public/icones', to: 'icons' },
        ],
      }),

      // Gera popup.html com script injetado
      new HtmlWebpackPlugin({
        template: './public/popup/popup.html',
        filename: 'popup/popup.html',
        chunks: ['popup'],
        inject: 'body',
      }),
    ],

    // Resolve
    resolve: {
      extensions: ['.js', '.jsx'],
      alias: {
        '@utilitarios': path.resolve(__dirname, 'src/utilitarios'),
        '@tarefasDiarias': path.resolve(__dirname, 'src/tarefasDiarias'),
        '@tarefasGenericas': path.resolve(__dirname, 'src/tarefasGenericas'),
        '@marcas': path.resolve(__dirname, 'src/marcas'),
        '@popup': path.resolve(__dirname, 'src/popup'),
      },
    },

    // Watch mode (recompila automaticamente)
    watch: isDev,
    watchOptions: {
      ignored: /node_modules/,
      aggregateTimeout: 300,
    },
  };
};
