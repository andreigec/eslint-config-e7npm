#!/usr/bin/env node

const { runPackageBin } = require('./run-package-bin.cjs');
const { discoverProjects } = require('./discover-projects.cjs');

const args = process.argv.slice(2);

main().catch((error) => {
  console.error(error);
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
  const paths =
    projects.length > 0 ? projects.map((project) => `${project.relativeDir}/src`) : ['.'];

  return [
    '--min-lines',
    '8',
    '--threshold',
    '0',
    ...paths,
    '--pattern',
    '**/*.{ts,tsx}',
    '--ignore',
    '**/{.next,.turbo,build,coverage,dist,node_modules,out}/**',
  ];
}
