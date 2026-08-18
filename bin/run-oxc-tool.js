const fs = require('node:fs');
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

const getProjectConfigPath = (configName) => {
  const configPath = path.resolve(process.cwd(), configName);
  return fs.existsSync(configPath) ? configPath : undefined;
};

const runOxcTool = ({
  binName,
  packageName,
  configName,
  configPath: customConfigPath,
  args = process.argv.slice(2),
  exit = true,
}) => {
  const configPath = customConfigPath ?? path.resolve(__dirname, '..', configName);
  const finalArgs = hasConfigArg(args) ? args : ['--config', configPath, ...args];
  const packageBinPath = path.resolve(__dirname, '..', 'node_modules', '.bin');
  const result = spawnSync(process.execPath, [resolveBin({ binName, packageName }), ...finalArgs], {
    env: {
      ...process.env,
      PATH: [packageBinPath, process.env.PATH].filter(Boolean).join(path.delimiter),
    },
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  const status = result.status ?? 1;

  if (exit) {
    process.exit(status);
  }

  return status;
};

module.exports = {
  getProjectConfigPath,
  runOxcTool,
};
