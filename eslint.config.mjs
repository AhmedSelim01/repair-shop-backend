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
        ...globals.node,       // Replaces 'env: { node: true }'
        ...globals.es2021,     // Replaces 'env: { es2021: true }'
        ...globals.mocha       // For test files
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'script'   // For CommonJS support
      }
    },
    rules: {
      'no-console': 'off',
      'import/no-commonjs': 'off',
      'no-undef': 'error'
    }
  },
  {
    files: ['**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.mocha
      }
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