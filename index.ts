import { Database } from "bun:sqlite";
import { readFileSync, existsSync } from "fs";
import { createServerRuntime, setDefaultServerRuntime } from "./runtime/shared/execute";
import { formatOutput } from "./runtime/shared/builtins";

const DB_PATH = "data.db";

const db = new Database(DB_PATH);
db.run(`
  CREATE TABLE IF NOT EXISTS Пользователи (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Имя TEXT NOT NULL,
    Возраст INTEGER NOT NULL
  )
`);

const count = db.query("SELECT COUNT(*) as cnt FROM Пользователи").get() as any;
if (count.cnt === 0) {
  db.run("INSERT INTO Пользователи (Имя, Возраст) VALUES ('Иван', 30)");
  db.run("INSERT INTO Пользователи (Имя, Возраст) VALUES ('Мария', 25)");
  db.run("INSERT INTO Пользователи (Имя, Возраст) VALUES ('Петр', 35)");
}

console.log("🚀 Запуск 1C DSL Prototype");

const scriptPath = "tests/cases/test-script.os";
if (!existsSync(scriptPath)) {
  console.error(`Файл ${scriptPath} не найден`);
  process.exit(1);
}

const code = readFileSync(scriptPath, "utf-8");
console.log("📜 Выполнение DSL кода:");

const runtime = createServerRuntime(db);
setDefaultServerRuntime(runtime);

const result = runtime.execute({ code });

if (result.timing) {
  console.log(`⏱ Компиляция: ${result.timing.compile}ms, Выполнение: ${result.timing.execute}ms`);
}

const formatted = formatOutput(result.output);
for (const line of formatted) {
  console.log(line);
}

if (!result.success) {
  console.error(`❌ Ошибка: ${result.error?.message}`);
  process.exit(1);
}

console.log("✅ Выполнение завершено");
