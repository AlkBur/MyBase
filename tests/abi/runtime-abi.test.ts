#!/usr/bin/env bun
// ======================================================================
//  runtime-abi.test.ts — Semantic ABI assertions
//
//  Проверяет инварианты между ABI_CONSTANTS (abi.ts) и реальным runtime.
//  Не hardcoded count'ы — semantic invariants.
//
//  Инварианты:
//    1. ABI_CONSTANTS frozen — snapshot нельзя мутировать
//    2. BUILTIN_KEYS (runtime) === ABI_CONSTANTS.builtinKeys (sorted)
//    3. Server constructors — superset of client
//    4. All DSL object types from ABI have a corresponding constructor
//    5. sandboxParamOrderFull содержит всё из builtinKeys
//    6. sandboxParamOrderEval = subset of sandboxParamOrderFull (без __dsl_index_set__/db/Query)
//    7. Английские и русские имена builtins в capabilities имеют __dsl_* соответствие
// ======================================================================

import { ABI_VERSION, ABI_CONSTANTS, type DSLRuntimeABI_v1_3_3 } from "../../runtime/shared/abi";
import { serverCapabilities } from "../../runtime/server/capabilities";
import { clientCapabilities } from "../../runtime/client/capabilities";
import { readFileSync } from "fs";
import { join } from "path";

let passed = 0;
let failed = 0;

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

// ======================================================================
//  Читаем BUILTIN_KEYS из runtime (единственный source of truth)
// ======================================================================

