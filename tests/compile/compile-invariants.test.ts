#!/usr/bin/env bun
// ======================================================================
//  compile-invariants.test.ts — Lowering contract invariants
//
//  Проверяет generated JS, не runtime semantics.
//  Запускается отдельно от compile-runner (snapshot diff).
//
//  Инварианты:
//    1. Dot read (expression-context): a = Obj.Prop → __dsl_member_get__
//    2. Statement-call (statement-context): Obj.Prop.Method() → member_get + .Method
//    3. Write-path legacy: Obj.Prop = v → __dsl_index_set__ (до B.3)
//    4. Bracket read: Obj["Prop"] → __dsl_index__ (до B.1.6)
//    5. eval не содержит __dsl_db__ / __dsl_Query__ / __dsl_index_set__
//    6. Dot vs bracket assignment lowering идентичны (оба → __dsl_index_set__)
//    7. Цикл Для — правильная структура (while с .get/.set)
//    8. Цикл Для Каждого — for-of + scope cleanup
//    9. НайтиСтроки с Структура-аргументом
//   10. Чейнинг: Т[0].Данные["К1"] → member_get + __dsl_index__
//   11. Для: ordered lowering
//
//  Global invariant:
//    Ни в одном baseline-файле нет __dsl_member_set__ (B.3 не начат)
//    __dsl_member_get__ ОЖИДАЕТСЯ в dot-access snapshot-ах (B.1.2+)
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
//  GLOBAL invariant — member_set НИГДЕ не появляется до B.3
//  member_get ОЖИДАЕТСЯ в dot-access snapshot-ах (B.1.2+)
// ======================================================================

runTest("GLOBAL: no member_set in any baseline (B.3 not started)", () => {
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

    if (snapshot.js.includes("__dsl_member_set__")) {
      throw new Error(`${file} contains __dsl_member_set__ — B.3 started unexpectedly`);
    }
  }
});

// ======================================================================
//  Invariant 1: dot read (expression context) → __dsl_member_get__
// ======================================================================

runTest("a = Структура.К1 → __dsl_member_get__ (not __dsl_index__)", () => {
  assertCompilesTo(
    'Структура = Новый Структура("К1", 1); a = Структура.К1;',
    ['__dsl_member_get__('],
    ['__dsl_index__(']
  );
});

runTest("a = Стр.К1 → __dsl_member_get__ (not __dsl_index__)", () => {
  assertCompilesTo(
    'Т = Новый ТаблицаЗначений; Т.Колонки.Добавить("К1"); Стр = Т.Добавить(); a = Стр.К1;',
    ['__dsl_member_get__('],
    ['__dsl_index__(']
  );
});

// ======================================================================
//  Invariant 1b: statement-call chain — split-brain topology test
//  Obj.Prop.Method() → member_get for Prop, .Method() stays native
//  (Критично: B1.2 обнаружил, что statement-chain и expression-chain
//   были независимыми pipeline. Этот тест — canary.)
// ======================================================================

runTest("Т.Колонки.Добавить() → member_get + .Добавить (statement chain)", () => {
  assertCompilesTo(
    'Т = Новый ТаблицаЗначений; Т.Колонки.Добавить("К1");',
    ['__dsl_member_get__(', '.Добавить('],
    []
  );
});

runTest("Структура.К1 = v → __dsl_index_set__ (write path legacy)", () => {
  // Write-path assignment НЕ идёт через member_get, а использует
  // __dsl_index_set__ + objExpr (from statement-chain decomposition)
  assertCompilesTo(
    'Структура = Новый Структура("К1", 1); Структура.К1 = 42;',
    ['__dsl_index_set__('],
    ['__dsl_member_set__(']
  );
});

// ======================================================================
//  Invariant 2: bracket read → __dsl_index__
// ======================================================================

// ======================================================================
//  Invariant 2: bracket read → __dsl_index__
// ======================================================================

//  Не используем not_contains для member_get — setup chains (Т.Колонки.Добавить)
//  теперь используют member_get. Проверяем только bracket path.
runTest('Структура["К1"] → __dsl_index__', () => {
  const js = compileCode('Структура = Новый Структура("К1", 1); b = Структура["К1"];');
  assert(js.includes('__dsl_index__('), `expected __dsl_index__ for bracket access\nJS:\n${js}`);
});

runTest('Стр[0] → __dsl_index__', () => {
  const js = compileCode('Стр = Новый Массив; b = Стр[0];');
  assert(js.includes('__dsl_index__('), `expected __dsl_index__ for bracket access\nJS:\n${js}`);
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
    []
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

runTest("nested: Т[0].Данные[\"К1\"] → member_get вместо .Данные", () => {
  // Nested expression => JS nesting, ordered check не применим (см. design).
  // Т[0].Данные → __dsl_member_get__(__dsl_index__(Т, 0), "Данные")
  // ["К1"] → __dsl_index__(member_get(...), "К1")
  // Итого: 1 __dsl_member_get__ + 2 __dsl_index__
  const js = compileCode(`
    Т = Новый ТаблицаЗначений;
    Т.Колонки.Добавить("К1");
    Стр = Т.Добавить();
    a = Т[0].Данные["К1"];
  `);
  // member_get: один для .Данные (выражение), плюс setup line Т.Колонки
  // Итого ≥2 member_get (Т.Колонки + .Данные)
  const mgCount = (js.match(/__dsl_member_get__/g) || []).length;
  assert(mgCount >= 2, `expected ≥2 __dsl_member_get__, got ${mgCount}`);
  // __dsl_index__: Т[0] + ["К1"] + возможно setup
  const idxCount = (js.match(/__dsl_index__/g) || []).length;
  assert(idxCount >= 2, `expected ≥2 __dsl_index__, got ${idxCount}`);
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
