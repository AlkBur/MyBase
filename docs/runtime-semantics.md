# Runtime Semantics

> Формальное описание execution model DSL-платформы.
> Документ для разработчиков, а не для пользователей.
> Цель: зафиксировать поведение runtime до появления closures и client interpreter.

---

## 1. Execution modes

Три режима компиляции, каждый со своей grammar validation и sandbox-профилем:

| Mode | Entry point | Грамматика | Sandbox |
|------|-------------|------------|---------|
| Program | `compileProgram()` | Statements + declarations (Процедура, Функция, Перем, Возврат) | Full: DB, Query, all builtins |
| Expression | `compileExpression()` | Only expressions, `return (...)` wrapper | Limited: no DB, no Query, no `__dsl_exec__` |
| Fragment | `compileFragment()` | Statements, NO declarations, NO `Возврат` | Full: DB, Query, all builtins; shared context |

**Invariant:** compile modes изолированы. Нельзя:
- объявить процедуру в fragment mode
- использовать `Возврат` в fragment mode
- использовать присваивание в expression mode

---

## 2. Scope model

### 2.1 Execution context

Единый объект `context`, содержащий:

```ts
{
  __variables__: CaseInsensitiveMap,  // все переменные DSL
  __functions__: CaseInsensitiveMap,  // пользовательские процедуры/функции
  __execDepth__: number,              // общий счётчик рекурсии
  __lastException__: any | null,      // последнее исключение (для ИнформацияОбОшибке)
}
```

- `__variables__` и `__functions__` разделены — переменные и функции не конфликтуют по именам.
- `CaseInsensitiveMap` — регистронезависимое хранилище (lowercased keys в `Object.create(null)`).

### 2.2 Function scope

Все функции (Процедура/Функция) разделяют один и тот же `__variables__` и `__functions__`.

Нет локальной области видимости — переменные, созданные внутри функции, видны снаружи.

Это сознательное упрощение до появления замыканий (closures).

### 2.3 Loop variable restoration (Для Каждого)

Для `Для Каждого <var> Из <expr>` генерируется:

```js
const __prev__ = context.__variables__.get("var");
try {
  for (const __item__ of iterable) {
    context.__variables__.set("var", __item__);
    // тело цикла
  }
} finally {
  if (__prev__ === undefined) {
    context.__variables__.delete("var");
  } else {
    context.__variables__.set("var", __prev__);
  }
}
```

- Каждый вложенный цикл создаёт свою `const __prev__` (block-scoped) — nested loops не пересекаются.
- `try/finally` гарантирует восстановление даже при исключении в теле цикла.

### 2.4 Fragment shared scope

`Выполнить(code)` компилирует код через `compileFragment()` и выполняет в том же объекте `context`:

- Те же `__variables__` и `__functions__`
- Те же builtins
- Тот же счётчик `__execDepth__`

Изменения, сделанные внутри `Выполнить()`, видны снаружи.

---

## 3. Variable resolution order

### 3.1 Compile-time resolution

1. **Builtin functions** — проверяются через `ALL_BUILTINS` (словарь `русское → __dsl_*`).
2. **User functions** — собираются в первом проходе компилятора (symbol collection).
3. **Unknown symbol** → compile error `Функция "X" не определена`.

### 3.2 Runtime resolution

1. **Variables** → `context.__variables__.get("name")` (case-insensitive).
2. **Functions** → `context.__functions__.get("name")` (case-insensitive).
3. **Builtins** уже переданы как параметры sandbox function — не требуют lookup.

Порядок применения в сгенерированном JS:

```
variable access → context.__variables__.get()
function call →   context.__functions__.get()()   // user functions
                   __dsl_*(...)                    // builtins (direct params)
```

---

## 4. Mutation semantics

### 4.1 Object mutability

| Тип | Мутабелен? | Примечание |
|-----|-----------|------------|
| Массив | Да | Методы через `Object.defineProperty` (non-enumerable) |
| Структура | Да | case-insensitive ключи, `originalKeys` для `Свойства()`, explicit counter |
| Числа, строки, булевы | Нет | Immutable by nature в JS |
| `ИнформацияОбОшибке()` | Shallow immutable | `Object.freeze({ Описание })` — только первый уровень |

### 4.2 Reference semantics

**Variables hold object references, not structural copies.**

```bsl
А = Новый Массив();
Б = А;
Б.Добавить(1);
// А[1] === 1 — А и Б ссылаются на один массив
```

Это относится ко всем execution modes:

