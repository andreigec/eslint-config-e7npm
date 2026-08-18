#!/usr/bin/env node

const { getProjectConfigPath, runOxcTool } = require('./run-oxc-tool');

const cliArgs = process.argv.length > 2 ? process.argv.slice(2) : ['--deny-warnings', '.'];

runOxcTool({
  binName: 'oxlint',
  packageName: 'oxlint',
  configName: 'oxlint.json',
  configPath: getProjectConfigPath('oxlint.json'),
  args: cliArgs.includes('--type-aware') ? cliArgs : ['--type-aware', ...cliArgs],
});
