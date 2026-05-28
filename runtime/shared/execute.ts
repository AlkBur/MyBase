// ======================================================================
//  execute() — точка входа для выполнения DSL-кода
//
//  Назначение:
//    - Упрощает запуск: не нужно знать про runtime, capabilities
//    - Поддерживает глобальный default runtime (для демо/CLI)
//    - Позволяет явно указать runtime (для тестов с несколькими)
//
//  Использование:
//    import { execute, setDefaultServerRuntime } from "./runtime/shared/execute";
//    import { ServerRuntime } from "./runtime/server/runtime";
//    const db = new Database(":memory:");
//    setDefaultServerRuntime(new ServerRuntime(db));
//    const result = execute({ code: 'Сообщить("Hello");' });
//
//  Альтернатива с явным runtime:
//    const rt = new ServerRuntime(db);
//    const result = execute({ code: "..." }, rt);
// ======================================================================

import { ExecuteRequest, ExecutionResult, DSRuntime } from "./types";
import { ServerRuntime } from "../server/runtime";
import { serverCapabilities } from "../server/capabilities";

/** Глобальный runtime по умолчанию */
let defaultServerRuntime: DSRuntime | null = null;

/**
 * Устанавливает глобальный runtime по умолчанию.
 * Вызовите один раз при старте приложения.
 * @param rt — экземпляр DSRuntime (обычно ServerRuntime)
 */
export function setDefaultServerRuntime(rt: DSRuntime): void {
  defaultServerRuntime = rt;
}

/**
 * Выполняет DSL-код.
 * @param request — код и параметры
 * @param runtime — опционально, конкретный runtime. Если не указан,
 *                 использует defaultServerRuntime.
 * @returns ExecutionResult
 */
export function execute(request: ExecuteRequest, runtime?: DSRuntime): ExecutionResult {
  const rt = runtime ?? defaultServerRuntime;
  if (!rt) {
    return {
      success: false,
      output: [],
      error: { message: "No runtime configured. Call setDefaultServerRuntime() first or pass runtime explicitly." },
      runtimeVersion: "0",
    };
  }
  return rt.execute(request);
}

/** Быстрый доступ к серверному runtime с Bun-зависимостями */
export function createServerRuntime(db: any): DSRuntime {
  return new ServerRuntime(db, serverCapabilities);
}
