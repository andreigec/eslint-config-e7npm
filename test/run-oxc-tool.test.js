const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const { getOxcArgs } = require('../bin/run-oxc-tool');

test('uses a project .oxlintrc.json when arguments are supplied', (context) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'e7-oxlint-config-'));
  context.after(() => fs.rmSync(cwd, { force: true, recursive: true }));
  fs.writeFileSync(path.join(cwd, '.oxlintrc.json'), '{}');

  assert.deepEqual(
    getOxcArgs({
      args: ['src'],
      configName: 'oxlint.json',
      projectConfigNames: ['.oxlintrc.json', 'oxlint.json'],
      cwd,
    }),
    ['--config', path.join(cwd, '.oxlintrc.json'), 'src'],
  );
});

test('uses a project oxlint.json', (context) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'e7-oxlint-config-'));
  context.after(() => fs.rmSync(cwd, { force: true, recursive: true }));
  fs.writeFileSync(path.join(cwd, 'oxlint.json'), '{}');

  assert.deepEqual(
    getOxcArgs({
      args: ['src'],
      configName: 'oxlint.json',
      projectConfigNames: ['.oxlintrc.json', 'oxlint.json'],
      cwd,
    }),
    ['--config', path.join(cwd, 'oxlint.json'), 'src'],
  );
});

test('rejects projects with both Oxlint config names', (context) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'e7-oxlint-config-'));
  context.after(() => fs.rmSync(cwd, { force: true, recursive: true }));
  fs.writeFileSync(path.join(cwd, '.oxlintrc.json'), '{}');
  fs.writeFileSync(path.join(cwd, 'oxlint.json'), '{}');

  assert.throws(
    () =>
      getOxcArgs({
        args: ['src'],
        configName: 'oxlint.json',
        projectConfigNames: ['.oxlintrc.json', 'oxlint.json'],
        cwd,
      }),
    /Multiple project configuration files found/,
  );
});

test('explicit config arguments bypass conflicting project configs', (context) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'e7-oxlint-config-'));
  context.after(() => fs.rmSync(cwd, { force: true, recursive: true }));
  fs.writeFileSync(path.join(cwd, '.oxlintrc.json'), '{}');
  fs.writeFileSync(path.join(cwd, 'oxlint.json'), '{}');
  const args = ['--config', 'custom.json', 'src'];

  assert.equal(
    getOxcArgs({
      args,
      configName: 'oxlint.json',
      projectConfigNames: ['.oxlintrc.json', 'oxlint.json'],
      cwd,
    }),
    args,
  );
});

test('preserves explicit config arguments', () => {
  for (const args of [
    ['--config', 'custom.json', 'src'],
    ['--config=custom.json', 'src'],
    ['-c', 'custom.json', 'src'],
    ['-c=custom.json', 'src'],
  ]) {
    assert.equal(getOxcArgs({ args, configName: 'oxlint.json' }), args);
  }
});

test('uses the packaged formatter config', (context) => {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'e7-oxfmt-config-'));
  context.after(() => fs.rmSync(cwd, { force: true, recursive: true }));
  fs.writeFileSync(path.join(cwd, '.oxfmtrc.json'), '{}');

  assert.deepEqual(getOxcArgs({ args: ['.'], configName: 'oxfmt.json', cwd }), [
    '--config',
    path.resolve(__dirname, '..', 'oxfmt.json'),
    '.',
  ]);
});
