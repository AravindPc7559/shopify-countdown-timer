import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: [
      'node_modules/',
      'web/node_modules/',
      'web/frontend/node_modules/',
      'extensions/*/node_modules/',
      'dist/',
      'build/',
      '*.min.js',
      'coverage/',
      '.shopify/',
      'web/database.sqlite',
      '*.log',
    ],
  },
];
