// ======================================================================
//  Perf infrastructure types — P.0 Benchmark System
//
//  Conceptual model:
//
//    BenchmarkDefinition  ← immutable: name, tags, meta, baselineKey, params
//         ↓
//    BenchmarkScenario    ← parameterized: setup() → BenchmarkRuntime
//         ↓
//    BenchmarkRun         ← one measurement via Bun.bench()
//         ↓
//    NormalizedBenchResult  ← medianNs, minNs, maxNs, opsPerSec
//
//  Key design decisions:
//    - CompiledBenchmark (immutable) separated from BenchmarkRuntime (mutable state)
//    - baselineKey for history continuity (not tied to filename)
//    - BenchmarkCategory for report aggregation
//    - BenchmarkStatus for threshold-based classification
//    - Schema-versioned baseline snapshots
// ======================================================================

import type { BuiltinFactories } from "../../runtime/shared/builtins";
import type { RuntimeCapabilities } from "../../runtime/shared/types";

// ======================================================================
//  BenchmarkCategory — canonical taxonomy for report aggregation
// ======================================================================

export type BenchmarkCategory =
  | "dispatch"
  | "collection"
  | "iteration"
  | "compilation"
  | "aggregation"
  | "lookup";

// ======================================================================
//  BenchmarkStatus — threshold-based classification
// ======================================================================

export type BenchmarkStatus =
  | "ok"
  | "regression-watch"
  | "regression-flag"
  | "baseline-missing";

// ======================================================================
//  CompiledBenchmark — immutable compilation artifact
//
//  Содержит только результат компиляции: JS-код, sandbox function,
//  builtins factory. Не содержит context — состояние отделено.
// ======================================================================

export interface CompiledBenchmark {
  /** Скомпилированный JS-код (для отладки) */
  jsCode: string;
  /** Sandbox function: new Function(...params, jsCode) */
  fn: Function;
  /** Builtins factory (создаётся один раз, shared) */
  builtins: BuiltinFactories;
}

// ======================================================================
//  BenchmarkRuntime — mutable runtime state
//
//  Создаётся setup(), может быть сброшен через reset() для write-тестов.
//  context — свежий на каждый вызов setup().
// ======================================================================

export interface BenchmarkRuntime {
  /** Контекст выполнения: __variables__, __functions__, __execDepth__ */
  context: Record<string, any>;
  /** Скомпилированный бенчмарк (immutable, shared) */
  compiled: CompiledBenchmark;
}

// ======================================================================
//  BenchmarkMeta — метаданные сценария
// ======================================================================

export interface BenchmarkMeta {
  /** Детерминирован ли результат (одинаков ли при повторных запусках) */
  deterministic: boolean;
  /** Меняет ли состояние runtime (write-тест) */
  mutatesState: boolean;
  /** Требует ли warmup перед замером */
  requiresWarmup: boolean;
  /** Seed для воспроизводимости (рандомизированные датасеты) */
  seed?: number;
}

// ======================================================================
//  BenchmarkDefinition — immutable identity сценария
// ======================================================================

export interface BenchmarkDefinition {
  /** Человекочитаемое имя (display only) */
  name: string;
  /** Ключ для привязки к baseline — не меняется при переименовании файла */
  baselineKey: string;
  /** Теги для фильтрации (--tag dispatch) */
  tags: string[];
  /** Категория для report aggregation */
  category: BenchmarkCategory;
  /** Метаданные */
  meta: BenchmarkMeta;
  /** Параметры сценария (для scalability) */
  params?: Record<string, unknown>;
}

// ======================================================================
//  BenchmarkScenario — параметризованный сценарий
// ======================================================================

export interface BenchmarkScenario {
  /** Мета-информация (identity + метаданные) */
  def: BenchmarkDefinition;

  /**
   * Создаёт runtime для замера.
   * Вызывается ОДИН раз перед warmup/run.
   * Не должна быть в измеряемом цикле.
   */
  setup(): BenchmarkRuntime;

  /**
   * Измеряемая операция.
   * Вызывается много раз внутри Bun.bench().
   * Не должна создавать/аллоцировать context.
   */
  execute(rt: BenchmarkRuntime): unknown;

  /**
   * Сброс состояния после execute (для write-тестов).
   * Вызывается между замерами.
   * Если не указан — сброс не требуется.
   */
  reset?(rt: BenchmarkRuntime): void;

  /**
   * Очистка после завершения всех замеров.
   */
  teardown?(rt: BenchmarkRuntime): void;
}

// ======================================================================
//  NormalizedBenchResult — единый результат замера
//
//  Собственный формат, не зависит от Bun.bench() stdout.
//  medianNs — primary metric (стабильнее mean в JS runtime).
// ======================================================================

export interface NormalizedBenchResult {
  /** Имя сценария (из def.name) */
  name: string;
  /** Ключ для привязки к baseline (из def.baselineKey) */
  baselineKey: string;
  /** Теги (из def.tags) */
  tags: string[];
  /** Категория */
  category: BenchmarkCategory;
  /** Параметры сценария */
  params?: Record<string, unknown>;

  /** Операций в секунду */
  opsPerSec: number;
  /** Медианное время выполнения в наносекундах (primary metric) */
  medianNs: number;
  /** Минимальное время (быстрый путь) */
  minNs: number;
  /** Максимальное время (GC pause / deopt) */
  maxNs: number;
  /** Количество сэмплов */
  samples: number;

  /** Статус сравнения с baseline */
  status: BenchmarkStatus;
  /** Относительное изменение в % (положительное = быстрее) */
  relativeToBaseline?: number;

  /** Версия runtime на момент замера */
  runtimeVersion: string;
  /** Версия Bun */
  bunVersion: string;
}

// ======================================================================
//  BaselineSnapshot — формат baseline-файла
// ======================================================================

export interface BaselineSnapshot {
  /** Схема (для обратной совместимости) */
  schemaVersion: number;
  /** Когда сгенерирован */
  generatedAt: string;
  /** Версия Bun */
  bunVersion: string;
  /** Версия runtime */
  runtimeVersion: string;
  /** Платформа */
  platform: {
    os: string;
    arch: string;
    cpu: string;
  };
  /** Результаты: baselineKey → NormalizedBenchResult */
  benchmarks: Record<string, NormalizedBenchResult>;
}

// ======================================================================
//  BenchmarkReport — итоговый отчёт для вывода
// ======================================================================

export interface BenchmarkReport {
  /** Когда выполнен */
  timestamp: string;
  /** Версия Bun */
  bunVersion: string;
  /** Версия runtime */
  runtimeVersion: string;
  /** Все результаты */
  results: NormalizedBenchResult[];
  /** Сводка по статусам */
  summary: {
    ok: number;
    "regression-watch": number;
    "regression-flag": number;
    "baseline-missing": number;
  };
}
