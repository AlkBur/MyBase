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

- Процедуры/функции (`Процедура ... КонецПроцедуры`, `Функция ... КонецФункции`)
- Условные операторы (`Если ... Тогда ... Иначе ... КонецЕсли`, `ИначеЕсли`)
- Циклы (`Для ... По ... Цикл`, `Пока ... Цикл`, `Для Каждого ... Из ... Цикл`)
- Присваивание, арифметика (`+`, `-`, `*`, `/`), сравнение (`=`, `<>`, `>`, `<`, `>=`, `<=`)
- Логические операторы (`И`, `ИЛИ`, `НЕ`)
- Вывод сообщений (`Сообщить`)
- Возврат значения (`Возврат`)
- Создание объектов (`Новый Запрос`, `Новый Массив`, `Новый Структура`, `Новый ТаблицаЗначений`, `Новый Соответствие`, `Новый УникальныйИдентификатор`, `Новый ОписаниеТипов`)
- SQLite запросы с параметрами (`&ИмяПараметра`)
- `Вычислить()` / `Выполнить()` — динамическая компиляция
- `Попытка ... Исключение ... КонецПопытки`
- `ВызватьИсключение`
- `ИнформацияОбОшибке()`
- Capability-based runtime (server vs client)
- Регистронезависимые имена переменных и функций
- `Соответствие` (identity-based Map с ключами любых типов)
- `УникальныйИдентификатор` (UUID)
- `Тип()` (синглтоны с reference identity)

## Структура проекта

```
├── index.ts                  # Точка входа (server runtime)
├── compiler/
│   ├── tokenize.ts           # Токенизатор
│   ├── ast.ts                # AST Node types
│   └── compile.ts            # Compiler (Program / Expression / Fragment)
├── runtime/
│   ├── shared/
│   │   ├── types.ts          # ExecuteRequest, ExecutionResult, и т.д.
│   │   ├── errors.ts         # DSRuntimeError
│   │   ├── builtins.ts       # Фабрики builtin-функций
│   │   ├── execute.ts        # Выбор runtime и выполнение
│   │   └── objects/          # DSL Object Model Layer
│   │       ├── helpers.ts
│   │       ├── array.ts
│   │       ├── structure.ts
│   │       ├── value-table.ts
│   │       ├── value-table-row.ts
│   │       ├── value-table-columns.ts
│   │       ├── value-table-indexes.ts
│   │       ├── map.ts
│   │       ├── type.ts
│   │       ├── uuid.ts
│   │       └── index.ts
│   ├── server/
│   │   ├── capabilities.ts
│   │   └── runtime.ts        # JIT через new Function()
│   └── client/
│       ├── capabilities.ts
│       └── runtime.ts        # AST interpreter (stub)
├── tests/
│   ├── cases/                # .os + .meta.json (golden inputs)
│   ├── expected/             # .expected.json (golden snapshots)
│   └── runner.ts             # Multi-runtime golden test runner
├── server/
│   └── dev-server.ts         # HTTP API (Фаза 3)
└── docs/
    ├── runtime-semantics.md
    ├── object-model.md
    └── design/
        └── prototype-hardening.md
```
