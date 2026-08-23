#!/usr/bin/env node

// oxlint-disable no-await-in-loop no-console

const { readFile, readdir, stat } = require('node:fs/promises');
const path = require('node:path');

const { discoverProjects } = require('./discover-projects');

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const { createScanner, LanguageVariant, SyntaxKind } = await import('typescript/unstable/ast');
  const packages = await discoverProjects();
  const rows = [];

  for (const workspacePackage of packages) {
    const files = await collectTypeScriptFiles(workspacePackage.sourceRoot);
    let lines = 0;

    for (const file of files) {
      lines += await countCodeLines(file, { createScanner, LanguageVariant, SyntaxKind });
    }

    rows.push({ name: workspacePackage.name, lines });
  }

  printTable(rows);
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

async function countCodeLines(file, { createScanner, LanguageVariant, SyntaxKind }) {
  const source = await readFile(file, 'utf8');
  const lineStarts = computeLineStarts(source);
  const codeLines = new Set();
  const scanner = createScanner(
    true,
    file.endsWith('.tsx') ? LanguageVariant.JSX : LanguageVariant.Standard,
    source,
  );

  while (scanner.scan() !== SyntaxKind.EndOfFile) {
    const start = scanner.getTokenStart();
    const end = scanner.getTokenEnd();
    addTokenLines(codeLines, lineStarts, start, end);
    if (end <= start) scanner.resetTokenState(start + 1);
  }

  return codeLines.size;
}

function computeLineStarts(source) {
  const lineStarts = [0];
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] === '\n') lineStarts.push(index + 1);
  }
  return lineStarts;
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
