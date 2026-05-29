// ======================================================================
//  row-access.bench.ts — доступ к ValueTableRow через ["К1"]
//
//  Сценарий:
//    row-access.warm: bracket-read существующей колонки (hot path)
//
//  read-only, shared таблица через setup().
// ======================================================================

import type { BenchmarkScenario, BenchmarkRuntime } from "../types";
import { compileBench, execContext, createContext } from "../harness";

const SETUP_DSL = `
Т = Новый ТаблицаЗначений;
Т.Колонки.Добавить("К1");
Т.Колонки.Добавить("К2");
Стр = Т.Добавить();
Стр.К1 = 42;
Стр.К2 = "Hello";
`;

const WARM_DSL = `
Процедура Benchmark()
  a = Стр["К1"];
  b = Стр["К2"];
  a = Стр["К1"];
  b = Стр["К2"];
  a = Стр["К1"];
  b = Стр["К2"];
КонецПроцедуры
Benchmark();
`;

const compiledSetup = compileBench(SETUP_DSL);
const compiledWarm = compileBench(WARM_DSL);

export const scenarios: BenchmarkScenario[] = [
  {
    def: {
      name: "row-access.warm",
      baselineKey: "row-access.warm",
      tags: ["dispatch", "row-access"],
      category: "dispatch",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      const ctx = createContext();
      execContext(ctx, compiledSetup);
      return { context: ctx, compiled: compiledWarm };
    },
    execute(rt: BenchmarkRuntime) {
      execContext(rt.context, rt.compiled);
    },
  },
];
