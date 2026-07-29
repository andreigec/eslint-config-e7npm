#!/usr/bin/env node

const { mkdtemp, readFile, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const ts = require('typescript');

const { discoverProjects } = require('./discover-projects');
const { runPackageBin } = require('./run-package-bin');

const args = process.argv.slice(2);
const defaultExtensions = '{js,mjs,cjs,jsx,ts,tsx,mts,cts}';

main().catch((error) => {
  process.stderr.write(
    `${error instanceof Error ? (error.stack ?? error.message) : String(error)}\n`,
  );
  process.exitCode = 1;
});

async function main() {
  if (hasConfigArg(args) || (await hasUnsupportedDefaultConfig())) {
    runPackageBin({
      binName: 'knip',
      packageName: 'knip',
      args,
    });

    return;
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'e7-knip-'));

  try {
    const finalArgs = ['--config', await createKnipConfig(tempDir), ...args];
    const status = runPackageBin({
      binName: 'knip',
      packageName: 'knip',
      args: finalArgs,
      exit: false,
    });

    process.exitCode = status;
  } finally {
    await rm(tempDir, { force: true, recursive: true });
  }
}

async function hasUnsupportedDefaultConfig() {
  if (await findJsonKnipConfig()) {
    return false;
  }

  const configPaths = [
    'knip.js',
    'knip.ts',
    'knip.config.js',
    'knip.config.ts',
    'knip.config.mjs',
    'knip.config.cjs',
  ].map((fileName) => path.join(process.cwd(), fileName));

  return (await Promise.all(configPaths.map(fileExists))).some(Boolean);
}

async function createKnipConfig(tempDir) {
  const config = await readDefaultKnipConfig();
  const projects = await discoverProjects();
  const defaultIgnoreDependencies = await getDefaultIgnoreDependencies(projects);
  const configuredWorkspaces = isObject(config.workspaces) ? config.workspaces : {};
  const workspaces = {};

  for (const project of projects) {
    workspaces[project.relativeDir] = {
      ...getDefaultWorkspaceConfig(project),
      ...(isObject(configuredWorkspaces[project.relativeDir])
        ? configuredWorkspaces[project.relativeDir]
        : {}),
    };
  }

  for (const [workspace, workspaceConfig] of Object.entries(configuredWorkspaces)) {
    workspaces[workspace] ??= workspaceConfig;
  }

  const configPath = path.join(tempDir, 'knip.json');

  await writeFile(
    configPath,
    `${JSON.stringify(
      {
        ...config,
        ignoreDependencies: mergeUnique(defaultIgnoreDependencies, config.ignoreDependencies),
        workspaces,
      },
      null,
      2,
    )}\n`,
  );

  return configPath;
}

function getDefaultWorkspaceConfig(project) {
  if (!project.hasScriptSourceFiles) {
    return {
      entry: [],
      project: [],
    };
  }

  const isTestWorkspace = project.relativeDir.split('/').includes('tests');

  return {
    entry: isTestWorkspace
      ? [`src/**/*.{test,spec}.${defaultExtensions}`]
      : [
          `src/{index,main,cli}.${defaultExtensions}`,
          `src/**/{index,main,cli}.${defaultExtensions}`,
          `src/**/*.{test,spec}.${defaultExtensions}`,
        ],
    project: [`src/**/*.${defaultExtensions}`],
  };
}

async function readDefaultKnipConfig() {
  const configPath = await findJsonKnipConfig();

  if (configPath) {
    return parseJsonConfig(configPath, await readFile(configPath, 'utf8'));
  }

  const packageJsonPath = path.join(process.cwd(), 'package.json');

  try {
    const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8'));

    return isObject(packageJson.knip) ? packageJson.knip : {};
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return {};
    }

    throw error;
  }
}

async function getDefaultIgnoreDependencies(projects) {
  const presentDependencies = new Set();
  const manifestPaths = [
    path.join(process.cwd(), 'package.json'),
    ...projects.map((project) => path.join(project.dir, 'package.json')),
  ];
  const manifests = await Promise.all(manifestPaths.map(readJsonIfExists));

  for (const manifest of manifests) {
    addDependencyNames(presentDependencies, manifest?.dependencies);
    addDependencyNames(presentDependencies, manifest?.devDependencies);
    addDependencyNames(presentDependencies, manifest?.optionalDependencies);
  }

  return ['@tauri-apps/cli'].filter((dependency) => presentDependencies.has(dependency));
}

function addDependencyNames(dependencyNames, dependencies) {
  if (!isObject(dependencies)) {
    return;
  }

  for (const dependencyName of Object.keys(dependencies)) {
    dependencyNames.add(dependencyName);
  }
}

async function findJsonKnipConfig() {
  const configPaths = ['knip.json', '.knip.json', 'knip.jsonc', '.knip.jsonc'].map((fileName) =>
    path.join(process.cwd(), fileName),
  );
  const existing = await Promise.all(configPaths.map(fileExists));

  return configPaths[existing.indexOf(true)];
}

async function fileExists(filePath) {
  try {
    await readFile(filePath);
    return true;
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
}

function parseJsonConfig(filePath, source) {
  const result = ts.parseConfigFileTextToJson(filePath, source);

  if (result.error) {
    const message = ts.flattenDiagnosticMessageText(result.error.messageText, '\n');
    throw new Error(`Could not parse ${filePath}: ${message}`);
  }

  return isObject(result.config) ? result.config : {};
}

function hasConfigArg(argsToCheck) {
  return argsToCheck.some((arg, index) => {
    if (arg === '-c' || arg === '--config') {
      return Boolean(argsToCheck[index + 1]);
    }

    return arg.startsWith('-c=') || arg.startsWith('--config=');
  });
}

function mergeUnique(defaultValues, configuredValues) {
  if (!Array.isArray(configuredValues)) {
    return defaultValues;
  }

  return [...new Set([...defaultValues, ...configuredValues])];
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
