// ======================================================================
//  Benchmark harness — P.0 Benchmark System
//
//  Не использует Bun.bench() (недоступен в Bun 1.3.14 на Windows).
//  Использует Bun.nanoseconds() для high-precision timing.
//
//  Warmup policy:
//    - fixed: 10 000 iterations (JIT compilation + stabilization)
//    - iterated: until coefficient of variation < 5% (min 20)
//
//  Primary metric: medianNs — устойчива к GC pauses и deoptimizations.
// ======================================================================

import { compile } from "../../compiler/compile";
import { createBuiltins, type BuiltinFactories } from "../../runtime/shared/builtins";
import type { RuntimeCapabilities } from "../../runtime/shared/types";
import { RUNTIME_VERSION } from "../../runtime/shared/types";
import { DSRuntimeError } from "../../runtime/shared/errors";
import { serverCapabilities } from "../../runtime/server/capabilities";
import type {
  CompiledBenchmark,
  BenchmarkRuntime,
  BenchmarkScenario,
  NormalizedBenchResult,
  BenchmarkReport,
  BaselineSnapshot,
} from "./types";

// ======================================================================
//  BUILTIN_KEYS — порядок builtins в sandbox fn (синхронизирован с runtime.ts)
// ======================================================================

const BUILTIN_KEYS: (keyof BuiltinFactories)[] = [
  "__dsl_log__",
  "__dsl_currentDate__",
  "__dsl_format__",
  "__dsl_strStartsWith__",
  "__dsl_strEndsWith__",
  "__dsl_strSplit__",
  "__dsl_strConcat__",
  "__dsl_strCompare__",
  "__dsl_strFind__",
  "__dsl_strMid__",
  "__dsl_strTemplate__",
  "__dsl_nstr__",
  "__dsl_newArray__",
  "__dsl_newFixedArray__",
  "__dsl_newStructure__",
  "__dsl_newValueTable__",
  "__dsl_newTypeDescription__",
  "__dsl_newMap__",
  "__dsl_newFixedMap__",
  "__dsl_newUUID__",
  "__dsl_type__",
  "__dsl_typeOf__",
  "__dsl_add__",
  "__dsl_string__",
  "__dsl_strGetLine__",
  "__dsl_index__",
  "__dsl_errorInfo__",
  "__dsl_strIsEmpty__",
  "__dsl_trim__",
  "__dsl_charCode__",
  "__dsl_number__",
  "__dsl_currentUniversalDateInMillis__",
  "__dsl_newStringQualifiers__",
];

/** Преобразует объект builtins в массив значений в порядке BUILTIN_KEYS */
export function builtinValues(builtins: BuiltinFactories): any[] {
  return BUILTIN_KEYS.map((k) => (builtins as any)[k]);
}

// ======================================================================
//  execContext — выполняет скомпилированный DSL-код на существующем контексте
//
//  Используется для двухфазных сценариев: setup() запускает init-код,
//  execute() запускает benchmark-код на том же контексте.
//  В отличие от runSandbox(), не создаёт новый контекст.
// ======================================================================

export function execContext(ctx: Record<string, any>, compiled: CompiledBenchmark): unknown {
  const { fn, builtins } = compiled;
  return fn(
    ctx,
    null,                              // __dsl_db__
    null,                              // __dsl_Query__ (stub)
    ...builtinValues(builtins),        // все builtins
    () => null,                        // __dsl_eval__ (stub)
    () => null,                        // __dsl_exec__ (stub)
    DSRuntimeError,                    // __dsl_RuntimeError__
    builtins.__dsl_index_set__,        // __dsl_index_set__
  );
}

// ======================================================================
//  CaseInsensitiveMap — упрощённая версия (без SQLite-зависимости)
// ======================================================================

class CaseInsensitiveMap {
  private data = Object.create(null);
  get(name: string): unknown { return this.data[name.toLowerCase()]; }
  set(name: string, value: unknown): void { this.data[name.toLowerCase()] = value; }
}

// ======================================================================
//  compileBench — компилирует DSL в CompiledBenchmark (immutable)
//
//  Использует compile() из compile.ts с serverCapabilities.
//  Создаёт sandbox function с той же сигнатурой, что и ServerRuntime.
//  Не требует SQLite — __dsl_db__ передаётся как null.
// ======================================================================

