import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs}'],
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