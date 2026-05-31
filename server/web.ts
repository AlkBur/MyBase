import { Database } from "bun:sqlite";
import { readFileSync, existsSync } from "fs";
import { resolve, join, extname } from "path";
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

type JsonObject = Record<string, unknown>;

const PUBLIC_ROOT = resolve("public");

function jsonResponse(value: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(value), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

async function readJsonObject(req: Request): Promise<JsonObject> {
  const body = await req.json();
  return body && typeof body === "object" && !Array.isArray(body)
    ? body as JsonObject
    : {};
}

function getStringField(body: JsonObject, key: string, fallback = ""): string {
  const value = body[key];
  return typeof value === "string" ? value : fallback;
}

function getCurrentUser(_req: Request): { id: string; name: string } {
  // Auth boundary: replace with cookie/session lookup when authorization lands.
  return { id: "dev-user", name: "Developer" };
}

// ======================================================================
//  Инициализация runtime
// ======================================================================

const DB_PATH = "data.db";
const db = new Database(DB_PATH);
const runtime = createServerRuntime(db);
setDefaultServerRuntime(runtime);

// ======================================================================
//  SQLite — таблица scripts (Phase B)
// ======================================================================

db.run(`CREATE TABLE IF NOT EXISTS scripts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'Без имени',
  source TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
)`);

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
  const filePath = resolve(join(PUBLIC_ROOT, decodeURIComponent(pathname)));

  if (filePath !== PUBLIC_ROOT && !filePath.startsWith(PUBLIC_ROOT + "\\")) {
    return new Response("Not found", { status: 404 });
  }

  if (!existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const ext = extname(filePath);
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
    const user = getCurrentUser(req);
    void user;

    // POST /api/v1/execute — выполнение DSL-кода
    if (pathname === "/api/v1/execute" && req.method === "POST") {
      try {
        const body = await readJsonObject(req);
        const code = getStringField(body, "code");

        // Runtime синхронный, но оборачиваем в Promise для будущей async-совместимости
        const result = await Promise.resolve().then(() =>
          runtime.execute({ code })
        );

        return jsonResponse(mapResult(result));
      } catch (e: any) {
        return jsonResponse(
          {
            success: false,
            output: [],
            diagnostics: [],
            error: { message: e.message ?? "Unknown error" },
          },
          {
            status: 500,
          }
        );
      }
    }

    // ---- CRUD: /api/v1/scripts ----
    if (pathname === "/api/v1/scripts") {
      if (req.method === "GET") {
        const rows = db.query("SELECT id, name, source, created_at, updated_at FROM scripts ORDER BY updated_at DESC").all();
        return jsonResponse(rows);
      }
      if (req.method === "POST") {
        try {
          const body = await readJsonObject(req);
          const id = crypto.randomUUID();
          const name = getStringField(body, "name", "Без имени");
          const source = getStringField(body, "source");
          db.run("INSERT INTO scripts (id, name, source) VALUES (?, ?, ?)", [id, name, source]);
          const row = db.query("SELECT id, name, source, created_at, updated_at FROM scripts WHERE id = ?").get(id);
          return jsonResponse(row, { status: 201 });
        } catch (e: any) {
          return jsonResponse({ error: e.message }, { status: 400 });
        }
      }
    }

    // ---- CRUD: /api/v1/scripts/:id ----
    const scriptsMatch = pathname.match(/^\/api\/v1\/scripts\/([^\/]+)$/);
    if (scriptsMatch) {
      const id = scriptsMatch[1];
      if (!id) return jsonResponse({ error: "Not found" }, { status: 404 });

      if (req.method === "GET") {
        const row = db.query("SELECT id, name, source, created_at, updated_at FROM scripts WHERE id = ?").get(id);
        if (!row) return jsonResponse({ error: "Not found" }, { status: 404 });
        return jsonResponse(row);
      }

      if (req.method === "PUT") {
        try {
          const body = await readJsonObject(req);
          const name = typeof body.name === "string" ? body.name : undefined;
          const source = typeof body.source === "string" ? body.source : undefined;

          if (name !== undefined && source !== undefined) {
            db.run("UPDATE scripts SET name = ?, source = ?, updated_at = datetime('now') WHERE id = ?", [name, source, id]);
          } else if (name !== undefined) {
            db.run("UPDATE scripts SET name = ?, updated_at = datetime('now') WHERE id = ?", [name, id]);
          } else if (source !== undefined) {
            db.run("UPDATE scripts SET source = ?, updated_at = datetime('now') WHERE id = ?", [source, id]);
          } else {
            return jsonResponse({ error: "No fields to update" }, { status: 400 });
          }

          const row = db.query("SELECT id, name, source, created_at, updated_at FROM scripts WHERE id = ?").get(id);
          if (!row) return jsonResponse({ error: "Not found" }, { status: 404 });
          return jsonResponse(row);
        } catch (e: any) {
          return jsonResponse({ error: e.message }, { status: 400 });
        }
      }

      if (req.method === "DELETE") {
        db.run("DELETE FROM scripts WHERE id = ?", [id]);
        return jsonResponse({ ok: true });
      }
    }

    // Статика
    return serveStatic(pathname);
  },
});

console.log(`🚀 DSL Playground: http://localhost:${PORT}`);
