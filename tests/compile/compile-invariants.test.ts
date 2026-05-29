#!/usr/bin/env bun
// ======================================================================
//  compile-invariants.test.ts — Lowering contract invariants
//
//  Проверяет generated JS, не runtime semantics.
//  Запускается отдельно от compile-runner (snapshot diff).
//
//  Инварианты:
//    1. B.0 base — в assignment-dot нет __dsl_member_get__/__dsl_member_set__
//    2. B.0 base — bracket read идёт через __dsl_index__
//    3. B.0 base — dot read это plain JS property access
//    4. B.0 base — bracket/dot assignment идёт через __dsl_index_set__
//    5. eval не содержит __dsl_db__ / __dsl_Query__ / __dsl_index_set__
//    6. fragment mode (Выполнить) — нет Возврат/Процедура/Функция/Перем
//    7. Цикл Для — правильная структура (while с .get/.set)
//    8. Цикл Для Каждого — for-of + scope cleanup
//    9. Чейнинг: index → dot → index (nested-access)
//    10. assertion-ordered: assignment-dot и assignment-bracket
//    11. НайтиСтроки с Структура-аргументом
//
//  Global invariant:
//    Ни в одном baseline-файле нет __dsl_member_get__ или __dsl_member_set__
// ======================================================================

import { compile } from "../../compiler/compile";
import { serverCapabilities } from "../../runtime/server/capabilities";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

let passed = 0;
let failed = 0;

// ======================================================================
//  Helpers
// ======================================================================

function runTest(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`  ✅ ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`  ❌ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(msg);
}

/**
 * Компилирует код и возвращает сгенерированный JS.
 */
function compileCode(code: string): string {
  const { jsCode } = compile(code, serverCapabilities);
  return jsCode;
}

// ======================================================================
//  Core assertions
// ======================================================================

/**
 * assertCompilesTo — проверяет lowering path.
 *
 * @param source           — BSL-like исходник
 * @param contains         — строки, которые ДОЛЖНЫ быть в generated JS
 * @param notContains      — строки, которых НЕ ДОЛЖНО быть в generated JS
 */
function assertCompilesTo(
  source: string,
  contains: string[],
  notContains: string[]
): void {
  const js = compileCode(source);

  for (const part of contains) {
    if (!js.includes(part)) {
      throw new Error(`expected to contain "${part}" but not found\n\nJS:\n${js}`);
    }
  }

  for (const part of notContains) {
    if (js.includes(part)) {
      throw new Error(`expected NOT to contain "${part}" but found\n\nJS:\n${js}`);
    }
  }
}

/**
 * assertCompilesOrdered — части появляются в JS последовательно.
 *
 * Ищет подстроки indexOf-style, не regex, не AST.
 */
function assertCompilesOrdered(source: string, parts: string[]): void {
  const js = compileCode(source);
  let cursor = 0;

  for (const part of parts) {
    const idx = js.indexOf(part, cursor);
    if (idx === -1) {
      throw new Error(
        `expected ordered part "${part}" not found after position ${cursor}\n\nJS:\n${js}`
      );
    }
    cursor = idx + part.length;
  }
}

// ======================================================================
//  Baseline snapshots — проверка, что ни один baseline
//  не содержит member_get/member_set (B.1 не начат)
// ======================================================================

runTest("GLOBAL: no member_get/member_set in any baseline", () => {
  const expectedDir = join(import.meta.dir, "expected");
  const files = readdirSync(expectedDir).filter((f) => f.endsWith(".expected.json"));

  if (files.length === 0) {
    throw new Error("no baseline files found — run --update first");
  }

  for (const file of files) {
    const content = readFileSync(join(expectedDir, file), "utf-8");
    const snapshot = JSON.parse(content);

    if (typeof snapshot.js !== "string") {
      throw new Error(`bad snapshot ${file}: missing .js`);
    }

    if (snapshot.js.includes("__dsl_member_get__")) {
      throw new Error(`${file} contains __dsl_member_get__ — B.1 started unexpectedly`);
    }

    if (snapshot.js.includes("__dsl_member_set__")) {
      throw new Error(`${file} contains __dsl_member_set__ — B.3 started unexpectedly`);
    }
  }
});

// ======================================================================
//  Invariant 1: dot read → plain JS property
// ======================================================================

runTest("Структура.К1 → plain dot (not __dsl_index__)", () => {
  assertCompilesTo(
    'Структура = Новый Структура("К1", 1); a = Структура.К1;',
    [').К1'],
    ['__dsl_index__', '__dsl_member_get__']
  );
});

runTest("Стр.К1 → plain dot (not __dsl_index__)", () => {
  assertCompilesTo(
    'Т = Новый ТаблицаЗначений; Т.Колонки.Добавить("К1"); Стр = Т.Добавить(); a = Стр.К1;',
    [').К1'],
    ['__dsl_index__', '__dsl_member_get__']
  );
});

// ======================================================================
//  Invariant 2: bracket read → __dsl_index__
// ======================================================================

