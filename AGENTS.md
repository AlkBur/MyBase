# AGENTS.md

## 1C-like DSL Platform (BSL-inspired runtime)

Проект: портативная платформа выполнения скриптов на языке, близком к 1С (BSL).
Архитектура: `BSL-like code → Tokens → JS IR → Sandbox Runtime`.
Цель: zero-install embedded automation platform (SQLite + Bun, portable .exe).

### Ключевое архитектурное решение

**Capability-based runtime.** Компилятор общий, runtime разный:

```
            .os
              ↓
          tokenizer
              ↓
   ┌───── Compiler ─────┐
   │ compileProgram()   │  → statements, definitions, full sandbox
   │ compileExpr()      │  → one expression, return(...), limited sandbox
   │ compileFragment()  │  → statements, shared context, no declarations
   └────────────────────┘
              ↓
        JS IR + lineMap
           ↙        ↘
   server JIT        client AST
   (new Function)    interpreter (*)
```

- **Server runtime:** `new Function()` — максимальная производительность
- **Client runtime:** безопасный интерпретатор AST — без генерации JS, без `eval` (stub)
- **Capabilities:** каждый runtime сам определяет доступные функции/конструкторы/объекты

### Команды

```bash
bun run start         # запуск server runtime
bun run tests/runner.ts        # golden tests (check mode)
bun run tests/runner.ts --update   # golden tests (update snapshots)
bun run build         # сборка в EXE
bun run clean         # удалить data.db и app.exe
```

### Файловая структура

```
/compiler
  tokenize.ts         ← токенизатор (в т.ч. ВызватьИсключение, Попытка, multline strings, DATE 'YYYYMMDD', decimal числа 3.14)
  ast.ts              ← AST Node types (декларативно)
  compile.ts          ← Program + Expression compiler (Compiler class)

/runtime
  /shared
    types.ts          ← ExecuteRequest, ExecutionResult, DSRuntime, OutputEvent, Diagnostic
    errors.ts         ← DSRuntimeError (branded symbol, readonly line)
    builtins.ts       ← фабрики builtin-функций (capture output[], делегирует в objects/)
    execute.ts        ← execute() — выбор runtime и выполнение
    /objects          ← DSL Object Model Layer (v1.3)
      helpers.ts            ← defineMethod, defineDSLType, type guards (isDSL*)
      array.ts              ← Массив (вынесен из builtins.ts)
      structure.ts          ← Структура (вариативный конструктор)
      value-table.ts        ← ТаблицаЗначений (core)
      value-table-row.ts    ← DSLValueTableRow (case-insensitive storage)
      value-table-columns.ts ← Колонки (defineProperty по имени)
      value-table-indexes.ts ← Индексы (stub, без индексного движка)
      map.ts                ← Соответствие (identity-based Map, любые ключи; Date → value-type YYYYMMDD)
      type.ts               ← Тип() (модульный кэш синглтонов)
      uuid.ts               ← УникальныйИдентификатор (crypto.randomUUID)
      index.ts              ← re-exports

  /server
    capabilities.ts   ← serverCapabilities (Сообщить, Запрос, Массив, Структура, ТаблицаЗначений, ...)
    runtime.ts        ← ServerRuntime — JIT через new Function(), CaseInsensitiveMap, __dsl_eval__

  /client
    capabilities.ts   ← clientCapabilities (без Запрос)
    runtime.ts        ← ClientRuntime — AST interpreter (stub)

/tests
  /cases              ← .os + .meta.json
    test-script.os          — демо-скрипт (SQLite, строки, процедуры/функции)
    error-unknown.os        — вызов несуществующей функции
    error-args.os           — неверное число аргументов
    test-case-insensitive.os — case-insensitive переменные
    test-loops.os           — циклы Для/Пока
    eval-expression.os      — Вычислить() expression engine
    test-eval.os            — Вычислить() (user-created дубль)
    error-throw.os          — ВызватьИсключение (DSRuntimeError)
    integration-eval.os     — интеграционный тест (Сред + цикл + eval + user-функция)
    error-client-query.os   — client runtime не даёт Новый Запрос (skipped)
    eval.os                 — user-created (eval + try/catch + errorInfo, все процедуры активны)
    test-string-escaped.os      — экранирование "" в строках
    test-string-empty-quote.os  — пустая экранированная кавычка
    test-string-multiple.os     — множественные "" в строке
    test-string-newline.os      — перевод строки внутри литерала (multiline)
    test-multiline.os           — pipe-синтаксис многострочных строк | 
     test-collections.os         — Массив (Добавить, Вставить, Удалить, Найти, Очистить), Структура (Вставить, Свойство, Удалить, Свойства)
     array.os                    — многомерные массивы, bracket access [index], Новый Массив(N), Перем, indexed assignment
      StrGetLine.os               — СтрПолучитьСтроку (multiline, 1-based индекс, граничные случаи)
      ValueTableIndex.os          — ТаблицаЗначений: колонки, индексы (stub), НайтиСтроки, итерация, исключения
      collections.os              — Соответствие (ключи всех типов: undefined, null, boolean, number, string, Date, UUID, Тип)

   /expected           ← golden snapshots (.expected.json)
  runner.ts           ← multi-runtime golden test runner

/server
  dev-server.ts       ← HTTP API (POST /api/v1/execute) — Фаза 3

index.ts              ← точка входа (server runtime)

/docs
  runtime-semantics.md    ← формальная model execution (scopes, exceptions, recursion, capabilities)
  object-model.md         ← DSL Object Model layer (invariants, transitional member access, future hardening)
  /design
    prototype-hardening.md ← security note: prototype-chain, deferred design
```

