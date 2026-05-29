// ======================================================================
//  table-iteration.bench.ts — Для Каждого Цикл по ТаблицаЗначений
//
//  Параметризованный: замеряет O(n) scaling
//    10 rows:    микротаблица
//    100 rows:   средняя
//    1000 rows:  большая (покажет dispatch overhead amplification)
//
//  read-only (сумма по колонке).
// ======================================================================

import type { BenchmarkScenario, BenchmarkRuntime } from "../types";
import { compileBench, execContext, createContext } from "../harness";

function createIterationScenario(rows: number): BenchmarkScenario {
  const baselineKey = `table-iteration.${rows}`;
  const rowsStr = String(rows);

  const SETUP_DSL = `
    Т = Новый ТаблицаЗначений;
    Т.Колонки.Добавить("К1");
    Для i = 1 по ${rowsStr} Цикл
      Стр = Т.Добавить();
      Стр.К1 = i;
    КонецЦикла;
  `;

  const BENCH_DSL = `
    Процедура Benchmark()
      Сумма = 0;
      Для Каждого Стр Из Т Цикл
        Сумма = Сумма + Стр.К1;
      КонецЦикла;
    КонецПроцедуры
    Benchmark();
  `;

  const compiledSetup = compileBench(SETUP_DSL);
  const compiledBench = compileBench(BENCH_DSL);

  return {
    def: {
      name: `table-iteration.${rows}`,
      baselineKey,
      tags: ["iteration", "collection"],
      category: "iteration",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
      params: { rows },
    },
    setup(): BenchmarkRuntime {
      const ctx = createContext();
      execContext(ctx, compiledSetup);
      return { context: ctx, compiled: compiledBench };
    },
    execute(rt: BenchmarkRuntime) {
      execContext(rt.context, rt.compiled);
    },
  };
}

export const scenarios: BenchmarkScenario[] = [
  createIterationScenario(10),
  createIterationScenario(100),
  createIterationScenario(1000),
];
