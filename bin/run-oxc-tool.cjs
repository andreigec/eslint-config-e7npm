const { spawnSync } = require('node:child_process');
const path = require('node:path');

const hasConfigArg = (args) =>
  args.some((arg, index) => {
    if (arg === '-c' || arg === '--config') {
      return Boolean(args[index + 1]);
    }

    return arg.startsWith('-c=') || arg.startsWith('--config=');
  });

const resolveBin = ({ binName, packageName }) => {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageJson = require(packageJsonPath);
  const binPath = typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin[binName];

  return path.join(path.dirname(packageJsonPath), binPath);
};

const runOxcTool = ({ binName, packageName, configName }) => {
  const args = process.argv.slice(2);
  const configPath = path.resolve(__dirname, '..', configName);
  const finalArgs = hasConfigArg(args) ? args : ['--config', configPath, ...args];
  const result = spawnSync(process.execPath, [resolveBin({ binName, packageName }), ...finalArgs], {
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
};

module.exports = {
  runOxcTool,
};