### Архитектура компилятора

1. **Токенизатор** (`compiler/tokenize.ts`) — разбивает код на токены с позициями.

2. **Компилятор** (`compiler/compile.ts`) — класс `Compiler`:
   - **Первый проход:** собирает имена функций и арность
   - **Второй проход:** генерирует JS
    - Три entry point: `compile()` (program), `compileExpression()` (expression), `compileFragment()` (fragment)

3. **Генерация кода:**
   - Переменные: `context.__variables__.get/set("name")`
   - Функции пользователя: `context.__functions__.get/set("name")`
   - Builtins: `__dsl_*(...)` (прямые параметры sandbox)
   - Для/Цикл: `while` c `.get/.set`
   - Вычислить(): автоподстановка `context` во второй аргумент
   - Выполнить(): автоподстановка `context` во второй аргумент (compileFragment)
   - ИнформацияОбОшибке(): автоподстановка `context` во второй аргумент
   - ВызватьИсключение: `throw new __dsl_RuntimeError__(expr, line)`
   - Попытка: `context.__lastException__ = null; try { ... } catch(__dsl_err__) { context.__lastException__ = __dsl_err__; ... }`
   - Для Каждого: `for(const __item__ of __iterable__) { set(var, __item__); body }` + scope cleanup
   - Доступ по индексу: `__dsl_index__(obj, idx)` / `__dsl_index_set__(obj, idx, val)` — null-safe
   - `AssignTarget: { kind: "variable" | "index", object, name, index }` — lvalue для присваивания
   - Language literals: `Истина→true`, `Ложь→false`, `Null→null`, `Неопределено→undefined`
   - Date literal `'YYYYMMDD'`: `DATE` token → `new Date(y, m-1, d)` в parsePrimary

4. **Песочница** — `new Function()` с контролируемыми параметрами:
   - `context` — `{ __variables__: CaseInsensitiveMap, __functions__: CaseInsensitiveMap }`
   - `__dsl_db__`, `__dsl_Query__` — SQLite
   - `__dsl_RuntimeError__` — конструктор DSL-ошибок
   - Builtins передаются через `BUILTIN_KEYS` + `builtinValues()` (единый источник)
   - `__dsl_index__` в BUILTIN_KEYS (shared sandbox + eval), `__dsl_index_set__` только в full sandbox
   - Версионированный кэш (ключ: `${RUNTIME_VERSION}|${caps.name}|${code}`)
   - Singleton evalFn/execFn на экземпляр runtime

### CaseInsensitiveMap

Замена Proxy: класс с `.get(name)` и `.set(name, value)`, внутри `Object.create(null)` с lowercased ключами.
- Не ломает hidden class optimizations
- Сериализуем
- Проще дебажить

### Capability-based runtime

```ts
interface RuntimeCapabilities {
  name: string;
  functions: string[];        // доступные builtin-функции
  constructors: string[];     // доступные конструкторы (Новый)
  globals: string[];
}
```

