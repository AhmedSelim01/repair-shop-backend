import js from '@eslint/js';
import globals from 'globals';
import importPlugin from 'eslint-plugin-import';

export default [
  js.configs.recommended,
  {
    plugins: {
      import: importPlugin
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2021
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      }
    },
    rules: {
      'no-console': 'off',
      'import/no-commonjs': 'error'
    }
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'coverage/'
    ]
  }
];