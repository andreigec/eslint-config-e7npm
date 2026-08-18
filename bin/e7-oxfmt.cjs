#!/usr/bin/env node

const { discoverDirsByName } = require('./discover-projects');
const { runOxcTool } = require('./run-oxc-tool');

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exitCode = 1;
});

async function main() {
  const cliArgs = process.argv.slice(2);
  const runLint = !cliArgs.includes('--no-lint');
  const args = cliArgs.filter((arg) => arg !== '--no-lint');

  const formatStatus = runOxcTool({
    binName: 'oxfmt',
    packageName: 'oxfmt',
    configName: 'oxfmt.json',
    args: args.length === 0 ? await getDefaultArgs() : args,
    exit: false,
  });

  if (formatStatus !== 0 || !runLint || shouldSkipLint(args)) {
    process.exit(formatStatus);
  }

  runOxcTool({
    binName: 'oxlint',
    packageName: 'oxlint',
    configName: 'oxlint.json',
    args: ['--fix', '--fix-suggestions', '.'],
  });
}

function shouldSkipLint(args) {
  return args.some((arg) => ['--check', '--help', '-h', '--version', '-V'].includes(arg));
}

async function getDefaultArgs() {
  return [
    '--disable-nested-config',
    '.',
    ...(await discoverDirsByName({ dirName: 'generated-data' })),
  ];
}