export function compileBench(code: string, caps?: RuntimeCapabilities): CompiledBenchmark {
  const effectiveCaps = caps ?? serverCapabilities;
  const { jsCode } = compile(code, effectiveCaps);
  const builtins = createBuiltins([]);

  // Сигнатура sandbox fn совпадает с ServerRuntime.buildSandboxFn():
  //   fn(context, __dsl_db__, __dsl_Query__, ...builtins, __dsl_eval__, __dsl_exec__, __dsl_RuntimeError__, __dsl_index_set__)
  const fn = new Function(
    "context",
    "__dsl_db__",
    "__dsl_Query__",
    ...BUILTIN_KEYS,
    "__dsl_eval__",
    "__dsl_exec__",
    "__dsl_RuntimeError__",
    "__dsl_index_set__",
    jsCode,
  );

  return { jsCode, fn, builtins };
}

// ======================================================================
//  createContext — создаёт контекст выполнения
//
//  Реплицирует ServerRuntime.createContext():
//    - CaseInsensitiveMap для __variables__ и __functions__
//    - __execDepth__ = 0
// ======================================================================

export function createContext(): Record<string, any> {
  return {
    __variables__: new CaseInsensitiveMap(),
    __functions__: new CaseInsensitiveMap(),
    __execDepth__: 0,
  };
}

// ======================================================================
//  runSandbox — выполняет скомпилированный DSL-код
//
//  Вызывает sandbox fn с правильными аргументами.
//  __dsl_db__ = null (SQLite не нужен для collection/dispatch бенчей).
//  __dsl_Query__ = null stub.
//  evalFn/execFn = stubs (без рекурсии).
// ======================================================================

export function runSandbox(rt: BenchmarkRuntime): unknown {
  const { fn, builtins } = rt.compiled;
  return fn(
    rt.context,
    null,                              // __dsl_db__
    null,                              // __dsl_Query__ (stub)
    ...builtinValues(builtins),        // все builtins
    () => null,                        // __dsl_eval__ (stub)
    () => null,                        // __dsl_exec__ (stub)
    DSRuntimeError,                    // __dsl_RuntimeError__
    builtins.__dsl_index_set__,        // __dsl_index_set__
  );
}

// ======================================================================
//  runScenario — выполняет один сценарий через Bun.nanoseconds()
//
//  Этапы:
//    1. setup() — создание runtime (один раз, вне замера)
//    2. Warmup — 10 000 итераций (JIT + стабилизация)
//    3. Measurement — N итераций с Bun.nanoseconds()
//    4. report — NormalizedBenchResult
// ======================================================================

export function runScenario(scenario: BenchmarkScenario): NormalizedBenchResult {
  // ---- setup (один раз) ----
  const rt = scenario.setup();

  // ---- warmup (10k iterations) ----
  if (scenario.def.meta.requiresWarmup) {
    for (let i = 0; i < 10000; i++) {
      if (scenario.reset && scenario.def.meta.mutatesState) {
        scenario.reset(rt);
      }
      scenario.execute(rt);
    }
  }

  // ---- measurement ----
  const samples: number[] = [];
  const targetSamples = 30; // достаточно для стабильной медианы

  // Определяем оптимальный batch size
  // Запускаем один раз, смотрим время
  const probeStart = Bun.nanoseconds();
  scenario.execute(rt);
  if (scenario.reset && scenario.def.meta.mutatesState) {
    scenario.reset(rt);
  }
  const probeNs = Bun.nanoseconds() - probeStart;

  // Если операция быстрая (< 10μs), делаем batch
  const batchSize = probeNs < 10000
    ? Math.max(1, Math.floor(100_000 / Math.max(1, probeNs)))
    : 1;

  for (let i = 0; i < targetSamples; i++) {
    if (scenario.reset && scenario.def.meta.mutatesState) {
      scenario.reset(rt);
    }

    const start = Bun.nanoseconds();
    for (let b = 0; b < batchSize; b++) {
      scenario.execute(rt);
    }
    const end = Bun.nanoseconds();

    samples.push((end - start) / batchSize);
  }

  // cleanup
  scenario.teardown?.(rt);

  // ---- statistics ----
  const sorted = [...samples].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const opsPerSec = Math.round(1e9 / mean);

  return {
    name: scenario.def.name,
    baselineKey: scenario.def.baselineKey,
    tags: [...scenario.def.tags],
    category: scenario.def.category,
    params: scenario.def.params ? { ...scenario.def.params } : undefined,
    opsPerSec,
    medianNs: Math.round(median),
    minNs: Math.round(min),
    maxNs: Math.round(max),
    samples: samples.length,
    status: "baseline-missing",
    runtimeVersion: RUNTIME_VERSION,
    bunVersion: Bun.version,
  };
}

