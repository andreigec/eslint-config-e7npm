const js = require('@eslint/js');
const typescript = require('@typescript-eslint/eslint-plugin');
const parser = require('@typescript-eslint/parser');
const globals = require('globals');

/** @type {Array<import('eslint').Flat.Config>} */
const baseConfig = [
  // Ignore patterns
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

  // Base JS config
  js.configs.recommended,

  // Config for TypeScript files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        ecmaVersion: 2015,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2015,
        ...globals.node,
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
      // TypeScript rules
      '@typescript-eslint/array-type': ['error', { default: 'array' }],
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/ban-ts-ignore': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/indent': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/member-delimiter-style': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-object-literal-type-assertion': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      //'@typescript-eslint/no-unused-expressions': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
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

      // Core ESLint rules
      'class-methods-use-this': 'off',
      'object-shorthand': 'error',
      'no-alert': 'error',
      'no-await-in-loop': 'off',
      'no-console': 'warn',
      'no-mixed-operators': 'off',
      'no-restricted-globals': 'off',
      'no-undef': 'off',

      // Import rules
      'import/extensions': 'off',
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/prefer-default-export': 'off',

      // React rules
      'react/display-name': 'off',
      'react/jsx-curly-newline': 'off',
      'react/jsx-props-no-spreading': 'off',
      'react/jsx-wrap-multilines': 'off',
      'react/jsx-uses-react': 'error',
      'react/react-in-jsx-scope': 'off',
      'react/no-array-index-key': 'error',
      'react/no-unused-prop-types': 'off',
      'react/prop-types': 'off',
      'react/require-default-props': 'off',

      // React Hooks rules
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // Simple Import Sort rules
      'simple-import-sort/exports': 'error',
      'simple-import-sort/imports': 'error',

      // Prettier rules
      'prettier/prettier': [
        'error',
        {
          singleQuote: true,
          trailingComma: 'all',
        },
      ],

      // Padding line between statements
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

  // Config for JavaScript files
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
      ecmaVersion: 2015,
      sourceType: 'module',
     
      globals: {
        ...globals.browser,
        ...globals.es2015,
        ...globals.node,
      },
    },
  },

  // Config for the config file itself
  {
    files: ['eslint.config.js'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2015,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
];

module.exports = baseConfig;