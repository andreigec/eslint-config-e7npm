const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');
const globals = require('globals');
const nextPlugin = require('@next/eslint-plugin-next');

/** @type {Array<import('eslint').Flat.Config>} */
const baseConfig = [
  {
    ignores: [
      'build/**',
      '**/build/**',
      'dist/**',
      '**/dist/**',
      'node_modules/**',
      '**/node_modules/**',
      'cdk.out/**',
      '**/cdk.out/**',
    ],
  },

   js.configs.recommended,

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2021,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        React: true,
        JSX: true,
        NodeJS: true
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react': require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'prettier': require('eslint-plugin-prettier'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
      'import': require('eslint-plugin-import'),
      'simple-import-sort': require('eslint-plugin-simple-import-sort'),
      '@next/next': nextPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: ['packages/*/tsconfig.json', './tsconfig.json'],
        },
        node: {
          extensions: ['.mjs', '.json', '.js', '.jsx', '.ts', '.tsx', '.d.ts'],
        },
      },
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      'no-unused-expressions': 'error',
      'no-return-await': 'error',
      'no-await-in-loop': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error'],
      '@typescript-eslint/prefer-nullish-coalescing': [
        'warn',
        {
          ignorePrimitives: {
            string: true,
            boolean: true,
          },
          ignoreMixedLogicalExpressions: true,
        },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      'no-console': 'warn',
      'object-shorthand': 'error',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/prefer-default-export': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/no-array-index-key': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
        },
      ],
      'padding-line-between-statements': [
        'off',
        { blankLine: 'never', prev: ['import'], next: ['import'] },
        { blankLine: 'never', prev: ['expression'], next: ['expression', 'multiline-expression'] },
        { blankLine: 'never', prev: ['singleline-const', 'singleline-let', 'singleline-var'], next: ['function', 'expression', 'const', 'let', 'var'] },
        { blankLine: 'always', prev: ['multiline-const', 'multiline-let', 'multiline-var'], next: ['function', 'expression', 'const', 'let', 'var', 'block-like'] },
        { blankLine: 'always', prev: ['multiline-expression'], next: ['expression', 'multiline-expression'] },
        { blankLine: 'always', prev: ['const', 'let', 'var'], next: ['return', 'block'] },
        { blankLine: 'always', prev: ['block-like'], next: ['const', 'let', 'var', 'block-like'] },
        { blankLine: 'always', prev: ['if'], next: ['if', 'expression'] },
        { blankLine: 'always', prev: ['*'], next: ['case', 'default'] },
      ],
    },
  },

  {
    files: ['**/*.js', '**/*.jsx'],
    ...js.configs.recommended,
    plugins: {
      'react': require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      'prettier': require('eslint-plugin-prettier'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
      'import': require('eslint-plugin-import'),
      'simple-import-sort': require('eslint-plugin-simple-import-sort'),
    },
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
  },
];

module.exports = baseConfig;