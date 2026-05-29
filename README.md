# 1C-like DSL Interpreter on Bun

Прототип интерпретатора DSL с синтаксисом, похожим на язык 1С:Предприятие,
работающий на платформе Bun с интеграцией SQLite.

Архитектура: `BSL-like code → Tokens → JS IR → Sandbox Runtime`.

## Установка и запуск

```bash
bun install
bun run start         # server runtime
bun run tests/runner.ts        # golden tests (check mode)
bun run tests/runner.ts --update   # golden tests (update snapshots)
bun run build         # сборка в EXE
bun run clean         # удалить data.db и app.exe
```

## Поддерживаемый синтаксис

- Процедуры/функции, условные операторы, циклы (Для/Пока/Для Каждого)
- Присваивание, арифметика, сравнение, логические операторы (И, ИЛИ, НЕ)
- `Вычислить()` / `Выполнить()` — динамическая компиляция
- `Попытка ... Исключение ... КонецПопытки`, `ВызватьИсключение`, `ИнформацияОбОшибке()`
- Capability-based runtime (server vs client)
- `Новый Запрос`, `Новый Массив`, `Новый Структура`, `Новый ТаблицаЗначений`, `Новый Соответствие`, `Новый УникальныйИдентификатор`, `Новый ОписаниеТипов`, `Новый ФиксированныйМассив`, `Новый ФиксированноеСоответствие`
- SQLite запросы с параметрами (`&ИмяПараметра`)
- Фиксированные коллекции, Тип() (синглтоны), identity-based Соответствие, UUID

## Структура проекта

```
├── index.ts                  # Точка входа (server runtime)
├── compiler/
│   ├── tokenize.ts           # Токенизатор
│   ├── ast.ts                # AST Node types
│   └── compile.ts            # Compiler (Program / Expression / Fragment)
├── runtime/
│   ├── shared/
│   │   ├── types.ts          # ExecuteRequest, ExecutionResult и т.д.
│   │   ├── errors.ts         # DSRuntimeError
│   │   ├── builtins.ts       # Фабрики builtin-функций (фасада над contract.ts + objects/)
│   │   ├── contract.ts       # DisplayContract, TypeContract, CoercionContract (v1.4)
│   │   ├── abi.ts            # DSLRuntimeABI_v1_3_3 (types-only, v1.4)
│   │   ├── diagnostics.ts    # DiagnosticsCollector (compile-time only, v1.4)
│   │   ├── execute.ts        # Выбор runtime и выполнение
│   │   └── objects/          # DSL Object Model Layer (v1.3)
│   │       ├── helpers.ts, array.ts, fixed-array.ts, fixed-map.ts
│   │       ├── structure.ts, map.ts, type.ts, uuid.ts
│   │       ├── value-table.ts, value-table-row.ts
│   │       ├── value-table-columns.ts, value-table-indexes.ts
│   │       └── index.ts
│   ├── server/
│   │   ├── capabilities.ts
│   │   └── runtime.ts        # JIT через new Function()
│   └── client/
│       ├── capabilities.ts
│       └── runtime.ts        # AST interpreter (stub)
├── tests/
│   ├── cases/                # .os + .meta.json (рекурсивно, grouped по категориям)
│   │   ├── syntax/           # синтаксические тесты
│   │   ├── semantics/        # семантические тесты
│   │   ├── collections/      # коллекции
│   │   └── runtime/          # runtime-тесты
│   ├── expected/             # .expected.json (golden snapshots, flat lookup)
│   ├── invariants/           # TS-side invariant tests (v1.4)
│   └── runner.ts             # Multi-runtime golden test runner (рекурсивный **/*.os)
├── server/
│   └── dev-server.ts         # HTTP API (Фаза 3)
└── docs/
    ├── runtime-semantics.md
    ├── object-model.md
    ├── internal/
    │   └── runtime-abi-snapshot-v1.3.3.md/json
    └── design/
        └── prototype-hardening.md
```
