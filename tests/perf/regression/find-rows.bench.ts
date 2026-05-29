// ======================================================================
//  find-rows.bench.ts — НайтиСтроки на ТаблицаЗначений (linear scan)
//
//  Сценарий:
//    find-rows.linear-100: поиск по таблице из 100 строк, без индекса
//
//  Future slots (v1.5+):
//    findrows-indexed: hash-index fast path
//    findrows-miss:    worst case (значение отсутствует)
//    findrows-hit:     hot path (первая строка)
// ======================================================================

import type { BenchmarkScenario, BenchmarkRuntime } from "../types";
import { compileBench, execContext, createContext } from "../harness";

function createFindRowsScenario(rows: number): BenchmarkScenario {
  const baselineKey = `find-rows.linear-${rows}`;

  const SETUP_DSL = `
    Т = Новый ТаблицаЗначений;
    Т.Колонки.Добавить("К1");
    Т.Колонки.Добавить("К2");
    Для i = 1 по ${rows} Цикл
      Стр = Т.Добавить();
      Стр.К1 = i;
      Стр.К2 = "str" + i;
    КонецЦикла;
  `;

  const BENCH_DSL = `
    Процедура Benchmark()
      Результат = Т.НайтиСтроки(Новый Структура("К1", ${rows}));
    КонецПроцедуры
    Benchmark();
  `;

  const compiledSetup = compileBench(SETUP_DSL);
  const compiledBench = compileBench(BENCH_DSL);

  return {
    def: {
      name: `find-rows.linear-${rows}`,
      baselineKey,
      tags: ["collection", "find-rows", "linear"],
      category: "collection",
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
  createFindRowsScenario(100),
];
