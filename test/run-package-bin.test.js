const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const test = require('node:test');

test(
  'prepends tool binaries when Windows inherits an uppercase PATH',
  { skip: process.platform !== 'win32' },
  () => {
    const rootDir = path.resolve(__dirname, '..');
    const helper = path.join(rootDir, 'bin', 'run-package-bin.js');
    const inheritedPath = path.join(rootDir, 'test');
    const env = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.toUpperCase() !== 'PATH'),
    );
    env.PATH = inheritedPath;
    const source = `const { runPackageBin } = require(${JSON.stringify(helper)}); process.exit(runPackageBin({ binName: process.execPath, args: ['-e', 'console.log(process.env.PATH)'], exit: false }));`;

    const result = spawnSync(process.execPath, ['-e', source], { env, encoding: 'utf8' });

    assert.equal(result.status, 0, result.stderr);
    assert.equal(
      result.stdout.trim(),
      `${path.join(rootDir, 'node_modules', '.bin')}${path.delimiter}${inheritedPath}`,
    );
  },
);
