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
        sourceType: 'script' // Changed from 'module' to 'script' for CommonJS
      }
    },
    rules: {
      'no-console': 'off',
      'import/no-commonjs': 'off', // Disabled CommonJS checks
      'no-undef': 'error'
    }
  },
  {
    files: ['**/*.test.js'],
    env: {
      mocha: true
    },
    rules: {
      'no-undef': 'off'
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