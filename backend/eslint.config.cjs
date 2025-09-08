const js = require('@eslint/js');
const tseslint = require('typescript-eslint');

/** @type {import("eslint").Linter.FlatConfig[]} */
module.exports = [
  // فایل‌هایی که باید نادیده گرفته شوند
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },

  // قوانین پیشنهادی برای JS
  js.configs.recommended,

  // قوانین پیشنهادی برای TypeScript
  ...tseslint.configs.recommended,

  // تنظیمات اختصاصی پروژه
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      'no-console': 'off',
    },
  },
];