- `Вычислить()` и `Выполнить()` работают с теми же reference objects через shared context.
- Передача аргументов в функции — по ссылке (reference sharing).

---

## 5. Function call semantics

### 5.1 Current model (no closures)

- Каждая DSL-функция выполняется в общем контексте (`context`).
- Нет lexical capture — функции не замыкают переменные caller-а.
- Нет локальной scope — переменные живут в глобальном `__variables__`.

### 5.2 Argument passing

- Аргументы вычисляются перед вызовом (strict evaluation, call-by-value for primitives).
- Передача объектов — по ссылке.
- Арность проверяется компилятором в первом проходе (symbol collection).

### 5.3 Return semantics

- `Возврат` разрешён только в program mode (compileProgram).
- `Возврат [expr]` — опциональное выражение; `Возврат;` генерирует `return;`.
- Fragment mode (compileFragment) запрещает `Возврат` — compile error.

---

## 6. Exception semantics

### 6.1 DSRuntimeError

- Branded symbol `DS_RUNTIME_ERROR` (не `instanceof` — стабильнее при bundling).
- `readonly line?: number` — строка исходного `.os`-файла.
- Статический `DSRuntimeError.is(err)` для проверки.
- Создаётся только runtime-ом (`throw new __dsl_RuntimeError__`), не компилятором.

### 6.2 Попытка/Исключение

Transpile:

```js
context.__lastException__ = null;
try {
  // тело Попытка
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
  // тело Исключение
}
```

- `Попытка` ловит **любые** thrown values:
  - `DSRuntimeError` — гарантирует `line` и сообщение.
  - Native JS errors (TypeError, ReferenceError) — line = undefined.
  - Любые другие thrown значения.
- `Исключение` блок опционален.

### 6.3 ИнформацияОбОшибке()

```ts
builtin: (context) => Object.freeze({
  Описание: String(context.__lastException__?.message ?? context.__lastException__ ?? ""),
})
```

- Возвращает shallow frozen объект.
- Осмыслен только после `Попытка/Исключение` — иначе `Описание` пустая строка.
- `Object.freeze` только первый уровень (shallow).

### 6.4 Error categories

| Тип | Источник | line |
|-----|----------|------|
| Compile errors | `throw new Error()` | в message |
| DSL runtime errors | `DSRuntimeError` | `error.line` |
| JS internal errors | TypeError, ReferenceError | undefined |

---

## 7. Recursion model

### 7.1 Shared recursion counter

```ts
context.__execDepth__: number
```

- Общий для `Вычислить()` и `Выполнить()`.
- Инкрементируется при входе, декрементируется в `finally`.
- Предотвращает ping-pong рекурсию между eval и exec:

```bsl
Выполнить("Вычислить(""Выполнить(...)"")")
```

### 7.2 Hard limit

```ts
const EXEC_DEPTH_HARD = 500;
```

При превышении:

```ts
throw new DSRuntimeError(
  "Превышена допустимая глубина вложенного Выполнить()/Вычислить()"
);
```

- `DSRuntimeError` даёт `line` в ошибке и совместимость с `Попытка`.
- Лимит жёсткий, без soft warnings.

### 7.3 Что ограничивается

| Тип рекурсии | Ограничивается `__execDepth__`? |
|-------------|-------------------------------|
| DSL execution nesting (Вычислить → Выполнить → ...) | Да |
| User function recursion (функция → себя) | Да (через stack of `Вычислить`/`Выполнить` вызовов, если внутри есть builtin, иначе — JS stack) |
| JS native recursion (внутри sandbox) | Нет — зависит от JS engine |

---

## 8. Capability inheritance

### 8.1 Per-mode sandbox profile

| Mode | DB | Query | All builtins | execFn | evalFn |
|------|----|-------|-------------|--------|--------|
| Program | ✅ | ✅ | ✅ | ✅ | ✅ |
| Expression | ❌ | ❌ | ✅ (ограниченные) | ❌ | ✅ (self-reference) |
| Fragment | ✅ | ✅ | ✅ | ✅ | ✅ |

### 8.2 Eval sandbox isolation

`compileExpression()` sandbox создаётся как:

```ts
new Function("context", ...BUILTIN_KEYS, "__dsl_eval__", jsCode)
```

- Нет `__dsl_db__`, `__dsl_Query__`, `__dsl_exec__`.
- `Вычислить("Выполнить(...)")` → ReferenceError (`__dsl_exec__` не определён).
- `Новый Запрос` не скомпилируется (нет `__dsl_Query__` в eval sandbox).

**Invariant:** Eval sandbox не может эскалировать capabilities.

