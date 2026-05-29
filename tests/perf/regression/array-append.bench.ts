// ======================================================================
//  array-append.bench.ts — Добавить в Массив
//
//  Self-resetting: каждая итерация создаёт новый массив внутри Benchmark().
//  Не требует reset между замерами — новый массив на каждый вызов.
// ======================================================================

import type { BenchmarkScenario, BenchmarkRuntime } from "../types";
import { compileBench, execContext, createContext } from "../harness";

function createAppendScenario(count: number): BenchmarkScenario {
  const baselineKey = `array-append.${count}`;
  const countStr = String(count);

  const DSL = `
    Процедура Benchmark()
      М = Новый Массив;
      Для i = 1 по ${countStr} Цикл
        М.Добавить(i);
      КонецЦикла;
    КонецПроцедуры
    Benchmark();
  `;

  const compiled = compileBench(DSL);

  return {
    def: {
      name: `array-append.${count}`,
      baselineKey,
      tags: ["collection", "array", "append"],
      category: "collection",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
      params: { count },
    },
    setup(): BenchmarkRuntime {
      return { context: createContext(), compiled };
    },
    execute(rt: BenchmarkRuntime) {
      execContext(rt.context, rt.compiled);
    },
  };
}

export const scenarios: BenchmarkScenario[] = [
  createAppendScenario(10),
  createAppendScenario(100),
];
