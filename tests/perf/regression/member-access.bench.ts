// ======================================================================
//  member-access.bench.ts — 3 сценария доступа к членам Структуры
//
//  Двухфазный подход:
//    1. setup() — создаёт Структуру один раз через setup-код
//    2. execute() — только Benchmark() на том же контексте
//
//  Сценарии:
//    structure-dot:     obj.Свойство (dot-access)
//    structure-bracket: obj["Свойство"] (bracket-access через __dsl_index__)
//    mixed-hot:         чередование dot и bracket (реалистичная нагрузка)
// ======================================================================

import type { BenchmarkScenario, BenchmarkRuntime } from "../types";
import { compileBench, execContext, createContext } from "../harness";

// ---- Setup (структура создаётся один раз) ----
const SETUP_DSL = `
Процедура Init()
  Структура = Новый Структура("К1", 1, "К2", 2, "К3", 3, "К4", 4, "К5", 5);
КонецПроцедуры
Init();
`;

// ---- Benchmark (замеряется только доступ) ----

const DOT_DSL = `
Процедура Benchmark()
  a = Структура.К1;
  b = Структура.К2;
  c = Структура.К3;
  d = Структура.К4;
  e = Структура.К5;
КонецПроцедуры
Benchmark();
`;

const BRACKET_DSL = `
Процедура Benchmark()
  a = Структура["К1"];
  b = Структура["К2"];
  c = Структура["К3"];
  d = Структура["К4"];
  e = Структура["К5"];
КонецПроцедуры
Benchmark();
`;

const MIXED_DSL = `
Процедура Benchmark()
  a = Структура.К1;
  b = Структура["К2"];
  c = Структура.К3;
  d = Структура["К4"];
  e = Структура.К5;
КонецПроцедуры
Benchmark();
`;

// ---- compiled artifacts (один раз) ----

const compiledSetup = compileBench(SETUP_DSL);
const compiledDot = compileBench(DOT_DSL);
const compiledBracket = compileBench(BRACKET_DSL);
const compiledMixed = compileBench(MIXED_DSL);

// ---- сценарии ----

function createAccessScenario(
  name: string,
  baselineKey: string,
  compiledBench: ReturnType<typeof compileBench>,
): BenchmarkScenario {
  return {
    def: {
      name,
      baselineKey,
      tags: ["dispatch", "member-access", "read-only"],
      category: "dispatch",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      const ctx = createContext();
      // Setup: создаём структуру один раз на этом контексте
      execContext(ctx, compiledSetup);
      return { context: ctx, compiled: compiledBench };
    },
    execute(rt: BenchmarkRuntime) {
      execContext(rt.context, rt.compiled);
    },
  };
}

export const scenarios: BenchmarkScenario[] = [
  createAccessScenario("member-access.structure-dot", "member-access.structure-dot", compiledDot),
  createAccessScenario("member-access.structure-bracket", "member-access.structure-bracket", compiledBracket),
  createAccessScenario("member-access.mixed-hot", "member-access.mixed-hot", compiledMixed),
];