- `SERVER_CAPABILITIES`: все функции + `Строка`, `Вычислить`, `Тип` + `Запрос`, `Массив`, `Структура`, `ТаблицаЗначений`, `ОписаниеТипов`, `Соответствие`, `УникальныйИдентификатор`
- `CLIENT_CAPABILITIES`: все функции + `Строка`, `Вычислить`, `Тип` — без `Запрос`

Компилятор валидирует доступность для target:
- `Новый Запрос` в client → `Конструктор "Запрос" недоступен для target=client`
- Неизвестная функция → `Функция "X" не определена`

### Встроенные функции

| Русское | Английское | Доступность |
|---------|-----------|-------------|
| `Сообщить(...)` | — | server, client; булевы → Да/Нет, Неопределено → "" |
| `ТекущаяДата()` | — | server, client |
| `Формат(value)` | — | server, client |
| `СтрНачинаетсяС(str, sub)` | `StrStartsWith(str, sub)` | server, client |
| `СтрЗаканчиваетсяНа(str, sub)` | `StrEndsWith(str, sub)` | server, client |
| `СтрРазделить(str, del, inc?)` | `StrSplit(str, del, inc?)` | server, client |
| `СтрСоединить(arr, sep?)` | `StrConcat(arr, sep?)` | server, client |
| `СтрСравнить(a, b)` | `StrCompare(a, b)` | server, client |
| `СтрНайти(str, sub)` | `StrFind(str, sub)` | server, client |
| `Сред(str, start, len)` | — | server, client |
| `СтрШаблон(tmpl, ...)` | `StrTemplate(tmpl, ...)` | server, client |
| `НСтр(src, lang?)` | `NStr(src, lang?)` | server, client |
| `Вычислить(expr)` | — | server, client |
| `Выполнить(code)` | — | server, client |
| `ИнформацияОбОшибке()` | — | server, client |
| `Строка(value)` | — | server, client |
| `СтрПолучитьСтроку(str, line)` | `StrGetLine(str, line)` | server, client |
| `Тип(name)` | — | server, client |

### Ошибки конструкторов

- `Новый Массив(N)` с невалидным N → `"Ошибка при вызове конструктора (Массив)"`
- `Вставить(index)` / `Удалить(index)` при index вне границ → `"Индекс находится за границами массива"`
- `Новый Соответствие` — identity-based Map (native JS Map), ключи любых типов
- `Новый УникальныйИдентификатор` — UUID v4 (crypto.randomUUID)
- `Тип("Строка")` — singleton из модульного кэша, reference identity для ключей Map

### Statement grammar (дополнения)

- `;` завершает simple statement. Block statements (Если/Для/Попытка/Процедура) self-delimited через Конец* keyword
- `ВызватьИсключение <expression>;` — runtime DSL error (`DSRuntimeError`)
- `Попытка <statements> Исключение <statements> КонецПопытки` — try/catch (блок Исключение опционален, без `;`)
- `Возврат [expr];` — только в program mode (compileProgram); fragment mode (compileFragment) запрещает Возврат
- `Для Каждого <var> Из <expr> Цикл ... КонецЦикла` — итерация по коллекции, transpile to for-of + scope cleanup
- `;` на верхнем уровне (пустой statement) — разрешён, игнорируется через `while (peek === ";")` в начале parse loop
- `Перем <name>;` — no-op декларация, токены до `;` потребляются (DSL создаёт переменные автоматически)

### Language literals

| DSL | JS | Комментарий |
|-----|----|-------------|
| `Истина` | `true` | language literal |
| `Ложь` | `false` | language literal |
| `Null` | `null` | language literal (не lookup переменной) |
| `Неопределено` | `undefined` | language literal |
| `'20240101'` | `new Date(2024, 0, 1)` | DATE token, ровно 8 цифр |

`Null` — отдельный language literal, исторически был упущен; без фикса `Соотв[Null]` читал переменную `Null` (undefined) и перезаписывал ключ `Неопределено`.

### Бинарный `+` и BSL string coercion

`+` транслируется в `__dsl_add__(left, right)`:
- `number + number` → числовое сложение
- `string + any` / `any + string` → конкатенация с BSL-правилами:
  - `undefined` → `"Неопределено"`
  - `null` → `"Null"`
  - `true` → `"Да"`
  - `false` → `"Нет"`
  - `Date` → `YYYYMMDD` (детерминированно, platform-independent)
  - остальное → `String(value)`
