import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    ignores: ['node_modules/', 'frontend/', 'database.sqlite', '*.log', 'dist/', 'build/'],
  },
];