### 8.3 Exec sandbox

Fragment sandbox использует `buildSandboxFn()` — полный профиль:

```ts
new Function("context", "__dsl_db__", "__dsl_Query__",
  ...BUILTIN_KEYS,
  "__dsl_eval__", "__dsl_exec__", "__dsl_RuntimeError__",
  jsCode)
```

### 8.4 Principle

**Capabilities are compile-time validated, not runtime-discovered.**
Компилятор проверяет доступность функций/конструкторов на этапе компиляции,
а не в runtime.

---

## 9. Object semantics

### 9.1 Массив (Array)

- Это plain JS array с методами, добавленными через `Object.defineProperty` (non-enumerable).
- Методы: `Добавить`, `Вставить`, `Удалить`, `Найти`, `Очистить`, `Количество`.
- Все индексы 0-based (1С-стиль).
- `Найти()` возвращает 0-based индекс элемента или `Неопределено` при отсутствии.
- Идиома проверки наличия: `Массив.Найти(X) <> Неопределено` (т.к. 0 — валидный индекс, но falsy в JS).
- `Вставить(индекс, значение)` — вставляет перед элементом с указанным индексом.
- `Удалить(индекс)` — удаляет элемент по указанному индексу.

### 9.2 Структура (Structure)

- Внутреннее хранение: `{ data: Record<string, any>, originalKeys: Record<string, string>, count: number }`.
- Ключи регистронезависимые: lookup через `.toLowerCase()`.
- `originalKeys` сохраняет изначальный регистр для `Свойства()`.
- `Свойства()` возвращает массив оригинальных (не lowercased) ключей.
- `count` — явный счётчик (не `Object.keys(data).length`), корректно работает при `delete`.

### 9.3 Prototype-chain

Текущие коллекции — plain JS объекты. Свойства прототипа (`constructor`, `__proto__`, `prototype`) доступны.

**Это осознанное ограничение v1.** См. `docs/design/prototype-hardening.md`.

---

## 10. Diagnostics infrastructure (v1.4)

### 10.1 Compile-time diagnostics

`DiagnosticsCollector` — compile-time only, explicit parameter, not global:

```ts
class DiagnosticsCollector {
  error(code: string, message: string, line?: number): void;
  warning(code: string, message: string, line?: number): void;
  info(code: string, message: string, line?: number): void;
  hasErrors(): boolean;
  toArray(): Diagnostic[];
}
```

- Все 13 throw-сайтов compile.ts инструментированы через `diagError(code, msg, line)`
- После `diagError()` — throw, прерывающий компиляцию (same behaviour as before)
- `ExecutionResult.diagnostics` опционально содержит массив `Diagnostic[]`
- Snapshot writer НЕ включает `diagnostics` — transparent to golden tests
- Runtime-ошибки не создают Diagnostic (deferred to v2.0)

### 10.2 Diagnostic codes

| Code | Условие |
|------|---------|
| `SYNTAX_ERROR` | Неожиданный токен, отсутствие `;` |
| `UNKNOWN_FUNCTION` | Вызов несуществующей builtin |
| `FUNCTION_UNAVAILABLE` | Функция недоступна для target |
| `UNKNOWN_CONSTRUCTOR` | Неизвестный конструктор |
| `CONSTRUCTOR_UNAVAILABLE` | Конструктор недоступен для target |
| `ARG_COUNT_ERROR` | Неверное число аргументов |
| `FORBIDDEN_IN_FRAGMENT` | Процедура/Функция/Возврат/Перем в fragment mode |
| `ASSIGN_IN_EXPRESSION` | Присваивание в expression mode |
| `RETURN_IN_FRAGMENT` | Возврат в fragment mode |

---

## 11. String semantics (v1.3)

### 11.1 Escaped quotes

- 1C-стиль: `""` внутри строки → один символ `"`.
- Нет JS-стиля `\"`.
- Обрабатывается в токенизаторе.

### 11.2 Multiline strings

- Новая строка внутри литерала → `\n` сохраняется в значении буквально.
- Опциональный continuation marker `|` сразу после `\n` удаляется.
- Пробельные символы (табуляция/пробелы) между `\n` и `|` пропускаются (source indentation).
- Ведущий `\n` после открывающей кавычки **сохраняется**:

```bsl
"
|AAA
|BBB"
// значение: "\nAAA\nBBB" (с ведущим \n)
```

**Решение осознанное:** литерал сохраняет все символы, `|` — только continuation marker.
Не пытается эмулировать 1С byte-to-byte.
