// ======================================================================
//  member-get.bench.ts — microbench для __dsl_member_get__ dispatch
//
//  Измеряет накладные расходы вызова __dsl_member_get__ напрямую
//  (без lowering, без компиляции DSL).
//
//  Это instrumentation baseline для B1.2 (когда compile.ts начнёт
//  эмитить __dsl_member_get__) и canary для v1.5 (shape cache).
//
//  IMPORTANT:
//    Absolute ns values are noisy on Bun/Windows.
//    Relative ratios between scenarios are the primary signal.
//
//  Сценарии:
//    direct-js              — raw JS property access (floor)
//    plain-fallback         — builtin call → dispatchMemberGet → obj?.[prop]
//    registered             — registry lookup + indirect handler call
//    registered-nullproto   — то же, target с Object.create(null)
//
//  Ключевая метрика:
//    registered.medianNs - plain-fallback.medianNs = стоимость абстракции
// ======================================================================

import type { BenchmarkScenario, BenchmarkRuntime } from "../types";
import { createBuiltins, type BuiltinFactories } from "../../../runtime/shared/builtins";
import {
  registerMemberGetter,
  sealMemberRegistry,
} from "../../../runtime/shared/member-dispatch";

// ======================================================================
//  Module-scope allocation (один раз, вне замера)
// ======================================================================

/**
 * Создаёт объект с null prototype и стабильным shape.
 * Object.assign на Object.create(null) даёт детерминированный
 * hidden class — без incremental transitions.
 */
function createNullProtoObj(): Record<string, unknown> {
  return Object.assign(Object.create(null), {
    __dsl_type__: "test-null" as string,
    prop: 42,
    other: 7,
  });
}

// Стабилизированные объекты — одинаковый property layout
const plainObj: Record<string, unknown> = { prop: 42, other: 7 };
const regObj: Record<string, unknown> = { __dsl_type__: "test", prop: 42, other: 7 };
const nullObj = createNullProtoObj();

// Builtins factory — один раз
const builtins = createBuiltins([]);

// Registry запечатан после регистрации — стабильные JIT assumptions
registerMemberGetter("test", (target: any, prop: string) => target[prop]);
registerMemberGetter("test-null", (target: any, prop: string) => target[prop]);
sealMemberRegistry();

// Prop cycling — branchless (i & 1 вместо i % 2)
const props = ["prop", "other"];

// Sink — предотвращает dead-code elimination JIT'ом
let sink = 0;

// ======================================================================
//  Helper: создаёт BenchmarkScenario для одного сценария member-get
// ======================================================================

function createMemberGetScenario(
  name: string,
  baselineKey: string,
  obj: Record<string, unknown>,
  useBuiltin: boolean,
): BenchmarkScenario {
  return {
    def: {
      name,
      baselineKey,
      tags: ["dispatch", "micro", "member-get"],
      category: "dispatch",
      meta: { deterministic: true, mutatesState: false, requiresWarmup: true },
    },
    setup(): BenchmarkRuntime {
      return { context: {}, compiled: null as any };
    },
    execute(_rt: BenchmarkRuntime): void {
      if (useBuiltin) {
        sink ^= builtins.__dsl_member_get__(obj, props[sink & 1]) ? 1 : 0;
      } else {
        sink ^= obj[props[sink & 1]] ? 1 : 0;
      }
    },
  };
}

// ======================================================================
//  Scenarios
// ======================================================================

export const scenarios: BenchmarkScenario[] = [
  // 1. Direct JS — raw property access, floor benchmark
  createMemberGetScenario(
    "member-get.direct-js",
    "member-get.direct-js",
    plainObj,
    false,
  ),

  // 2. Plain fallback — builtin call → dispatchMemberGet → obj?.[prop]
  createMemberGetScenario(
    "member-get.plain-fallback",
    "member-get.plain-fallback",
    plainObj,
    true,
  ),

  // 3. Registered — registry lookup + indirect handler call
  createMemberGetScenario(
    "member-get.registered",
    "member-get.registered",
    regObj,
    true,
  ),

  // 4. Registered, null prototype — как registered, но target без prototype chain
  createMemberGetScenario(
    "member-get.registered-nullproto",
    "member-get.registered-nullproto",
    nullObj,
    true,
  ),
];
