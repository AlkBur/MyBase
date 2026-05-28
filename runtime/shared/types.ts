// ======================================================================
//  Типы данных для всего runtime — Envelope, Output, Diagnostics
//
//  Этот файл определяет контракты между компонентами:
//    - ExecutionResult — единый формат ответа от любого runtime
//    - ExecuteRequest — входные данные для выполнения
//    - DSRuntime — интерфейс runtime (server и client)
//    - RuntimeCapabilities — описание возможностей runtime
//    - Вспомогательные типы: OutputEvent, Diagnostic, RuntimeError
//
//  Все типы сериализуемы в JSON (для HTTP API / golden tests).
// ======================================================================

/** Тип события вывода (Сообщить генерирует "message") */
export type OutputEventType = "message" | "warning" | "error" | "info";

/**
 * Одно событие вывода.
 * value — строка, которая была передана в Сообщить().
 * unstable — опциональный маркер для normalize-сравнения в тестах
 * (например, даты помечаются, чтобы их можно было заменить на маску).
 */
export type OutputEvent = {
  type: OutputEventType;
  value: string;
  unstable?: string;
};

/** Серьёзность диагностического сообщения */
export type DiagnosticSeverity = "info" | "warning" | "error";

/** Диагностическое сообщение (для LSP, линтера, компилятора) */
export type Diagnostic = {
  severity: DiagnosticSeverity;
  message: string;
  line?: number;
  column?: number;
  code?: string;
};

/** Ошибка выполнения */
export type RuntimeError = {
  message: string;
  line?: number;
  column?: number;
  stack?: string;
};

/**
 * Результат выполнения скрипта.
 * Универсальный конверт для server и client runtime.
 * Содержит output (все Сообщить), ошибку, результат и метрики.
 */
export type ExecutionResult = {
  success: boolean;
  output: OutputEvent[];
  result?: unknown;
  error?: RuntimeError;
  diagnostics?: Diagnostic[];
  timing?: {
    parse: number;
    compile: number;
    execute: number;
  };
  runtimeVersion: string;
};

/** Запрос на выполнение кода */
export type ExecuteRequest = {
  code: string;
  version?: number;
  /** Внешний контекст (пока не используется, зарезервировано) */
  context?: Record<string, unknown>;
};

/**
 * Capabilities — описывает, что доступно в конкретном runtime.
 * Компилятор использует это для валидации:
 *   - Недопустимые builtins → ошибка компиляции
 *   - Недопустимые конструкторы → ошибка компиляции
 */
export type RuntimeCapabilities = {
  name: string;
  /** Список имён доступных builtin-функций */
  functions: string[];
  /** Список имён доступных конструкторов (Новый) */
  constructors: string[];
  /** Зарезервировано */
  globals: string[];
};

/**
 * Интерфейс runtime.
 * ServerRuntime и ClientRuntime реализуют его.
 */
export interface DSRuntime {
  name: string;
  capabilities: RuntimeCapabilities;
  execute(request: ExecuteRequest): ExecutionResult;
}

/**
 * Версия runtime.
 * Используется как часть ключа кэша компиляции — при изменении
 * builtins или генерации кода нужно увеличить версию, чтобы
 * старый кэш инвалидировался.
 * Формат: "major.minor"
 */
export const RUNTIME_VERSION = "1.2";