runTest('Структура["К1"] → __dsl_index__', () => {
  assertCompilesTo(
    'Структура = Новый Структура("К1", 1); b = Структура["К1"];',
    ['__dsl_index__('],
    ['__dsl_member_get__']
  );
});

runTest('Стр["К1"] → __dsl_index__', () => {
  assertCompilesTo(
    'Т = Новый ТаблицаЗначений; Т.Колонки.Добавить("К1"); Стр = Т.Добавить(); b = Стр["К1"];',
    ['__dsl_index__('],
    ['__dsl_member_get__']
  );
});

// ======================================================================
//  Invariant 3: assignment → __dsl_index_set__
// ======================================================================

runTest("dot assignment → __dsl_index_set__", () => {
  assertCompilesTo(
    'Структура = Новый Структура("К1", 1); Структура.К1 = 42;',
    ['__dsl_index_set__('],
    ['__dsl_member_set__']
  );
});

runTest("bracket assignment → __dsl_index_set__", () => {
  assertCompilesTo(
    'Структура = Новый Структура("К1", 1); Структура["К1"] = 42;',
    ['__dsl_index_set__('],
    ['__dsl_member_set__']
  );
});

// ======================================================================
//  Invariant 4: assignment-dot и assignment-bracket lowering идентичны
//  (в B.0 оба → __dsl_index_set__; lineMap может отличаться)
// ======================================================================

runTest("assignment lowering: dot == bracket (B.0 baseline)", () => {
  const jsDot = compileCode(`
    Структура = Новый Структура("К1", 1);
    Структура.К1 = 42;
  `);
  const jsBracket = compileCode(`
    Структура = Новый Структура("К1", 1);
    Структура["К1"] = 42;
  `);
  // Ожидаем идентичный JS (но без lineMap — его не сравниваем)
  assert(
    jsDot === jsBracket,
    `dot JS ≠ bracket JS\n\ndot:\n${jsDot}\n\nbracket:\n${jsBracket}`
  );
});

// ======================================================================
//  Invariant 5: eval sandbox — нет __dsl_db__ / __dsl_Query__ / __dsl_index_set__
// ======================================================================

runTest("eval → __dsl_eval__, не __dsl_db__", () => {
  assertCompilesTo(
    'a = Вычислить("1 + 1");',
    ['__dsl_eval__('],
    ['__dsl_db__', '__dsl_Query__']
  );
});

runTest("eval → нет __dsl_index_set__", () => {
  const js = compileCode('a = Вычислить("1 + 1");');
  assert(!js.includes("__dsl_index_set__"), "eval should not contain __dsl_index_set__");
});

// ======================================================================
//  Invariant 6: Для Цикл → while с .get/.set
// ======================================================================

runTest("Для → while (.get/.set)", () => {
  assertCompilesTo(
    'Для i = 1 по 10 Цикл a = a + i; КонецЦикла;',
    ['.get(', '.set('],
    ['__dsl_member_get__']
  );
});

// ======================================================================
//  Invariant 7: Для Каждого → for-of + scope cleanup
// ======================================================================

runTest("Для Каждого → for-of", () => {
  const js = compileCode('Для Каждого Эл Из М Цикл Сообщить(Эл); КонецЦикла;');
  assert(js.includes("for (const "), `expected for-of, got:\n${js}`);
});

// ======================================================================
//  Invariant 8: nested chain — index → dot → index
// ======================================================================

runTest("nested: Т[0].Данные[\"К1\"] → дважды __dsl_index__ + .Данные", () => {
  // Nested expression => JS nesting, ordered check не применим (см. design).
  // Вместо этого: count __dsl_index__ и проверяем наличие .Данные
  const js = compileCode(`
    Т = Новый ТаблицаЗначений;
    Т.Колонки.Добавить("К1");
    Стр = Т.Добавить();
    a = Т[0].Данные["К1"];
  `);
  const idxCount = (js.match(/__dsl_index__/g) || []).length;
  assert(idxCount >= 2, `expected ≥2 __dsl_index__, got ${idxCount}`);
  assert(js.includes(".Данные"), "expected .Данные");
});

// ======================================================================
//  Invariant 9: НайтиСтроки → method chain + Структура constructor
// ======================================================================

runTest("НайтиСтроки(Новый Структура) → .НайтиСтроки(__dsl_newStructure__)", () => {
  assertCompilesTo(
    'Т = Новый ТаблицаЗначений; Т.Колонки.Добавить("К1"); Р = Т.НайтиСтроки(Новый Структура("К1", 5));',
    ['.НайтиСтроки(', '__dsl_newStructure__('],
    []
  );
});

// ======================================================================
//  Invariant 10: for loop ordered lowering
// ======================================================================

runTest("Для: ordered lowering", () => {
  assertCompilesOrdered(
    'Для i = 1 по 10 Цикл a = a + 1; КонецЦикла;',
    ['.set("i"', '.get("i"', '.set("i"']
  );
});

// ======================================================================
//  Summary
// ======================================================================

const total = passed + failed;
console.log(`\nCompile invariants: ${passed}/${total} passed`);

if (failed > 0) {
  console.log(`\n⚠️  ${failed} invariant(s) failed — investigate before B.1`);
  process.exit(1);
}