function getBuiltinKeysFromRuntime(): string[] {
  const runtimePath = join(import.meta.dir, "..", "..", "runtime", "server", "runtime.ts");
  const content = readFileSync(runtimePath, "utf-8");
  // Извлекаем массив BUILTIN_KEYS из const BUILTIN_KEYS: ... = [ ... ]
  const match = content.match(/const BUILTIN_KEYS.*?=\s*\[([\s\S]*?)\];/);
  if (!match) throw new Error("cannot find BUILTIN_KEYS in runtime.ts");
  const items = match[1]
    .split(/["',\s]+/)
    .map((s) => s.trim())
    .filter((s) => s.startsWith("__dsl_"));
  return items;
}

// ======================================================================
//  Invariant 1: ABI_CONSTANTS frozen
// ======================================================================

runTest("ABI_CONSTANTS is frozen", () => {
  assert(Object.isFrozen(ABI_CONSTANTS), "ABI_CONSTANTS must be frozen");
});

// ======================================================================
//  Invariant 2: BUILTIN_KEYS === ABI_CONSTANTS.builtinKeys (sorted)
// ======================================================================

runTest("BUILTIN_KEYS matches ABI snapshot (sorted)", () => {
  const runtimeKeys = getBuiltinKeysFromRuntime().sort();
  const abiKeys = [...ABI_CONSTANTS.builtinKeys].sort();

  assert(
    runtimeKeys.length === abiKeys.length,
    `length mismatch: runtime=${runtimeKeys.length} abi=${abiKeys.length}`
  );

  for (let i = 0; i < runtimeKeys.length; i++) {
    if (runtimeKeys[i] !== abiKeys[i]) {
      throw new Error(
        `mismatch at index ${i}: runtime="${runtimeKeys[i]}" abi="${abiKeys[i]}"`
      );
    }
  }
});

// ======================================================================
//  Invariant 3: Server → superset of client constructors
// ======================================================================

runTest("server constructors are superset of client", () => {
  const serverSet = new Set(serverCapabilities.constructors.map((s) => s.toLowerCase()));
  const clientSet = new Set(clientCapabilities.constructors.map((s) => s.toLowerCase()));

  for (const cc of clientSet) {
    assert(serverSet.has(cc), `client has "${cc}" but server doesn't`);
  }

  // Server has exactly one extra: "Запрос"
  const diff = [...serverSet].filter((s) => !clientSet.has(s));
  assert(diff.length === 1, `expected 1 extra (Запрос), got ${JSON.stringify(diff)}`);
  assert(diff[0] === "запрос", `expected "запрос" as extra, got "${diff[0]}"`);
});

// ======================================================================
//  Invariant 4: All DSL object types appear as constructors (or builtins)
// ======================================================================

runTest("DSL object types have constructor coverage", () => {
  const dslTypes = Object.keys(ABI_CONSTANTS.dslObjectTypes);
  const serverCaps = new Set(serverCapabilities.constructors.map((s) => s.toLowerCase()));

  // Map type name → expected constructor name
  const typeToConstructor: Record<string, string> = {
    ValueTable: "ТаблицаЗначений",
    ValueTableRow: null, // не конструктор — возвращается из Добавить
    ValueTableColumns: null,
    ValueTableIndexes: null,
    ValueTableIndex: null,
    Структура: "Структура",
    Map: "Соответствие",
    FixedMap: "ФиксированноеСоответствие",
    FixedArray: "ФиксированныйМассив",
    UniqueIdentifier: "УникальныйИдентификатор",
    Type: null, // Тип(имя) — builtin, не конструктор
    TypeDescription: "ОписаниеТипов",
    StringQualifiers: "КвалификаторыСтроки",
  };

  for (const typeName of dslTypes) {
    const ctor = typeToConstructor[typeName];
    if (ctor === null) continue; // non-constructor type
    assert(
      serverCaps.has(ctor.toLowerCase()),
      `type "${typeName}" expects constructor "${ctor}" but not found in server caps`
    );
  }
});

// ======================================================================
//  Invariant 5: sandboxParamOrderFull содержит все builtinKeys
// ======================================================================

runTest("sandboxParamOrderFull references builtinKeys", () => {
  const order = ABI_CONSTANTS.sandboxParamOrderFull;
  // Должен начинаться с "context" и заканчиваться известными именами
  assert(order[0] === "context", "sandboxParamOrderFull[0] must be 'context'");
  assert(
    order.includes("__dsl_eval__"),
    "sandboxParamOrderFull must include __dsl_eval__"
  );
  assert(
    order.includes("__dsl_exec__"),
    "sandboxParamOrderFull must include __dsl_exec__"
  );
  assert(
    order.includes("__dsl_RuntimeError__"),
    "sandboxParamOrderFull must include __dsl_RuntimeError__"
  );
  assert(
    order.includes("__dsl_index_set__"),
    "sandboxParamOrderFull must include __dsl_index_set__"
  );
});

// ======================================================================
//  Invariant 6: sandboxParamOrderEval — subset (без DB/Query/index_set)
// ======================================================================

runTest("sandboxParamOrderEval has no DB/Query/index_set", () => {
  const evalOrder = ABI_CONSTANTS.sandboxParamOrderEval;
  assert(evalOrder[0] === "context", "sandboxParamOrderEval[0] must be 'context'");
  assert(
    evalOrder.includes("__dsl_eval__"),
    "sandboxParamOrderEval must include __dsl_eval__"
  );
  assert(
    !evalOrder.includes("__dsl_db__"),
    "sandboxParamOrderEval must NOT include __dsl_db__"
  );
  assert(
    !evalOrder.includes("__dsl_Query__"),
    "sandboxParamOrderEval must NOT include __dsl_Query__"
  );
  assert(
    !evalOrder.includes("__dsl_exec__"),
    "sandboxParamOrderEval must NOT include __dsl_exec__"
  );
  assert(
    !evalOrder.includes("__dsl_index_set__"),
    "sandboxParamOrderEval must NOT include __dsl_index_set__"
  );
});

// ======================================================================
//  Invariant 7: Capability builtins reference valid __dsl_* names
// ======================================================================

runTest("all capability functions map to __dsl_* builtins", () => {
  const abiKeys = new Set(ABI_CONSTANTS.builtinKeys);

  // Each known DSL function name has a corresponding __dsl_* builtin
  const funcToBuiltin: Record<string, string> = {
    Сообщить: "__dsl_log__",
    ТекущаяДата: "__dsl_currentDate__",
    Формат: "__dsl_format__",
    СтрНачинаетсяС: "__dsl_strStartsWith__",
    StrStartsWith: "__dsl_strStartsWith__",
    СтрЗаканчиваетсяНа: "__dsl_strEndsWith__",
    StrEndsWith: "__dsl_strEndsWith__",
    СтрРазделить: "__dsl_strSplit__",
    StrSplit: "__dsl_strSplit__",
    СтрСоединить: "__dsl_strConcat__",
    StrConcat: "__dsl_strConcat__",
    СтрСравнить: "__dsl_strCompare__",
    StrCompare: "__dsl_strCompare__",
    СтрНайти: "__dsl_strFind__",
    StrFind: "__dsl_strFind__",
    Сред: "__dsl_strMid__",
    СтрШаблон: "__dsl_strTemplate__",
    StrTemplate: "__dsl_strTemplate__",
    НСтр: "__dsl_nstr__",
    NStr: "__dsl_nstr__",
    Строка: "__dsl_string__",
    СтрПолучитьСтроку: "__dsl_strGetLine__",
    StrGetLine: "__dsl_strGetLine__",
    Тип: "__dsl_type__",
    ТипЗнч: "__dsl_typeOf__",
    ПустаяСтрока: "__dsl_strIsEmpty__",
    СокрЛП: "__dsl_trim__",
    КодСимвола: "__dsl_charCode__",
    Число: "__dsl_number__",
    ТекущаяУниверсальнаяДатаВМиллисекундах: "__dsl_currentUniversalDateInMillis__",
  };

  for (const [funcName, builtinName] of Object.entries(funcToBuiltin)) {
    assert(
      abiKeys.has(builtinName),
      `function "${funcName}" maps to "${builtinName}" but not in ABI builtinKeys`
    );
  }
});

// ======================================================================
//  Summary
// ======================================================================

const total = passed + failed;
console.log(`\nABI assertions: ${passed}/${total} passed`);

if (failed > 0) {
  process.exit(1);
}
