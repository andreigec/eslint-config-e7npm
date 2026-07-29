#!/usr/bin/env node

const { runPackageBin } = require('./run-package-bin');
const { discoverProjects } = require('./discover-projects');

const args = process.argv.slice(2);

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exitCode = 1;
});

async function main() {
  runPackageBin({
    binName: 'jscpd',
    packageName: 'jscpd',
    args: args.length === 0 ? await getDefaultArgs() : args,
  });
}

async function getDefaultArgs() {
  const projects = await discoverProjects();
  const paths = projects
    .filter((project) => project.hasScriptSourceFiles)
    .map((project) => `${project.relativeDir}/src`);

  return [
    '--min-lines',
    '8',
    '--threshold',
    '0',
    ...(paths.length > 0 ? paths : ['.']),
    '--pattern',
    '**/*.{ts,tsx}',
    '--ignore',
    '**/{.next,.turbo,build,coverage,dist,node_modules,out}/**',
  ];
}
