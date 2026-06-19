const { spawnSync } = require('node:child_process');
const path = require('node:path');

const runPackageBin = ({ binName, args }) => {
  const binDir = path.resolve(__dirname, '..', 'node_modules', '.bin');
  const pathKey = process.platform === 'win32' ? 'Path' : 'PATH';
  const result = spawnSync(binName, args, {
    env: {
      ...process.env,
      [pathKey]: `${binDir}${path.delimiter}${process.env[pathKey] ?? ''}`,
    },
    shell: true,
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  process.exit(result.status ?? 1);
};

module.exports = {
  runPackageBin,
};
