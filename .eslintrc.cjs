/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: 2023,
    sourceType: 'module'
  },
  env: {
    node: true,
    es2022: true,
    browser: true
  },
  extends: ['next/core-web-vitals', 'eslint:recommended', 'prettier'],
  rules: {
    'no-unused-vars': [
      'warn',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
    ]
  }
};

