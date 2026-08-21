const { readFile, readdir, stat } = require('node:fs/promises');
const path = require('node:path');

const ignoredProjectDirs = new Set([
  '.git',
  '.next',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
  'out',
]);
const scriptExtensions = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.mts', '.cts']);

async function discoverProjects({ cwd = process.cwd(), rootName = 'packages' } = {}) {
  const root = path.join(cwd, rootName);
  const projects = [];

  await collectProjects({ cwd, dir: root, projects, root });

  return projects.toSorted((left, right) => left.name.localeCompare(right.name));
}

async function discoverDirsByName({ cwd = process.cwd(), dirName, rootName = 'packages' }) {
  const root = path.join(cwd, rootName);
  const dirs = [];

  await collectDirsByName({ cwd, dir: root, dirName, dirs });

  return dirs.toSorted();
}

async function collectProjects({ cwd, dir, projects, root }) {
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return;
    }

    throw error;
  }

  const manifest = await readPackageManifest(dir);
  const sourceRoot = path.join(dir, 'src');
  const hasSourceRoot = await isDirectory(sourceRoot);
  const hasScriptSourceFiles =
    hasSourceRoot && (await hasFilesWithExtensions(sourceRoot, scriptExtensions));

  if (manifest) {
    projects.push({
      dir,
      hasScriptSourceFiles,
      hasSourceRoot,
      name: manifest.name ?? getFallbackProjectName({ dir, root }),
      relativeDir: toPosixPath(path.relative(cwd, dir)),
      sourceRoot,
    });
  }

  await Promise.all(
    entries
      .filter(
        (entry) =>
          entry.isDirectory() && entry.name !== 'src' && !ignoredProjectDirs.has(entry.name),
      )
      .map((entry) => collectProjects({ cwd, dir: path.join(dir, entry.name), projects, root })),
  );
}

async function hasFilesWithExtensions(dir, extensions) {
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }

    throw error;
  }

  if (entries.some((entry) => entry.isFile() && extensions.has(path.extname(entry.name)))) {
    return true;
  }

  const childResults = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !ignoredProjectDirs.has(entry.name))
      .map((entry) => hasFilesWithExtensions(path.join(dir, entry.name), extensions)),
  );

  return childResults.some(Boolean);
}

async function collectDirsByName({ cwd, dir, dirName, dirs }) {
  let entries;

  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return;
    }

    throw error;
  }

  await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !ignoredProjectDirs.has(entry.name))
      .map((entry) => {
        const entryPath = path.join(dir, entry.name);

        if (entry.name === dirName) {
          dirs.push(toPosixPath(path.relative(cwd, entryPath)));
          return undefined;
        }

        return collectDirsByName({ cwd, dir: entryPath, dirName, dirs });
      }),
  );
}

async function readPackageManifest(dir) {
  const manifestPath = path.join(dir, 'package.json');

  try {
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
      return {};
    }

    return { name: manifest.name };
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return undefined;
    }

    throw error;
  }
}

async function isDirectory(dir) {
  try {
    return (await stat(dir)).isDirectory();
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

function getFallbackProjectName({ dir, root }) {
  return toPosixPath(path.relative(root, dir));
}

function toPosixPath(filePath) {
  return filePath.split(path.sep).join('/');
}

module.exports = {
  discoverDirsByName,
  discoverProjects,
};
