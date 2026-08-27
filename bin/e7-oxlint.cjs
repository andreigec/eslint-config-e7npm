#!/usr/bin/env node

const { runOxcTool } = require('./run-oxc-tool');

const cliArgs = process.argv.length > 2 ? process.argv.slice(2) : ['--deny-warnings', '.'];

runOxcTool({
  binName: 'oxlint',
  packageName: 'oxlint',
  configName: 'oxlint.json',
  projectConfigNames: ['.oxlintrc.json', 'oxlint.json'],
  args: cliArgs.includes('--type-aware') ? cliArgs : ['--type-aware', ...cliArgs],
});
