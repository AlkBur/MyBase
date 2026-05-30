import { Database } from "bun:sqlite";
import { readFileSync, existsSync } from "fs";
import { createServerRuntime, setDefaultServerRuntime } from "../runtime/shared/execute";
import type { ExecutionResult } from "../runtime/shared/types";

// ======================================================================
//  ExecuteResponse — единый контракт API (соответствует фронтенду)
//  Расширяется по мере добавления форм, таймингов и т.д.
// ======================================================================

interface ExecuteResponse {
  success: boolean;
  output: string[];
  diagnostics: {
    severity: "error" | "warning" | "info";
    message: string;
    line?: number;
    column?: number;
  }[];
  error?: {
    message: string;
    stack?: string;
  };
  timings?: {
    compileMs: number;
    executeMs: number;
  };
}

// ======================================================================
//  MIME-типы по расширению
// ======================================================================

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

// ======================================================================
//  Инициализация runtime
// ======================================================================

const DB_PATH = "data.db";
const db = new Database(DB_PATH);
const runtime = createServerRuntime(db);
setDefaultServerRuntime(runtime);

// ======================================================================
//  Преобразование ExecutionResult → ExecuteResponse
// ======================================================================

function mapResult(result: ExecutionResult): ExecuteResponse {
  const response: ExecuteResponse = {
    success: result.success,
    output: result.output.map((e) => e.value),
    diagnostics: (result.diagnostics ?? []).map((d) => ({
      severity: d.severity as "error" | "warning" | "info",
      message: d.message,
      line: d.line,
      column: d.column,
    })),
  };

  if (result.error) {
    response.error = {
      message: result.error.message,
      stack: result.error.stack,
    };
  }

  if (result.timing) {
    // Тайминги зарезервированы, пока не выводятся в UI
    response.timings = {
      compileMs: Math.round(result.timing.compile * 100) / 100,
      executeMs: Math.round(result.timing.execute * 100) / 100,
    };
  }

  return response;
}

// ======================================================================
//  Раздача статики — единая точка для всех GET-запросов
//  В будущем здесь появятся /examples/, /forms/ и т.д.
// ======================================================================

function serveStatic(pathname: string): Response {
  if (pathname === "/") pathname = "/index.html";
  const filePath = `public${pathname}`;

  if (!existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = filePath.slice(filePath.lastIndexOf("."));
  const contentType = MIME_TYPES[ext] ?? "application/octet-stream";
  const content = readFileSync(filePath);
  return new Response(content, {
    headers: { "Content-Type": contentType },
  });
}

// ======================================================================
//  HTTP-сервер
// ======================================================================

const PORT = parseInt(process.env.PORT || "3000", 10);

Bun.serve({
  port: PORT,

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // POST /api/v1/execute — выполнение DSL-кода
    if (pathname === "/api/v1/execute" && req.method === "POST") {
      try {
        const body = await req.json();
        const code: string = body.code ?? "";

        // Runtime синхронный, но оборачиваем в Promise для будущей async-совместимости
        const result = await Promise.resolve().then(() =>
          runtime.execute({ code })
        );

        return new Response(JSON.stringify(mapResult(result)), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (e: any) {
        return new Response(
          JSON.stringify({
            success: false,
            output: [],
            diagnostics: [],
            error: { message: e.message ?? "Unknown error" },
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Статика
    return serveStatic(pathname);
  },
});

console.log(`🚀 DSL Playground: http://localhost:${PORT}`);
