#!/usr/bin/env bun
// ======================================================================
//  compile-runner.ts — Compile snapshot runner
//
//  Генерирует и проверяет compile snapshots (generated JS + lineMapHash).
//  Не выполняет runtime — только lowering (tokenizer + parser + compile).
//
//  Режимы:
//    check mode:  сравнить actual vs expected (exit 1 при расхождении)
//    update mode: перезаписать expected из actual (--update)
//
//  Файл .expected.json:
//    { "js": "context.__variables__.set(...)", "lineMapHash": "sha256:..." }
//
//  Usage:
//    bun run tests/compile/compile-runner.ts           # check
//    bun run tests/compile/compile-runner.ts --update  # update
// ======================================================================

import { readFileSync, writeFileSync, existsSync } from "fs";
import { compile } from "../../compiler/compile";
import { serverCapabilities } from "../../runtime/server/capabilities";
import { Glob } from "bun";

// ======================================================================
//  Normalization
// ======================================================================

/**
 * Нормализация сгенерированного JS для сравнения.
 * Только cosmetic: line endings, trailing whitespace, trim.
 * Не prettifier, не AST printer, не reformatting.
 */
function normalizeCompiledJs(js: string): string {
  return js
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .trim();
}

/**
 * Нормализация lineMap для хэширования.
 * JSON.stringify — детерминированно.
 */
function normalizeLineMap(lineMap: number[]): string {
  return JSON.stringify(lineMap);
}

/**
 * SHA-256 хэш normalized lineMap.
 */
function hashLineMap(lineMap: number[]): string {
  const normalized = normalizeLineMap(lineMap);
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(normalized);
  return "sha256:" + hash.digest("hex");
}

// ======================================================================
//  Snapshot helpers
// ======================================================================

interface CompileSnapshot {
  js: string;
  lineMapHash: string;
}

function buildSnapshot(code: string): CompileSnapshot {
  const { jsCode, lineMap } = compile(code, serverCapabilities);
  return {
    js: normalizeCompiledJs(jsCode),
    lineMapHash: hashLineMap(lineMap),
  };
}

function readSnapshot(path: string): CompileSnapshot | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf-8")) as CompileSnapshot;
}

// ======================================================================
//  Runner
// ======================================================================

const isUpdate = process.argv.includes("--update");
const casesDir = import.meta.dir + "/cases";
const expectedDir = import.meta.dir + "/expected";

// Находим все .dsl файлы (рекурсивно, детерминированная сортировка)
const glob = new Glob("**/*.dsl");
const caseFiles = Array.from(glob.scanSync({ cwd: casesDir })).sort((a, b) =>
  a.localeCompare(b, "en")
);

if (caseFiles.length === 0) {
  console.error(`No .dsl files found in ${casesDir}`);
  process.exit(1);
}

let passed = 0;
let failed = 0;
let updated = 0;

for (const relPath of caseFiles) {
  const dslPath = `${casesDir}/${relPath}`;
  const baseName = relPath.replace(/\.dsl$/, "");
  const expectedPath = `${expectedDir}/${baseName}.expected.json`;

  const code = readFileSync(dslPath, "utf-8");
  const snapshot = buildSnapshot(code);

  if (isUpdate) {
    writeFileSync(expectedPath, JSON.stringify(snapshot, null, 2) + "\n", "utf-8");
    console.log(`  ✅ ${relPath} → expected/${baseName}.expected.json`);
    updated++;
    continue;
  }

  // check mode
  const expected = readSnapshot(expectedPath);
  if (!expected) {
    console.log(`  ❌ ${relPath} — expected not found (run --update)`);
    failed++;
    continue;
  }

  if (snapshot.js !== expected.js) {
    console.log(`  ❌ ${relPath} — JS mismatch`);
    failed++;
    continue;
  }

  if (snapshot.lineMapHash !== expected.lineMapHash) {
    console.log(`  ❌ ${relPath} — lineMap hash mismatch`);
    failed++;
    continue;
  }

  console.log(`  ✅ ${relPath}`);
  passed++;
}

// ---- summary ----

const total = caseFiles.length;
console.log(`\nCompile snapshots: ${passed}/${total} passed`);

if (isUpdate) {
  console.log(`Updated: ${updated}`);
  process.exit(0);
}

if (failed > 0) {
  process.exit(1);
}
