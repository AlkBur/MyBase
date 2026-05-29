// ======================================================================
//  compilation.bench.ts — 3 этапа компиляции
//
//  1. parse+lower:       полный цикл компиляции (tokenizer + parser + lowering)
//  2. sandbox-build:     new Function() из уже готового JS
//  3. runtime-cache-hit: кэш-хит в ServerRuntime (только lookup)
//
//  Разделение важно: при добавлении member dispatch overhead может
//  быть в lowering (compile.ts), а не в sandbox или cache.
// ======================================================================

import type { BenchmarkScenario, BenchmarkRuntime } from "../types";
import type { BenchmarkScenario as Scenario } from "../types";
import { compileBench, execContext, createContext } from "../harness";
import { compile } from "../../../compiler/compile";
import { serverCapabilities } from "../../../runtime/server/capabilities";

// ---- общий код для компиляции ----

const COMPILE_CODE = `
Т = Новый ТаблицаЗначений;
Т.Колонки.Добавить("К1");
Т.Колонки.Добавить("К2");
Для i = 1 по 100 Цикл
  Стр = Т.Добавить();
  Стр.К1 = i;
  Стр.К2 = "str" + i;
КонецЦикла;

Процедура Поиск()
  Результат = Т.НайтиСтроки(Новый Структура("К1", 50));
КонецПроцедуры

Поиск();
`;

// ---- 1. parse+lower ----

export const scenarios: Scenario[] = [
  {
    def: {
      name: "compilation.parse-lower",
      baselineKey: "compilation.parse-lower",
      tags: ["compilation"],
      category: "compilation",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: false },
    },
    setup(): BenchmarkRuntime {
      // Нам не нужен context для compile-only теста, но createContext нужен для проформы
      return { context: createContext(), compiled: compileBench("") };
    },
    execute(_rt: BenchmarkRuntime) {
      compile(COMPILE_CODE, serverCapabilities);
    },
  },
  // ---- 2. sandbox-build (new Function из JS) ----
  {
    def: {
      name: "compilation.sandbox-build",
      baselineKey: "compilation.sandbox-build",
      tags: ["compilation"],
      category: "compilation",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: false },
    },
    setup(): BenchmarkRuntime {
      // Предварительно компилируем, чтобы получить jsCode
      const { jsCode } = compile(COMPILE_CODE, serverCapabilities);
      return {
        context: createContext(),
        compiled: { jsCode, fn: null as any, builtins: null as any },
      };
    },
    execute(rt: BenchmarkRuntime) {
      // Полная сигнатура sandbox (синхронизирована с ServerRuntime.buildSandboxFn)
      new Function(
        "context", "__dsl_db__", "__dsl_Query__",
        "__dsl_log__", "__dsl_currentDate__", "__dsl_format__",
        "__dsl_strStartsWith__", "__dsl_strEndsWith__",
        "__dsl_strSplit__", "__dsl_strConcat__", "__dsl_strCompare__",
        "__dsl_strFind__", "__dsl_strMid__", "__dsl_strTemplate__", "__dsl_nstr__",
        "__dsl_newArray__", "__dsl_newFixedArray__", "__dsl_newStructure__",
        "__dsl_newValueTable__", "__dsl_newTypeDescription__",
        "__dsl_newMap__", "__dsl_newFixedMap__", "__dsl_newUUID__",
        "__dsl_type__", "__dsl_typeOf__", "__dsl_add__", "__dsl_string__",
        "__dsl_strGetLine__", "__dsl_index__", "__dsl_errorInfo__",
        "__dsl_strIsEmpty__", "__dsl_trim__", "__dsl_charCode__",
        "__dsl_number__", "__dsl_currentUniversalDateInMillis__",
        "__dsl_newStringQualifiers__",
        "__dsl_eval__", "__dsl_exec__", "__dsl_RuntimeError__",
        "__dsl_index_set__",
        rt.compiled.jsCode,
      );
    },
  },
  // ---- 3. runtime-cache-hit (lookup в Map) ----
  {
    def: {
      name: "compilation.runtime-cache-hit",
      baselineKey: "compilation.runtime-cache-hit",
      tags: ["compilation"],
      category: "compilation",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: false },
    },
    setup(): BenchmarkRuntime {
      const cache = new Map<string, any>();
      const key = "test|code";
      // Прогреваем кэш
      cache.set(key, { jsCode: "", fn: () => {} });
      return {
        context: Object.assign(createContext(), { __cache__: cache }),
        compiled: { jsCode: "", fn: null as any, builtins: null as any },
      };
    },
    execute(rt: BenchmarkRuntime) {
      (rt.context as any).__cache__.get("test|code");
    },
  },
];