- Прочие типы → делегат нативный JS `+`

### Expression engine — `Вычислить(expr)`

Отдельный entry point `compileExpression()`:

- Только выражение, никаких statement-конструкций
- Генерирует `return (jsCode)`
- Limited sandbox: только `{ __variables__, __functions__ }` + builtins
- Без `__dsl_db__`, `__dsl_Query__`
- Recursion guard: depth ≤ 500 (hard limit), `DSRuntimeError`
- Кэш: `expr|rv=VERSION|expr`
- Для не-builtin функций генерирует `context.__functions__.get("name")(...)`
- Присваивание запрещено на уровне grammar
- `Новый Запрос` не скомпилится (нет `__dsl_Query__` в eval sandbox)
- `__dsl_eval__` (self-reference) передаётся в eval sandbox для вложенных `Вычислить()`
- Shared recursion counter `__execDepth__` с `Выполнить()` — предотвращает ping-pong рекурсию

### Exception system — `DSRuntimeError`

- Branded symbol `DS_RUNTIME_ERROR` (не `instanceof` — стабильнее при bundling)
- `readonly line?: number`
- Статический `DSRuntimeError.is(err)` для проверки
- В `execute()` catch: `DSRuntimeError.is(e)` → `error.line`
- Остальные ошибки (TypeError, ReferenceError) — без line
- `ВызватьИслючение` — grammar keyword, не builtin
- `Попытка/Исключение/КонецПопытки` — transpile to native `try/catch`
- `ИнформацияОбОшибке()` — builtin, возвращает `Object.freeze({ Описание })` из `context.__lastException__`

### Категории ошибок

| Тип | Источник | line |
|-----|----------|------|
| Compile errors | `throw new Error()` | в message |
| DSL runtime errors | `DSRuntimeError` | `error.line` |
| JS internal errors | TypeError, ReferenceError | undefined |

### Intentional deviations from 1C

| Поведение | Статус |
|-----------|--------|
| Multiline strings preserve leading `\n` | intentional — литерал сохраняет все символы, `\|` только continuation marker |
| No closures yet | intentional — deferred until runtime semantics stabilized |
| No nested procedure/function declarations | intentional — fragment mode запрещает декларации |
| Arrays/Structures are plain JS objects | intentional — методы через non-enumerable `defineProperty` |
| try/catch transpiles to native JS try/catch | intentional — любой throw ловится, но line есть только у DSRuntimeError |
| eval/exec recursion hard-limit = 500 | intentional — DSRuntimeError, общий счётчик |
| Shallow `Object.freeze` на ИнформацияОбОшибке | intentional — для v1 достаточно, не deep freeze |
| `row["К1"]` (bracket) case-insensitive, `row.К1` (dot) — store через `__values__`, read fallback на native | intentional — transitional member access model, unified dispatch до v1.4 |
| Column rename (`col.Имя = "новое"`) обновляет `defineProperty` + nameIndex + row data + index fields | intentional — rename-каскад через owner-chain, Phase 1 closure |
| `Индексы` — stub без индексного движка | intentional — real index = mini DB engine, deferred |
| Bracket write (`row["К1"] = val`) синхронизирует native property | intentional — transitional bridge до `__dsl_member_set__` |
| `Соответствие` — identity-based Map (native JS Map) | intentional — ключи любых типов, без lowercasing/stringification |
| `Тип("Строка")` возвращает модульный singleton | intentional — reference identity для ключей Map и `===` |
| `УникальныйИдентификатор` — `crypto.randomUUID()` | intentional — каждый вызов новый UUID, без парсинга строк |
| `3.14` (десятичные числа) — единый токен | intentional — tokenizer читает `.`+цифры как часть числа |
| `__dsl_add__` перехватывает `+` для BSL coercion | intentional — `undefined+"x"` → `"Неопределеноx"`, а не `"undefinedx"`; boolean `true` → `"Да"`/`"Нет"`, единая семантика с `Сообщить` |
| `Date` в `dslCoerceString` → `YYYYMMDD` | intentional — стабильные golden snapshots, не зависит от locale/timezone |
| `Null` — language literal, не lookup переменной | intentional — `Соотв[Null]` ≠ `Соотв[Неопределено]` |
| Date-ключи в `Соответствие` нормализуются в YYYYMMDD | intentional — JS Date reference type, DSL date value type |
| Date literal `'YYYYMMDD'` — единый токен DATE | intentional — только 8 цифр, без времени и таймзоны |