// ======================================================================
//  runScenarios — запускает массив сценариев
// ======================================================================

export function runScenarios(scenarios: BenchmarkScenario[]): NormalizedBenchResult[] {
  return scenarios.map((s) => {
    console.error(`  ${s.def.name}...`);
    const result = runScenario(s);
    console.error(`    ${formatOps(result.opsPerSec)} ops/sec  median=${result.medianNs}ns`);
    return result;
  });
}

// ======================================================================
//  compareResults — сравнивает результаты с baseline
// ======================================================================

export function compareResults(
  results: NormalizedBenchResult[],
  baseline: BaselineSnapshot,
): NormalizedBenchResult[] {
  return results.map((r) => {
    const baselineEntry = baseline.benchmarks[r.baselineKey];
    if (!baselineEntry) {
      return { ...r, status: "baseline-missing" };
    }

    const relative = r.opsPerSec / baselineEntry.opsPerSec;
    const change = Math.round((relative - 1) * 1000) / 10; // в процентах

    let status: NormalizedBenchResult["status"];
    if (change > -5) status = "ok";
    else if (change > -15) status = "regression-watch";
    else status = "regression-flag";

    return {
      ...r,
      relativeToBaseline: change,
      status,
    };
  });
}

// ======================================================================
//  loadBaseline — загружает baseline из JSON
// ======================================================================

export async function loadBaseline(path: string): Promise<BaselineSnapshot | null> {
  try {
    const file = Bun.file(path);
    const exists = await file.exists();
    if (!exists) return null;
    return await file.json() as BaselineSnapshot;
  } catch {
    return null;
  }
}

// ======================================================================
//  formatReport — собирает BenchmarkReport
// ======================================================================

export function buildReport(results: NormalizedBenchResult[]): BenchmarkReport {
  const summary = { ok: 0, "regression-watch": 0, "regression-flag": 0, "baseline-missing": 0 };
  for (const r of results) {
    summary[r.status]++;
  }
  return {
    timestamp: new Date().toISOString(),
    bunVersion: Bun.version,
    runtimeVersion: RUNTIME_VERSION,
    results,
    summary,
  };
}

// ======================================================================
//  formatHuman — человекочитаемый вывод
// ======================================================================

export function formatHuman(report: BenchmarkReport, baselinePath?: string): string {
  const lines: string[] = [];
  lines.push("=== P.0 Benchmark Report ===");
  lines.push(`  Runtime: ${report.runtimeVersion}  Bun: ${report.bunVersion}`);
  lines.push(`  Timestamp: ${report.timestamp}`);
  if (baselinePath) lines.push(`  Baseline: ${baselinePath}`);
  lines.push("");

  // Группируем по категориям
  const byCategory = new Map<string, NormalizedBenchResult[]>();
  for (const r of report.results) {
    const cat = r.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(r);
  }

  for (const [cat, results] of byCategory) {
    lines.push(`[${cat}]`);
    for (const r of results) {
      const baselineStr = r.relativeToBaseline !== undefined
        ? `  ${r.relativeToBaseline >= 0 ? "+" : ""}${r.relativeToBaseline}%`
        : "  —";
      const flag = r.status === "regression-flag" ? " ⚠️" : "";
      lines.push(`  ${padEnd(r.name, 35)} ${padStart(formatOps(r.opsPerSec), 12)} ops/sec ${baselineStr}${flag}`);
    }
    lines.push("");
  }

  // Сводка
  lines.push("--- Summary ---");
  const total = report.results.length;
  const flagged = report.summary["regression-flag"];
  const watched = report.summary["regression-watch"];
  const missing = report.summary["baseline-missing"];
  lines.push(`  Total: ${total}  OK: ${report.summary.ok}  Watch: ${watched}  Flag: ${flagged}  No baseline: ${missing}`);
  if (flagged > 0) {
    lines.push("  ⚠️  Flagged regressions (>15%):");
    for (const r of report.results) {
      if (r.status === "regression-flag") {
        lines.push(`    ${r.name}: ${r.relativeToBaseline}%`);
      }
    }
  }

  return lines.join("\n");
}

// ======================================================================
//  Helpers
// ======================================================================

function formatOps(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function padEnd(s: string, n: number): string {
  return s.length < n ? s + " ".repeat(n - s.length) : s;
}

function padStart(s: string, n: number): string {
  return s.length < n ? " ".repeat(n - s.length) + s : s;
}
