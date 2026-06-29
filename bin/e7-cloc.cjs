#!/usr/bin/env node

// oxlint-disable no-await-in-loop no-console

const { readFile, readdir, stat } = require('node:fs/promises');
const path = require('node:path');

const ts = require('typescript');

const repoRoot = process.cwd();
const packagesRoot = path.join(repoRoot, 'packages');

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const packages = await discoverPackages();
  const rows = [];

  for (const workspacePackage of packages) {
    const sourceRoot = path.join(workspacePackage.dir, 'src');
    const files = await collectTypeScriptFiles(sourceRoot);
    let lines = 0;

    for (const file of files) {
      lines += await countCodeLines(file);
    }

    rows.push({ name: workspacePackage.name, lines });
  }

  printTable(rows);
}

async function discoverPackages() {
  let entries;

  try {
    entries = await readdir(packagesRoot, { withFileTypes: true });
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  const packages = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    const packageDir = path.join(packagesRoot, entry.name);
    const manifestPath = path.join(packageDir, 'package.json');

    try {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

      if (typeof manifest.name !== 'string' || manifest.name.length === 0) {
        throw new Error(`Missing package name in ${manifestPath}`);
      }

      packages.push({ dir: packageDir, name: manifest.name });
    } catch (error) {
      if (error?.code === 'ENOENT') {
        continue;
      }

      throw error;
    }
  }

  return packages.toSorted((left, right) => left.name.localeCompare(right.name));
}

async function collectTypeScriptFiles(dir) {
  try {
    const dirStat = await stat(dir);

    if (!dirStat.isDirectory()) {
      return [];
    }
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...(await collectTypeScriptFiles(entryPath)));
      continue;
    }

    if (entry.isFile() && isTypeScriptFile(entry.name)) {
      files.push(entryPath);
    }
  }

  return files.toSorted();
}

function isTypeScriptFile(fileName) {
  return fileName.endsWith('.ts') || fileName.endsWith('.tsx');
}

async function countCodeLines(file) {
  const source = await readFile(file, 'utf8');
  const lineStarts = ts.computeLineStarts(source);
  const codeLines = new Set();
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.LanguageVariant.JSX : ts.LanguageVariant.Standard,
    source,
  );

  while (scanner.scan() !== ts.SyntaxKind.EndOfFileToken) {
    addTokenLines(codeLines, lineStarts, scanner.getTokenStart(), scanner.getTextPos());
  }

  return codeLines.size;
}

function addTokenLines(codeLines, lineStarts, start, end) {
  const startLine = getLineIndex(lineStarts, start);
  const endLine = getLineIndex(lineStarts, Math.max(start, end - 1));

  for (let line = startLine; line <= endLine; line += 1) {
    codeLines.add(line);
  }
}

function getLineIndex(lineStarts, position) {
  let low = 0;
  let high = lineStarts.length - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const lineStart = lineStarts[mid];
    const nextLineStart = lineStarts[mid + 1] ?? Number.POSITIVE_INFINITY;

    if (position < lineStart) {
      high = mid - 1;
    } else if (position >= nextLineStart) {
      low = mid + 1;
    } else {
      return mid;
    }
  }

  return lineStarts.length - 1;
}

function printTable(rows) {
  const total = rows.reduce((sum, row) => sum + row.lines, 0);
  const packageWidth = Math.max(
    'Package'.length,
    'Total'.length,
    ...rows.map((row) => row.name.length),
  );
  const linesWidth = Math.max(
    'TS LOC'.length,
    String(total).length,
    ...rows.map((row) => String(row.lines).length),
  );

  console.log(`${'Package'.padEnd(packageWidth)}  ${'TS LOC'.padStart(linesWidth)}`);

  for (const row of rows) {
    console.log(`${row.name.padEnd(packageWidth)}  ${String(row.lines).padStart(linesWidth)}`);
  }

  console.log(`${'Total'.padEnd(packageWidth)}  ${String(total).padStart(linesWidth)}`);
}