### Compiler invariants

Эти утверждения должны оставаться истинными при любых изменениях кода:

1. **Generated JS MUST NOT access globals directly.** All variable access goes through `context.__variables__`, all user function calls through `context.__functions__`.
2. **Builtins injected only through sandbox `new Function` params.** No globals, no `this`, no implicit scope.
3. **Compile modes are isolated.** `compileProgram() ≠ compileExpression() ≠ compileFragment()`. Каждый mode имеет свою grammar validation.
4. **Fragment mode MUST NOT declare symbols.** `Процедура`, `Функция`, `Перем`, `Возврат` — compile error в fragment mode.
5. **Expression mode NEVER emits statements.** `compileExpression()` возвращает `return (jsCode)`, без присваиваний, циклов, деклараций.
6. **Builtins NEVER access runtime state directly.** Они получают только свои аргументы через sandbox params и output[] для Сообщить.
7. **DSRuntimeError is runtime-owned only.** Компилятор генерирует `throw new __dsl_RuntimeError__`, но не создаёт DSRuntimeError напрямую.
8. **Line mapping is generated only in compile stage.** Runtime не корректирует line numbers.
9. **Eval sandbox NEVER receives `__dsl_db__`, `__dsl_Query__`, `__dsl_exec__`.** Нет эскалации capabilities из eval в exec.
10. **Capabilities are compile-time validated, not runtime-discovered.** Компилятор проверяет доступность функций/конструкторов на этапе компиляции.
11. **`;` terminates simple statements, not lines.** Block statements (Если/Для/Попытка/Процедура) self-delimited через Конец*. Empty statements (`;`) tolerated. EOF on last statement tolerated (fragment mode).
12. **`Знач` in parameter lists is silently skipped.** Поскольку pass-by-reference не поддерживается, `Знач Таблица` эквивалентна `Таблица`. Compiler поглощает `Знач` и не учитывает в арности.
13. **`.property[index].property` chains are parsed in any order.** `parsePrimary` обрабатывает чередование `.метод/свойство` и `[index]` в любом порядке через while(true)-цикл.
14. **`+` in expression mode generates `__dsl_add__(...)` for BSL coercion.** Всегда, не только когда операнд строка. Компилятор не знает типов на этапе компиляции.
15. **Date literals compile to `new Date(y, m-1, d)`, not strings.** Сохраняет type identity для `__dsl_type__` dispatch. Runtime-нормализация в Map приводит Date к YYYYMMDD.
16. **`Null` is a language literal, not a variable.** Компилятор генерирует `null` для `Null` на уровне parsePrimary, без lookup через context.__variables__.

### Execution envelope

```ts
type ExecutionResult = {
  success: boolean;
  output: OutputEvent[];
  result?: unknown;
  error?: { message: string; line?: number };
  diagnostics?: Diagnostic[];
  timing?: { parse: number; compile: number; execute: number };
  runtimeVersion: string;
};
```

### Golden tests

```
bun run test           # deep compare actual vs expected
bun run test-update    # перезаписать expected из actual
```

- `tests/cases/*.os` + `*.meta.json` — test inputs
- `tests/expected/*.expected.json` — golden snapshots
- Динамика (даты, line numbers) нормализуется при сравнении
- `writeSnapshot` (raw) + `normalizeForComparison` (normalized) — два отдельных этапа

### SQLite из DSL (server runtime only)

```javascript
Запрос = Новый Запрос;
Запрос.Текст = "SELECT * FROM table WHERE id = &ID";
Запрос.УстановитьПараметр("ID", 123);
Результат = Запрос.Выполнить();
```

### План развития

**v1.0 — Базовая версия (реализовано)**
- [x] Токенизация, компиляция, песочница
- [x] Процедуры, функции, если/иначе/иначеесли, возврат
- [x] Присваивание, арифметика, сравнение, логические операторы
- [x] Регистронезависимые имена функций
- [x] `Новый Запрос`, SQLite с параметрами
- [x] Строковые функции
- [x] Изоляция: `Object.create(null)`, префикс `context.`

