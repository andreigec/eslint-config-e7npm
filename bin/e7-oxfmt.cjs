#!/usr/bin/env node

const { runOxcTool } = require('./run-oxc-tool.cjs');

runOxcTool({
  binName: 'oxfmt',
  packageName: 'oxfmt',
  configName: 'oxfmt.json',
});
