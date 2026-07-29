#!/usr/bin/env node

const { runOxcTool } = require('./run-oxc-tool');

runOxcTool({
  binName: 'oxlint',
  packageName: 'oxlint',
  configName: 'oxlint.json',
  args: process.argv.length > 2 ? process.argv.slice(2) : ['--deny-warnings', '.'],
});
