#!/usr/bin/env node

const { spawn } = require('node:child_process');

const pnpm = process.env.npm_execpath
  ? process.execPath
  : process.platform === 'win32'
    ? 'pnpm.cmd'
    : 'pnpm';
const pnpmArgsPrefix = process.env.npm_execpath ? [process.env.npm_execpath] : [];
const spawnOpts = { stdio: 'inherit' };

main();

async function main() {
  let failed = false;

  for (const script of ['knip', 'jscpd']) {
    failed = (await run(script)) !== 0 || failed;
  }

  if (failed) {
    process.exitCode = 1;
  }
}

function run(script) {
  console.log(`\n[min] ${script}`);

  return new Promise((resolve) => {
    const child = spawn(pnpm, [...pnpmArgsPrefix, 'run', script], spawnOpts);
    child.on('close', (code) => resolve(code ?? 1));
  });
}
