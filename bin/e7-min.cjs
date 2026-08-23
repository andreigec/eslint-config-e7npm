#!/usr/bin/env node

const { spawn } = require('node:child_process');
const path = require('node:path');

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

function run(tool) {
  console.log(`\n[min] ${tool}`);

  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(__dirname, `e7-${tool}.cjs`)], spawnOpts);
    child.on('close', (code) => resolve(code ?? 1));
  });
}
