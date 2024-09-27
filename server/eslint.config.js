// /Users/aniavsa/Desktop/personalities/server/eslint.config.js

import globals from 'globals';
import pluginJs from '@eslint/js';
import tsEslintPlugin from '@typescript-eslint/eslint-plugin';
// Removed React-related imports
// import pluginReact from 'eslint-plugin-react';
import typescriptEslintParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    ignores: ['node_modules/**'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      parser: typescriptEslintParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: globals.browser
    },
    plugins: {
      '@typescript-eslint': tsEslintPlugin,
      import: importPlugin,
      prettier: prettierPlugin
      // Removed React plugin
      // react: pluginReact
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      // Removed React recommended rules
      // ...pluginReact.configs.recommended.rules,
      ...tsEslintPlugin.configs.recommended.rules,
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      '@typescript-eslint/no-var-requires': 'off',
      'no-undef': 'off',
      // Removed React-specific rules
      // 'react/prop-types': 'off',
      // 'react/react-in-jsx-scope': 'off',
      'import/extensions': [
        'error',
        'ignorePackages',
        {
          ts: 'always',
          tsx: 'always',
          js: 'always',
          jsx: 'always'
        }
      ],
      'import/no-extraneous-dependencies': [
        'error',
        {
          devDependencies: [
            '**/*.test.{js,jsx,ts,tsx}',
            '**/*.spec.{js,jsx,ts,tsx}',
            '**/eslint.config.js',
            '**/*.config.js',
            '**/*.config.cjs',
            '**/*.config.mjs',
            '**/scripts/**'
            // Removed '**/server/src/components/**' since components are moved
          ]
        }
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ]
    },
    settings: {
      // Removed React settings
      // react: {
      //   version: 'detect'
      // },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx']
        }
      }
    }
  },
  prettierConfig // Ensure prettierConfig is last to disable conflicting rules
];
