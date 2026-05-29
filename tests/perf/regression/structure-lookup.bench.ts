// ======================================================================
//  structure-lookup.bench.ts — чтение ключей Структуры
//
//  Сценарии:
//    structure-lookup.existing:  чтение существующего ключа (hot path)
//    structure-lookup.missing:   чтение отсутствующего ключа (slow path → Неопределено)
//    structure-lookup.many:      чтение из структуры с 50 ключами (реалистичный сценарий)
//
//  read-only, shared структура через setup().
// ======================================================================

import type { BenchmarkScenario, BenchmarkRuntime } from "../types";
import { compileBench, execContext, createContext } from "../harness";

const MANY_KEYS = Array.from({ length: 50 }, (_, i) => `"К${i}", ${i}`).join(", ");

const SETUP_EXISTING_DSL = `
Структура = Новый Структура("К1", 1, "К2", 2, "К3", 3);
`;

const SETUP_MANY_DSL = `
Структура = Новый Структура(${MANY_KEYS});
`;

const EXISTING_DSL = `
Процедура Benchmark()
  a = Структура["К1"];
  b = Структура["К2"];
  c = Структура["К3"];
КонецПроцедуры
Benchmark();
`;

const MISSING_DSL = `
Процедура Benchmark()
  a = Структура["NonExistentKey"];
КонецПроцедуры
Benchmark();
`;

const MANY_DSL = `
Процедура Benchmark()
  a = Структура["К0"];
  b = Структура["К25"];
  c = Структура["К49"];
КонецПроцедуры
Benchmark();
`;

const compiledSetupExisting = compileBench(SETUP_EXISTING_DSL);
const compiledSetupMany = compileBench(SETUP_MANY_DSL);
const compiledExisting = compileBench(EXISTING_DSL);
const compiledMissing = compileBench(MISSING_DSL);
const compiledMany = compileBench(MANY_DSL);

export const scenarios: BenchmarkScenario[] = [
  {
    def: {
      name: "structure-lookup.existing",
      baselineKey: "structure-lookup.existing",
      tags: ["lookup", "structure"],
      category: "lookup",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      const ctx = createContext();
      execContext(ctx, compiledSetupExisting);
      return { context: ctx, compiled: compiledExisting };
    },
    execute(rt: BenchmarkRuntime) {
      execContext(rt.context, rt.compiled);
    },
  },
  {
    def: {
      name: "structure-lookup.missing",
      baselineKey: "structure-lookup.missing",
      tags: ["lookup", "structure", "slow-path"],
      category: "lookup",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      const ctx = createContext();
      execContext(ctx, compiledSetupExisting);
      return { context: ctx, compiled: compiledMissing };
    },
    execute(rt: BenchmarkRuntime) {
      execContext(rt.context, rt.compiled);
    },
  },
  {
    def: {
      name: "structure-lookup.many-keys",
      baselineKey: "structure-lookup.many-keys",
      tags: ["lookup", "structure"],
      category: "lookup",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      const ctx = createContext();
      execContext(ctx, compiledSetupMany);
      return { context: ctx, compiled: compiledMany };
    },
    execute(rt: BenchmarkRuntime) {
      execContext(rt.context, rt.compiled);
    },
  },
];
