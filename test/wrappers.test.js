const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const rootDir = path.resolve(__dirname, '..');
const oxfmtBin = path.join(rootDir, 'bin', 'e7-oxfmt.cjs');
const oxlintBin = path.join(rootDir, 'bin', 'e7-oxlint.cjs');

test('e7-oxlint uses .oxlintrc.json with file arguments', (context) => {
  const fixture = createFixture(context, {
    rules: { 'no-console': 'error' },
    source: "console.log('rejected by the project config');\n",
  });

  const result = run(oxlintBin, ['example.js'], fixture);

  assert.notEqual(result.status, 0, output(result));
  assert.match(output(result), /no-console/);
});

test('e7-oxlint preserves an explicit --config override', (context) => {
  const fixture = createFixture(context, {
    rules: { 'no-console': 'error' },
    source: "console.log('allowed by the explicit config');\n",
  });
  fs.writeFileSync(
    path.join(fixture, 'custom.json'),
    JSON.stringify({
      extends: [path.join(rootDir, 'oxlint.json')],
      rules: { 'no-console': 'off' },
    }),
  );

  const result = run(oxlintBin, ['--config', 'custom.json', 'example.js'], fixture);

  assert.equal(result.status, 0, result.stderr);
});

test('e7-oxfmt applies Tailwind-aware Oxlint fixes', (context) => {
  const fixture = createFixture(context, {
    source: 'export const Example = () => <div className="p-[2px]" />;\n',
  });

  const result = run(oxfmtBin, [], fixture);

  assert.equal(result.status, 0, output(result));
  assert.match(fs.readFileSync(path.join(fixture, 'example.jsx'), 'utf8'), /className="p-0\.5"/);
});

test('e7-oxfmt fails on non-fixable Tailwind conflicts', (context) => {
  const fixture = createFixture(context, {
    source: 'export const Example = () => <div className="p-2 p-4" />;\n',
  });

  const result = run(oxfmtBin, [], fixture);

  assert.notEqual(result.status, 0);
  assert.match(output(result), /tailwindcss\(no-conflicting-classes\)/);
});

test('e7-oxfmt fails when warnings remain after fixes', (context) => {
  const fixture = createFixture(context, {
    rules: { 'no-await-in-loop': 'warn' },
    source: 'export async function process(items) { for (const item of items) { await item; } }\n',
  });

  const result = run(oxfmtBin, [], fixture);

  assert.notEqual(result.status, 0, output(result));
  assert.match(output(result), /no-await-in-loop/);
});

function createFixture(context, { rules = {}, source }) {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'e7-wrapper-'));
  context.after(() => fs.rmSync(fixture, { force: true, recursive: true }));
  const tailwindDir = path.dirname(
    require.resolve('tailwindcss/package.json', {
      paths: [path.dirname(require.resolve('oxlint-tailwindcss'))],
    }),
  );
  fs.mkdirSync(path.join(fixture, 'node_modules'));
  fs.symlinkSync(
    tailwindDir,
    path.join(fixture, 'node_modules', 'tailwindcss'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  fs.writeFileSync(path.join(fixture, 'styles.css'), "@import 'tailwindcss';\n");
  fs.writeFileSync(
    path.join(fixture, '.oxlintrc.json'),
    JSON.stringify({
      extends: [path.join(rootDir, 'oxlint.json')],
      ignorePatterns: ['node_modules/**'],
      settings: { tailwindcss: { entryPoint: 'styles.css' } },
      rules,
    }),
  );
  fs.writeFileSync(
    path.join(fixture, source.includes('<div') ? 'example.jsx' : 'example.js'),
    source,
  );
  return fixture;
}

function run(bin, args, cwd) {
  return spawnSync(process.execPath, [bin, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function output(result) {
  return `${result.stdout}\n${result.stderr}`;
}
