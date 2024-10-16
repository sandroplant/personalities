// client/webpack.config.js

require('ts-node').register({
    transpileOnly: true,
    compilerOptions: {
      module: 'CommonJS',
    },
  });
  
  module.exports = require('./webpack.config.ts').default;
  