**v1.1 — Архитектурные улучшения (реализовано)**
- [x] Case-insensitive переменные (Proxy → CaseInsensitiveMap)
- [x] Runtime line mapping
- [x] Версионирование кэша компиляции
- [x] Реестр конструкторов объектов
- [x] Циклы (Для/Пока)
- [x] Capability-based runtime (target validation)
- [x] Golden snapshot tests (--update)
- [x] Execution envelope (OutputEvent, ExecutionResult)
- [x] Компилятор + runtime разделены
- [x] Client/server runtime separation
- [x] Program / Expression compiler separation

**v1.2 — Расширение языка (реализовано)**
- [x] `Вычислить()` expression engine (compileExpression, limited sandbox, recursion guard)
- [x] `ВызватьИсключение` statement + DSRuntimeError (branded symbol)
- [x] Разделение `__variables__` / `__functions__` на context
- [x] `Сред()` builtin (1-based, safe bounds)
- [x] `BUILTIN_KEYS` + `builtinValues()` — единый источник для sandbox + eval
- [x] Integration test (eval + цикл + user-функция + context reuse)
- [x] Экранирование кавычек в строках (`""` → `"`)
- [x] Многострочные строки (сохранение `\n`, опциональный `|`)
- [x] Массив (0-based API: Вставить, Удалить, Найти → индекс | Неопределено, Количество, Добавить, Очистить)
- [x] Структура (Вставить, Свойство, Удалить, Свойства, Количество)
- [x] `Выполнить()` builtin — compileFragment, shared context, shared recursion counter
- [x] `compileFragment()` — третий entry point (fragment mode, без Процедура/Функция/Перем/Возврат)
- [x] `Для Каждого ... Из ... Цикл` — transpile to native for-of + scope cleanup
- [x] Унарный минус/плюс (`-1`, `+5`)
- [x] String coercion в compileExpression/compileFragment (защита от number-аргументов)
- [x] Recursion guard: execDepthHard = 500, DSRuntimeError, shared __execDepth__ counter
- [x] `__dsl_eval__` self-reference в eval sandbox (поддержка вложенных Вычислить)
- [x] Popытка/Исключение (try-catch) — transpile to native JS try/catch
- [x] ИнформацияОбОшибке() builtin — возвращает `Object.freeze({ Описание })`
- [x] `;` как обязательный terminator simple statements (block self-delimited)
- [x] `expectStatementEnd()` — единый helper для потребления `;`
- [x] `AssignTarget` + `parsePostfix()` для доступа по индексу `[n]`
- [x] `__dsl_index__` / `__dsl_index_set__` — builtins для bracket access (null-safe)
- [x] `__dsl_newArray__(size)` — конструктор с опциональным размером
- [x] `Новый Массив(N)` — парсинг аргументов конструктора
**v1.3 — Object Model Layer (реализовано)**
- [x] `runtime/shared/objects/` — выделение object model layer из builtins.ts
- [x] `__dsl_string__` builtin — Строка() (Да/Нет/""/toString)
- [x] `ТаблицаЗначений` — конструктор + базовый API (Добавить, НайтиСтроки)
- [x] `Колонки` — коллекция с defineProperty по имени (регистронезависимый доступ)
- [x] `Индексы` — stub (API surface без индексного движка)
- [x] `DSLValueTableRow` — case-insensitive storage через `__values__`
- [x] `__dsl_index__` dispatch — routing по `__dsl_type__` (Row, Table, Columns, Indexes)
- [x] `__dsl_index_set__` readonly guard для Indexes
- [x] `Структура(ключ, знач, ...)` — вариативный конструктор
- [x] `ОписаниеТипов(...)` — stub-конструктор
- [x] `Знач` в параметрах — silent skip (pass-by-reference не поддерживается)
- [x] `.property[index].property` chains — парсинг в любом порядке
- [x] `docs/object-model.md` — инварианты объектной модели
- [x] ValueTableIndex.os — golden test (8 процедур, rename-каскад, поиск, исключения)
- [x] Column rename semantics — `ColumnDef.Имя` getter/setter c rename-каскадом (defineProperty, nameIndex, row data, index fields)
- [x] `Свернуть()` — transitional no-op (не throw, не aggregation)
- [x] `НайтиСтроки` — fallback на native-свойства при dot-access
- [x] Index field sync — при rename колонки обновляются `__fields__` во всех индексах
- [x] Row `toString()` — возвращает `"СтрокаТаблицыЗначений"`
- [x] Bounds checks — Indexes, Columns, ValueTable через `__dsl_index__`
- [x] Детерминированный number formatter — `formatDslNumber` (regexp, не toLocaleString)
- [x] Owner-chain — `columns.__owner__`, `indexes.__owner__` для rename-каскада
- [x] `Соответствие` — identity-based Map (native JS Map, ключи любых типов)
- [x] `УникальныйИдентификатор` — UUID v4 (crypto.randomUUID)
- [x] `Тип("Строка")` — singleton из модульного кэша, reference identity для ключей Map
- [x] `__dsl_add__` — бинарный `+` с BSL string coercion (undefined→Неопределено, true→Истина и т.д.)
- [x] `dslCoerceString` — отдельная функция для BSL-приведения в `+`
- [x] Tokenizer: десятичные числа (`3.14`) — единый токен NUMBER
- [x] `__dsl_index__` dispatch — routing по `__dsl_type__` (добавлен Map)
- [x] `collections.os` — golden test (8 процедур, Соответствие с ключами всех типов)
- [x] `objects/map.ts`, `objects/type.ts`, `objects/uuid.ts` — новые файлы объектной модели
- [x] Date literal `'YYYYMMDD'` — токен DATE (tokenize.ts), new Date(y,m-1,d) (compile.ts)
- [x] `Null` — language literal, не lookup переменной (compile.ts parsePrimary)
- [x] Date-ключи в `Соответствие` — нормализация в YYYYMMDD (value-type в map.ts)
- [x] `dslCoerceString(Date)` → `YYYYMMDD` (platform-independent, snapshot-safe)
- [x] `collections.os` — 9 процедур (добавлен тест дат, исправлен Null)

