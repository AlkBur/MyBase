/**
 * Invariant tests для member access — dot/bracket equivalence.
 *
 * Отдельная test lane от golden snapshots:
 *   - Проверяет semantic invariants, а не конкретные outputs
 *   - Выполняется ДО snapshot tests
 *   - Должен проходить всегда, независимо от фазы dispatch migration
 *
 * Каждый invariant — TS-side проверка, не DSL builtin.
 * Не загрязняет runtime test-only API.
 *
 * Инварианты:
 *   - row.К1 === row["К1"]  (dot = bracket)
 *   - Структура.Ключ === Структура["Ключ"]  (structure dot = bracket)
 *   - Ключи регистронезависимы: row["К1"] === row["к1"]
 *   - Удалённая колонка → "Колонка не найдена"
 *   - Неизвестный член → Неопределено (bracket)
 *   - Неизвестный член → Неопределено (dot)  — transitional, изменится в v1.4
 */

import { Database } from "bun:sqlite";
import { ServerRuntime } from "../../runtime/server/runtime";
import type { ExecuteRequest } from "../../runtime/shared/types";

let passed = 0;
let failed = 0;

function runInvariant(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function exec(rt: ServerRuntime, code: string): { output: string[]; result: unknown } {
  const req: ExecuteRequest = { code };
  const res = rt.execute(req);
  if (!res.success) {
    throw new Error(`execution failed: ${res.error?.message}`);
  }
  return {
    output: res.output.map((o) => o.value),
    result: res.result,
  };
}

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(msg);
}

// =========================================================================
//  Setup — общий runtime и таблица для всех тестов
// =========================================================================

const db = new Database(":memory:");
db.run("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY, name TEXT)");
const rt = new ServerRuntime(db);

// =========================================================================
//  Invariant 1: dot === bracket for ValueTableRow
// =========================================================================

runInvariant("row.К1 === row['К1'] (dot == bracket)", () => {
  const r = exec(rt, `
    ТЗ = Новый ТаблицаЗначений;
    ТЗ.Колонки.Добавить("К1");
    Стр = ТЗ.Добавить();
    Стр.К1 = 42;
    Сообщить(Стр.К1);
    Сообщить(Стр["К1"]);
  `);
  const vals = r.output;
  assert(vals[0] === vals[1], `dot=${vals[0]} bracket=${vals[1]}`);
});

runInvariant("row['К1'] === row['к1'] (case insensitive)", () => {
  const r = exec(rt, `
    ТЗ = Новый ТаблицаЗначений;
    ТЗ.Колонки.Добавить("К1");
    Стр = ТЗ.Добавить();
    Стр.К1 = 42;
    Сообщить(Стр["К1"]);
    Сообщить(Стр["к1"]);
  `);
  assert(r.output[0] === r.output[1], `К1=${r.output[0]} к1=${r.output[1]}`);
});

// =========================================================================
//  Invariant 2: dot === bracket for Структура
// =========================================================================

runInvariant("structure.Ключ === structure['Ключ'] (dot == bracket)", () => {
  const r = exec(rt, `
    С = Новый Структура("Ключ, Знач", 1, 2);
    Сообщить(С.Ключ);
    Сообщить(С["Ключ"]);
  `);
  assert(r.output[0] === r.output[1], `dot=${r.output[0]} bracket=${r.output[1]}`);
});

runInvariant("structure['Ключ'] === structure['ключ'] (case insensitive)", () => {
  const r = exec(rt, `
    С = Новый Структура("Ключ, Знач", 1, 2);
    Сообщить(С["Ключ"]);
    Сообщить(С["ключ"]);
  `);
  assert(r.output[0] === r.output[1], `Ключ=${r.output[0]} ключ=${r.output[1]}`);
});

// =========================================================================
//  Invariant 3: deleted column throws "Колонка не найдена"
// =========================================================================

runInvariant("deleted column → 'Колонка не найдена'", () => {
  const req: ExecuteRequest = { code: `
    ТЗ = Новый ТаблицаЗначений;
    ТЗ.Колонки.Добавить("К1");
    ТЗ.Колонки.Добавить("К2");
    Стр = ТЗ.Добавить();
    Стр.К1 = 10;
    Стр.К2 = 20;
    ТЗ.Колонки.Удалить("К1");
    Сообщить(Стр["К1"]);
  `};
  const res = rt.execute(req);
  // Must fail with "Колонка не найдена"
  if (res.success) {
    throw new Error(`expected error but got success, output: ${JSON.stringify(res.output)}`);
  }
  if (!res.error?.message.includes("Колонка не найдена")) {
    throw new Error(`expected 'Колонка не найдена' but got: ${res.error?.message}`);
  }
});

// =========================================================================
//  Invariant 4: unknown bracket member → undefined (Неопределено)
// =========================================================================

runInvariant("unknown bracket member on row → 'Колонка не найдена'", () => {
  const req: ExecuteRequest = { code: `
    ТЗ = Новый ТаблицаЗначений;
    ТЗ.Колонки.Добавить("К1");
    Стр = ТЗ.Добавить();
    Стр.К1 = 42;
    Сообщить(Стр["НесуществующаяКолонка"]);
  `};
  const res = rt.execute(req);
  if (res.success) {
    throw new Error(`expected error but got success, output: ${JSON.stringify(res.output)}`);
  }
  if (!res.error?.message.includes("Колонка не найдена")) {
    throw new Error(`expected 'Колонка не найдена' but got: ${res.error?.message}`);
  }
});

runInvariant("unknown bracket member → Неопределено (structure)", () => {
  const r = exec(rt, `
    С = Новый Структура;
    Сообщить(С["НесуществующийКлюч"]);
  `);
  assert(r.output[0] === "", `expected '' but got '${r.output[0]}'`);
});

// =========================================================================
//  Invariant 5: unknown dot member → Неопределено (transitional)
// =========================================================================

runInvariant("unknown dot member → Неопределено (structure, transitional)", () => {
  const r = exec(rt, `
    С = Новый Структура;
    Сообщить(С.НесуществующийКлюч);
  `);
  // Transitional: dot access currently falls back to JS undefined
  // After v1.4 unified dispatch, this should match bracket behavior
  assert(r.output[0] === "", `expected '' but got '${r.output[0]}'`);
});

// =========================================================================
//  Invariant 6: column with method name — reserved name validation
// =========================================================================

runInvariant("reserved column name 'Добавить' throws", () => {
  const req: ExecuteRequest = { code: `
    ТЗ = Новый ТаблицаЗначений;
    ТЗ.Колонки.Добавить("Добавить");
  `};
  const res = rt.execute(req);
  if (res.success) {
    throw new Error("expected error for reserved column name but got success");
  }
});

// =========================================================================
//  Summary
// =========================================================================

console.log(`\nInvariant tests: ${passed}/${passed + failed} passed`);
if (failed > 0) {
  console.log(`\n⚠️  ${failed} invariant(s) failed — investigate before B.1 dispatch migration`);
  process.exit(1);
}
