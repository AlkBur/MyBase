// ======================================================================
//  Golden test runner — multi-runtime, snapshot-based
//  Pipeline: actual → normalizeForComparison → deepEqual(expected)
// ======================================================================

import { readFileSync, existsSync, readdirSync, writeFileSync } from "fs";
import { join } from "path";
import { Database } from "bun:sqlite";
import { ServerRuntime } from "../runtime/server/runtime";
import { ClientRuntime } from "../runtime/client/runtime";
import type { ExecutionResult, ExecuteRequest, DSRuntime } from "../runtime/shared/types";

const UPDATE_GOLDENS = process.argv.includes("--update");
const CASES_DIR = join(import.meta.dir, "cases");
const EXPECTED_DIR = join(import.meta.dir, "expected");

function setupDB(): Database {
  const db = new Database(":memory:");
  db.run(`
    CREATE TABLE IF NOT EXISTS Пользователи (
      ID INTEGER PRIMARY KEY AUTOINCREMENT,
      Имя TEXT NOT NULL,
      Возраст INTEGER NOT NULL
    )
  `);
  db.run("INSERT INTO Пользователи (Имя, Возраст) VALUES ('Иван', 30)");
  db.run("INSERT INTO Пользователи (Имя, Возраст) VALUES ('Мария', 25)");
  db.run("INSERT INTO Пользователи (Имя, Возраст) VALUES ('Петр', 35)");
  return db;
}

function readMeta(caseFile: string): { runtime: string; expectError: boolean; skip: boolean } {
  const metaPath = caseFile.replace(/\.os$/, ".meta.json");
  if (!existsSync(metaPath)) {
    return { runtime: "server", expectError: false, skip: false };
  }
  return JSON.parse(readFileSync(metaPath, "utf-8"));
}

function getRuntime(name: string, db: Database): DSRuntime {
  if (name === "client") return new ClientRuntime();
  return new ServerRuntime(db);
}

function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a === "object") {
    const ka = Object.keys(a).sort();
    const kb = Object.keys(b).sort();
    if (!deepEqual(ka, kb)) return false;
    return ka.every((k) => deepEqual((a as any)[k], (b as any)[k]));
  }
  return false;
}

// ======================================================================
//  writeSnapshot — сырой слепок результата (без timing)
//  version — номер формата expected.json (не runtime version)
// ======================================================================
function writeSnapshot(r: ExecutionResult): any {
  const { timing, ...rest } = r;
  return {
    version: 1,
    success: r.success,
    output: r.output,
    result: r.result !== undefined ? r.result : null,
    error: r.error ?? null,
    runtimeVersion: r.runtimeVersion,
  };
}

// ======================================================================
//  normalizeForComparison — нормализация нестабильных полей
// ======================================================================
function normalizeForComparison(r: any): any {
  const normalizeMsg = (msg: string) =>
    msg.replace(/\s+на строке \d+/gi, "").replace(/\s+\(строка \d+\)/gi, "").trim();

  const normalizeOutput = (output: any[]) =>
    output.map((o: any) => {
      const value = typeof o.value === "string"
        ? o.value
            .replace(/\d{2}\.\d{2}\.\d{4} \d{2}:\d{2}:\d{2}/g, "DD.MM.YYYY HH:mm:ss")
            .replace(/\(\d+ мс\)/g, "(N мс)")
        : o.value;
      return { type: o.type, value };
    });

  return {
    version: typeof r.version === "number" ? r.version : 1,
    success: r.success,
    output: r.output ? normalizeOutput(r.output) : [],
    result: r.result !== undefined ? r.result : null,
    error: r.error
      ? { message: normalizeMsg(r.error.message), line: r.error.line }
      : null,
  };
}

// ======================================================================
//  Main
// ======================================================================

let passed = 0;
let failed = 0;

console.log(`🧪 Golden tests (${UPDATE_GOLDENS ? "UPDATE mode" : "CHECK mode"})\n`);

const caseFiles = readdirSync(CASES_DIR).filter((f) => f.endsWith(".os")).sort();

for (const file of caseFiles) {
  const casePath = join(CASES_DIR, file);
  const meta = readMeta(casePath);

  if (meta.skip) {
    console.log(`  ⏭ ${file} (пропущен)`);
    continue;
  }

  process.stdout.write(`  ${file}... `);

  const db = setupDB();
  const runtime = getRuntime(meta.runtime, db);
  const code = readFileSync(casePath, "utf-8");
  const req: ExecuteRequest = { code };
  let result: ExecutionResult;
  try {
    result = runtime.execute(req);
  } catch (thrown: any) {
    console.log(`\n     ❌ THROWN: ${thrown.message}`);
    console.log(`     stack: ${(thrown.stack ?? "").split("\n").slice(0, 3).join(" | ")}`);
    failed++;
    continue;
  }

  const expectedPath = join(EXPECTED_DIR, file.replace(/\.os$/, ".expected.json"));

  if (UPDATE_GOLDENS) {
    writeFileSync(expectedPath, JSON.stringify(writeSnapshot(result), null, 2), "utf-8");
    console.log("📝 (snapshot written)");
    passed++;
    continue;
  }

  if (!existsSync(expectedPath)) {
    console.log("❌ (no snapshot, run with --update)");
    failed++;
    continue;
  }

  const expected = JSON.parse(readFileSync(expectedPath, "utf-8"));

  if (meta.expectError === true) {
    if (result.success) {
      console.log("❌ ожидалась ошибка, но код выполнился успешно");
      failed++;
      continue;
    }
    const a = normalizeForComparison(result);
    const b = normalizeForComparison(expected);
    if (deepEqual(a, b)) {
      console.log("✅ (ошибка)");
      passed++;
    } else {
      console.log("\n     ❌ snapshot mismatch");
      console.log(`     expected: ${JSON.stringify(b)}`);
      console.log(`     actual:   ${JSON.stringify(a)}`);
      failed++;
    }
    continue;
  }

  // success test
  if (!result.success) {
    console.log(`❌ неожиданная ошибка: ${result.error?.message}`);
    failed++;
    continue;
  }

  const a = normalizeForComparison(result);
  const b = normalizeForComparison(expected);

  if (deepEqual(a, b)) {
    console.log("✅");
    passed++;
  } else {
    console.log("\n     ❌ snapshot mismatch");
    console.log(`     expected: ${JSON.stringify(b)}`);
    console.log(`     actual:   ${JSON.stringify(a)}`);
    failed++;
  }
}

console.log(`\nРезультат: ${passed}/${passed + failed} пройдено`);
if (failed > 0) process.exit(1);