**v1.4 — Unified member access + real index engine**
- [ ] `__dsl_member_get__` / `__dsl_member_set__` — unified property dispatch для dot и bracket
- [ ] Case-insensitive dot-access на ValueTableRow (`row.К1` = `row["К1"]`)
- [ ] Убрать transitional native-property fallback в НайтиСтроки и __dsl_index__
- [ ] Real index maintenance — B-tree/hash, НайтиСтроки с индексной оптимизацией
- [ ] `Свернуть()` — real aggregation (группировка, суммирование)
- [ ] Column-bound storage — row хранит данные по identity колонки, не по имени

**v1.5 — Типизация и object model hardening**
- [ ] `ОписаниеТипов` — real type validation (не stub)
- [ ] Итог / Итого на ТаблицаЗначений
- [ ] `row.К1` генерирует `__dsl_member_set__("К1", val)` (compile-time)
- [ ] No accidental prototype-chain access в runtime
- [ ] Чистка: вынести array/structure обратно в builtins или оставить в objects/ окончательно

**v1.2 items (carried forward)**
- [ ] Вложенные процедуры/функции (замыкания)
- [ ] Client AST interpreter (без `eval`/`new Function`)

**v2.0 — Инструментарий**
- [ ] Source maps для отладки
- [ ] Language Server Protocol
- [ ] Профайлер
- [ ] JSON ввод/вывод для AST

**v3.0 — Перспектива**
- [ ] Инлайн-синтаксис запросов 1С
- [ ] Формы и метаданные
- [ ] ORM-слой (миграции, схемы)
- [ ] UI renderer

### Примечание

Путь к Bun: `D:\PROJECTS\bun\bin\bun-windows-x64\bun.exe`

### Code style

Любой новый код должен содержать **подробные комментарии на русском языке** — не только *что* делает функция, но и *почему* выбрано именно такое решение, какие альтернативы рассматривались и почему отклонены. Особенно это касается:

- Архитектурных решений (почему capability-based, почему CaseInsensitiveMap вместо Proxy)
- Тонких мест (recursion guard, shared counter, отличия от поведения 1С)
- Обработки ошибок (почему DSRuntimeError, а не Error)
- Кэширования (ключи, инвалидация, версионирование)
- Любых неочевидных преобразований (многострочные строки, escaping, метод-чейнинг)
