require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'CommonJS',
    baseUrl: './',
    paths: {
      '*': ['node_modules/*'], // Removed the absolute path
    },
  },
});

module.exports = require('./webpack.config.ts').default;
