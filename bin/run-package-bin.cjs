const { spawnSync } = require('node:child_process');
const path = require('node:path');

const runPackageBin = ({ binName, packageName, args, exit = true }) => {
  const binDir = path.resolve(__dirname, '..', 'node_modules', '.bin');
  const pathKey = process.platform === 'win32' ? 'Path' : 'PATH';
  const command = packageName ? process.execPath : binName;
  const commandArgs = packageName ? [resolveBin({ binName, packageName }), ...args] : args;
  const result = spawnSync(command, commandArgs, {
    env: {
      ...process.env,
      [pathKey]: `${binDir}${path.delimiter}${process.env[pathKey] ?? ''}`,
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

const resolveBin = ({ binName, packageName }) => {
  const packageJsonPath = findPackageJson(require.resolve(packageName));
  const packageJson = require(packageJsonPath);
  const binPath = typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin[binName];

  return path.join(path.dirname(packageJsonPath), binPath);
};

function findPackageJson(fromPath) {
  let dir = path.dirname(fromPath);

  while (dir !== path.dirname(dir)) {
    const packageJsonPath = path.join(dir, 'package.json');

    try {
      require.resolve(packageJsonPath);
      return packageJsonPath;
    } catch (error) {
      if (error?.code !== 'MODULE_NOT_FOUND') {
        throw error;
      }
    }

    dir = path.dirname(dir);
  }

  throw new Error(`Could not find package.json for ${fromPath}`);
}

module.exports = {
  runPackageBin,
};
