#!/usr/bin/env node

const { mkdtemp, readFile, readdir, rm, writeFile } = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

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
  const defaultEntry = await getConfigEntries(process.cwd());
  const configuredWorkspaces = isObject(config.workspaces) ? config.workspaces : {};
  const defaultWorkspaceConfigs = await Promise.all(projects.map(getDefaultWorkspaceConfig));
  const workspaces = {};

  for (const [index, project] of projects.entries()) {
    const defaultWorkspaceConfig = defaultWorkspaceConfigs[index];
    const configuredWorkspace = configuredWorkspaces[project.relativeDir];
    if (!defaultWorkspaceConfig && !isObject(configuredWorkspace)) continue;

    workspaces[project.relativeDir] = {
      ...defaultWorkspaceConfig,
      ...(isObject(configuredWorkspace) ? configuredWorkspace : {}),
    };
  }

  for (const [workspace, workspaceConfig] of Object.entries(configuredWorkspaces)) {
    workspaces[workspace] ??= workspaceConfig;
  }

  const finalConfig = {
    ...config,
    ignoreDependencies: mergeUnique(defaultIgnoreDependencies, config.ignoreDependencies),
    workspaces,
  };
  if (defaultEntry.length > 0) {
    if (projects.length > 0) {
      workspaces['.'] = {
        entry: defaultEntry,
        ...(isObject(workspaces['.']) ? workspaces['.'] : {}),
      };
    } else {
      finalConfig.entry = mergeUnique(defaultEntry, config.entry);
    }
  }

  const configPath = path.join(tempDir, 'knip.json');

  await writeFile(configPath, `${JSON.stringify(finalConfig, null, 2)}\n`);

  return configPath;
}

async function getDefaultWorkspaceConfig(project) {
  const entry = await getConfigEntries(project.dir);
  if (await fileExists(path.join(project.dir, 'cdk.json'))) {
    entry.push(`{bin,src}/{app,main,index}.${defaultExtensions}`);
  }
  return entry.length > 0 ? { entry } : undefined;
}

async function getConfigEntries(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.some(
    (item) => item.isFile() && /\.config\.(?:js|mjs|cjs|ts|mts|cts)$/.test(item.name),
  )
    ? [`*.config.${defaultExtensions}`]
    : [];
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

  const rootManifest = manifests[0];
  const ignoredDependencies = ['@tauri-apps/cli'];
  if (
    isObject(rootManifest?.dependencies) &&
    Object.hasOwn(rootManifest.dependencies, 'eslint-config-e7npm')
  ) {
    ignoredDependencies.push('@eslint/js', 'globals');
  }
  if (rootManifest?.name === 'eslint-config-e7npm') {
    ignoredDependencies.push('jscpd', 'oxfmt', 'oxlint', 'oxlint-tailwindcss', 'oxlint-tsgolint');
  }
  return ignoredDependencies.filter((dependency) => presentDependencies.has(dependency));
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

async function parseJsonConfig(filePath, source) {
  const { default: stripJsonComments } = await import('strip-json-comments');
  try {
    const config = JSON.parse(stripJsonComments(source, { trailingCommas: true }));
    return isObject(config) ? config : {};
  } catch (error) {
    throw new Error(
      `Could not parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
      { cause: error },
    );
  }
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
