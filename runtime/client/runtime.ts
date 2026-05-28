// ======================================================================
//  Client Runtime — заглушка, ожидает реализации AST interpreter
//
//  План v1.2:
//    - AST interpreter: обход дерева без eval/new Function
//    - Безопасное выполнение в браузере/WebWorker
//    - Те же builtins и capabilities, что у server, но без SQLite
//
//  Почему не new Function():
//    - Content Security Policy (CSP) в браузере может запрещать eval
//    - Безопасность: AST interpreter не генерирует JS-код из строки
//    - Портативность: не зависит от платформы (Bun-specific? нет)
//
//  Текущий статус: заглушка, возвращает ошибку.
// ======================================================================

import { ExecuteRequest, ExecutionResult, RUNTIME_VERSION } from "../shared/types";
import { clientCapabilities } from "./capabilities";
import type { DSRuntime, RuntimeCapabilities } from "../shared/types";

export class ClientRuntime implements DSRuntime {
  name = "client";
  capabilities: RuntimeCapabilities;

  constructor(capabilities: RuntimeCapabilities = clientCapabilities) {
    this.capabilities = capabilities;
  }

  execute(request: ExecuteRequest): ExecutionResult {
    return {
      success: false,
      output: [],
      error: { message: "Client runtime: not implemented yet" },
      runtimeVersion: RUNTIME_VERSION,
    };
  }
}
