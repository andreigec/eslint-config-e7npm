const fs = require('node:fs');
const path = require('node:path');

const { runPackageBin } = require('./run-package-bin');

const hasConfigArg = (args) =>
  args.some((arg, index) => {
    if (arg === '-c' || arg === '--config') {
      return Boolean(args[index + 1]);
    }

    return arg.startsWith('-c=') || arg.startsWith('--config=');
  });

const getOxcArgs = ({ args, configName, projectConfigNames = [], cwd = process.cwd() }) => {
  if (hasConfigArg(args)) {
    return args;
  }

  const projectConfigPath = getProjectConfigPath(projectConfigNames, cwd);
  const configPath = projectConfigPath ?? path.resolve(__dirname, '..', configName);

  return ['--config', configPath, ...args];
};

const runOxcTool = ({
  binName,
  packageName,
  configName,
  projectConfigNames,
  args = process.argv.slice(2),
  exit = true,
}) =>
  runPackageBin({
    binName,
    packageName,
    args: getOxcArgs({ args, configName, projectConfigNames }),
    exit,
  });

function getProjectConfigPath(configNames, cwd) {
  const configPaths = configNames
    .map((configName) => path.resolve(cwd, configName))
    .filter((configPath) => fs.existsSync(configPath));

  if (configPaths.length > 1) {
    throw new Error(
      `Multiple project configuration files found: ${configPaths.join(', ')}. Keep only one.`,
    );
  }

  return configPaths[0];
}

module.exports = {
  getOxcArgs,
  runOxcTool,
};
