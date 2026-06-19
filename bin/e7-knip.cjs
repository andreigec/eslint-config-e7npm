#!/usr/bin/env node

const { runPackageBin } = require('./run-package-bin.cjs');

runPackageBin({
  binName: 'knip',
  packageName: 'knip',
  args: process.argv.slice(2),
});
