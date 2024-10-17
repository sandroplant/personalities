require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
      module: 'CommonJS',
      // Explicitly set the config file to the location of tsconfig.base.json
      tsconfig: './tsconfig.base.json',
  },
});

module.exports = require('./webpack.config.ts').default;
