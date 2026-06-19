#!/usr/bin/env node

const { runOxcTool } = require('./run-oxc-tool.cjs');

runOxcTool({
  binName: 'oxlint',
  packageName: 'oxlint',
  configName: 'oxlint.json',
});
