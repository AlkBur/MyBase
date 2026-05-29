// ======================================================================
//  native-comparison.bench.ts — JS vs DSL overhead telemetry
//
//  Tier B: TRANSIENT ONLY. НЕ сохраняется в baseline.
//  Информационный — показывает overhead DSL dispatch vs native JS.
//
//  Запускается отдельно:
//    bun run tests/perf/perf.ts --tag native
// ======================================================================

import type { BenchmarkScenario, BenchmarkRuntime } from "../types";
import { compileBench, execContext, createContext } from "../harness";

// ======================================================================
//  1. Структура dot-access
// ======================================================================

const STRUCT_SETUP_DSL = `
Структура = Новый Структура("К1", 1, "К2", 2, "К3", 3, "К4", 4, "К5", 5);
`;

const STRUCT_DOT_DSL = `
Процедура Benchmark()
  a = Структура.К1;
  b = Структура.К2;
  c = Структура.К3;
КонецПроцедуры
Benchmark();
`;

const compiledStructSetup = compileBench(STRUCT_SETUP_DSL);
const compiledStructDot = compileBench(STRUCT_DOT_DSL);

// ======================================================================
//  2. Массив bracket access
// ======================================================================

const ARRAY_SETUP_DSL = `
М = Новый Массив;
Для i = 1 по 100 Цикл
  М.Добавить(i);
КонецЦикла;
`;

const ARRAY_BRACKET_DSL = `
Процедура Benchmark()
  a = М[0];
  b = М[50];
  c = М[99];
КонецПроцедуры
Benchmark();
`;

const compiledArraySetup = compileBench(ARRAY_SETUP_DSL);
const compiledArrayBracket = compileBench(ARRAY_BRACKET_DSL);

// ======================================================================
//  JS versions (pure TS, inside benchmark fn)
// ======================================================================

function jsStructDot(): void {
  const s: Record<string, number> = { k1: 1, k2: 2, k3: 3, k4: 4, k5: 5 };
  let a = s.k1;
  let b = s.k2;
  let c = s.k3;
}

function jsArrayBracket(): void {
  const arr = Array.from({ length: 100 }, (_, i) => i);
  let a = arr[0];
  let b = arr[50];
  let c = arr[99];
}

// ======================================================================
//  scenarios (DSL + JS side by side)
// ======================================================================

export const scenarios: BenchmarkScenario[] = [
  // ---- DSL: structure dot ----
  {
    def: {
      name: "native.structure-dot-dsl",
      baselineKey: "native.structure-dot-dsl",
      tags: ["native", "structure", "dsl"],
      category: "dispatch",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      const ctx = createContext();
      execContext(ctx, compiledStructSetup);
      return { context: ctx, compiled: compiledStructDot };
    },
    execute(rt: BenchmarkRuntime) {
      execContext(rt.context, rt.compiled);
    },
  },
  // ---- JS: structure dot ----
  {
    def: {
      name: "native.structure-dot-js",
      baselineKey: "native.structure-dot-js",
      tags: ["native", "structure", "js"],
      category: "dispatch",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      return { context: {}, compiled: null as any };
    },
    execute(_rt: BenchmarkRuntime) {
      jsStructDot();
    },
  },
  // ---- DSL: array bracket ----
  {
    def: {
      name: "native.array-bracket-dsl",
      baselineKey: "native.array-bracket-dsl",
      tags: ["native", "array", "dsl"],
      category: "dispatch",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      const ctx = createContext();
      execContext(ctx, compiledArraySetup);
      return { context: ctx, compiled: compiledArrayBracket };
    },
    execute(rt: BenchmarkRuntime) {
      execContext(rt.context, rt.compiled);
    },
  },
  // ---- JS: array bracket ----
  {
    def: {
      name: "native.array-bracket-js",
      baselineKey: "native.array-bracket-js",
      tags: ["native", "array", "js"],
      category: "dispatch",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      return { context: {}, compiled: null as any };
    },
    execute(_rt: BenchmarkRuntime) {
      jsArrayBracket();
    },
  },
];
