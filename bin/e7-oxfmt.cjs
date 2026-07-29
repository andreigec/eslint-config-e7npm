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
  const args = process.argv.slice(2);

  runOxcTool({
    binName: 'oxfmt',
    packageName: 'oxfmt',
    configName: 'oxfmt.json',
    args: args.length === 0 ? await getDefaultArgs() : args,
  });
}

async function getDefaultArgs() {
  return [
    '--disable-nested-config',
    '.',
    ...(await discoverDirsByName({ dirName: 'generated-data' })),
  ];
}
