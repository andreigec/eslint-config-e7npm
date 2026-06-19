#!/usr/bin/env node

const { runPackageBin } = require('./run-package-bin.cjs');

const args = process.argv.slice(2);
const defaultArgs = [
  '--min-lines',
  '8',
  '--threshold',
  '0',
  'packages',
  '--pattern',
  '**/*.{ts,tsx}',
  '--ignore',
  '**/dist/**',
];

runPackageBin({
  binName: 'jscpd',
  packageName: 'jscpd',
  args: args.length === 0 ? defaultArgs : args,
});
