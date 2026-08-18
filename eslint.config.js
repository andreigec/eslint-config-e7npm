const js = require('@eslint/js');
const globals = require('globals');

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
      // TypeScript is linted by Oxlint; ESLint handles JavaScript and JSX.
      '**/*.ts',
      '**/*.tsx',
      'cdk.out/**',
      '**/cdk.out/**',
    ],
  },

  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
  },

  js.configs.recommended,

  {
    files: ['**/*.js', '**/*.jsx'],
    ...js.configs.recommended,
    plugins: {
      react: require('eslint-plugin-react'),
      'react-hooks': require('eslint-plugin-react-hooks'),
      prettier: require('eslint-plugin-prettier'),
      'jsx-a11y': require('eslint-plugin-jsx-a11y'),
      import: require('eslint-plugin-import'),
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
