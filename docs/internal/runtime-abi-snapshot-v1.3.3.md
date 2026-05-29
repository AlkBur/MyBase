# Runtime ABI Snapshot v1.3.3

> Дата: 2026-05-29
> Версия: `RUNTIME_VERSION = "1.3.3"`
> Назначение: семантический baseline перед v1.4 Unified Member Dispatch migration

---

## 1. Sandbox Parameter Order (ServerRuntime)

`new Function(...params, jsCode)` вызывается с 39 параметрами:

```
param 0:  context           — { __variables__, __functions__, __execDepth__, __lastException__ }
param 1:  __dsl_db__        — Bun SQLite Database instance
param 2:  __dsl_Query__     — конструктор DSLQuery (обёртка SQLite)
params 3-35:  BUILTIN_KEYS (33 шт.) — см. ниже
param 36: __dsl_eval__      — функция Вычислить (singleton evalFn)
param 37: __dsl_exec__      — функция Выполнить (singleton execFn)
param 38: __dsl_RuntimeError__ — конструктор DSRuntimeError
param 39: __dsl_index_set__ — функция записи по индексу
```

### Eval Sandbox (Вычислить)

```
param 0:  context
params 1-33: BUILTIN_KEYS (без __dsl_index_set__)
param 34: __dsl_eval__      — self-reference для вложенных Вычислить
```

**Ключевое:** eval sandbox НЕ получает `__dsl_db__`, `__dsl_Query__`, `__dsl_exec__`, `__dsl_index_set__`.

---

## 2. BUILTIN_KEYS (33 шт., фиксированный порядок)

Порядок критичен — совпадает между `sandbox fn`, `eval fn` и `builtinValues()`.

| # | Имя | Описание | DSL-алиасы |
|---|-----|----------|------------|
| 0 | `__dsl_log__` | Сообщить (coerceForDisplay) | Сообщить |
| 1 | `__dsl_currentDate__` | ТекущаяДата() | ТекущаяДата |
| 2 | `__dsl_format__` | Формат(value, format?) | Формат |
| 3 | `__dsl_strStartsWith__` | СтрНачинаетсяС | СтрНачинаетсяС, StrStartsWith |
| 4 | `__dsl_strEndsWith__` | СтрЗаканчиваетсяНа | СтрЗаканчиваетсяНа, StrEndsWith |
| 5 | `__dsl_strSplit__` | СтрРазделить | СтрРазделить, StrSplit |
| 6 | `__dsl_strConcat__` | СтрСоединить | СтрСоединить, StrConcat |
| 7 | `__dsl_strCompare__` | СтрСравнить | СтрСравнить, StrCompare |
| 8 | `__dsl_strFind__` | СтрНайти / Найти | СтрНайти, StrFind, Найти |
| 9 | `__dsl_strMid__` | Сред | Сред |
| 10 | `__dsl_strTemplate__` | СтрШаблон | СтрШаблон, StrTemplate |
| 11 | `__dsl_nstr__` | НСтр | НСтр, NStr |
| 12 | `__dsl_newArray__` | Новый Массив | — |
| 13 | `__dsl_newFixedArray__` | Новый ФиксированныйМассив | — |
| 14 | `__dsl_newStructure__` | Новая Структура | — |
| 15 | `__dsl_newValueTable__` | Новая ТаблицаЗначений | — |
| 16 | `__dsl_newTypeDescription__` | Новое ОписаниеТипов | — |
| 17 | `__dsl_newMap__` | Новое Соответствие | — |
| 18 | `__dsl_newFixedMap__` | Новое ФиксированноеСоответствие | — |
| 19 | `__dsl_newUUID__` | Новый УникальныйИдентификатор | — |
| 20 | `__dsl_type__` | Тип("имя") | Тип |
| 21 | `__dsl_typeOf__` | ТипЗнч(value) | ТипЗнч |
| 22 | `__dsl_add__` | Бинарный + | (компилятор генерирует) |
| 23 | `__dsl_string__` | Строка(value) | Строка |
| 24 | `__dsl_strGetLine__` | СтрПолучитьСтроку | СтрПолучитьСтроку, StrGetLine |
| 25 | `__dsl_index__` | Чтение obj[index] | (компилятор генерирует) |
| 26 | `__dsl_errorInfo__` | ИнформацияОбОшибке | ИнформацияОбОшибке |
| 27 | `__dsl_strIsEmpty__` | ПустаяСтрока | ПустаяСтрока |
| 28 | `__dsl_trim__` | СокрЛП | СокрЛП |
| 29 | `__dsl_charCode__` | КодСимвола | КодСимвола |
| 30 | `__dsl_number__` | Число(value) | Число |
| 31 | `__dsl_currentUniversalDateInMillis__` | ТекущаяУниверсальнаяДатаВМиллисекундах | ТекущаяУниверсальнаяДатаВМиллисекундах |
| 32 | `__dsl_newStringQualifiers__` | Новый КвалификаторыСтроки | — |

---

## 3. DSL Object Types

Каждый DSL-объект имеет non-enumerable `__dsl_type__`:

| `__dsl_type__` | DSL-имя | toString() | Файл |
|----------------|---------|-----------|------|
| `"ValueTable"` | ТаблицаЗначений | `"ТаблицаЗначений"` | `value-table.ts` |
| `"ValueTableRow"` | СтрокаТаблицыЗначений | `"СтрокаТаблицыЗначений"` | `value-table-row.ts` |
| `"ValueTableColumns"` | Колонки | `"Колонки"` | `value-table-columns.ts` |
| `"ValueTableIndexes"` | Индексы | `"Индексы"` | `value-table-indexes.ts` |
| `"ValueTableIndex"` | ИндексТаблицыЗначений | имя поля | `value-table-indexes.ts` |
| `"Map"` | Соответствие | `"Соответствие"` | `map.ts` |
| `"FixedMap"` | ФиксированноеСоответствие | `"Фиксированное соответствие"` | `fixed-map.ts` |
| `"FixedArray"` | ФиксированныйМассив | `"Фиксированный массив"` | `fixed-array.ts` |
| `"Структура"` | Структура | `"Структура"` | `structure.ts` |
| `"UniqueIdentifier"` | УникальныйИдентификатор | UUID-строка | `uuid.ts` |
| `"Type"` | Тип | display-name | `type.ts` |
| `"TypeDescription"` | ОписаниеТипов | `"ОписаниеТипов"` | `builtins.ts` |
| `"StringQualifiers"` | КвалификаторыСтроки | `"КвалификаторыСтроки"` | `builtins.ts` |

Массивы (`Array`) — единственный тип без `__dsl_type__`, идентифицируются через `Array.isArray()`.

---

## 4. Object Methods

### Массив
- `Добавить(item)` — push
- `Количество()` — `length`
- `ВГраница()` — `length - 1`
- `Вставить(index, item)` — splice
- `Удалить(index)` — splice
- `Очистить()` — `length = 0`
- `Найти(item)` — `indexOf` → индекс или Неопределено

### ФиксированныйМассив
- `Количество()` — `length`
- `ВГраница()` — `length - 1`

### Структура
- `Вставить(key, value)` — case-insensitive insert
- `Свойство(key)` — чтение по ключу
- `Удалить(key)` — удаление по ключу
- `Количество()` — число свойств
- `Свойства()` — массив ключей

### Соответствие (Map)
- `Вставить(key, value)` — set, Date-ключи нормализуются в YYYYMMDD
- `Получить(key)` — get
- `Количество()` — size

### ФиксированноеСоответствие (FixedMap)
- `Количество()` — size
- `Получить(key)` — get (возвращает Неопределено при отсутствии)

### ТаблицаЗначений
- `Добавить()` — создаёт новую строку
- `Количество()` — число строк
- `НайтиСтроки(Фильтр)` — поиск по структуре
- `Удалить(Строка)` — удаление строки
- `Свернуть(Группировки, Суммы)` — aggregation (v1.3.x)
- `Сдвинуть(Строка, Смещение)` — перемещение строки
- `Скопировать(МассивСтрок?)` — копия таблицы
- `ВыгрузитьСтруктуру()` — массив структур

### СтрокаТаблицыЗначений
- `Получить(индекс)` — 0-based доступ по индексу колонки
- `toString()` → `"СтрокаТаблицыЗначений"`

### Колонки
- `Добавить(имя, тип?)` — добавить колонку
- `Удалить(цель)` — удалить (ref/индекс/имя)
- `Очистить()` — удалить все
- `Найти(имя)` — поиск по имени (case-insensitive)
- `Вставить(индекс, имя)` — вставка на позицию
- `Индекс(колонка)` — 0-based позиция
- `Количество()` — число колонок

### Индексы
- `Добавить(поля)` — добавить индекс
- `Удалить(индекс)` — удалить
- `Очистить()` — удалить все
- `Количество()` — число индексов

---

## 5. Magic Fields (Internal)

| Поле | Где | Назначение |
|------|-----|-----------|
| `__dsl_type__` | все DSL-объекты | runtime type tag (string) |
| `__values__` | ValueTableRow | case-insensitive storage `lowerKey → value` |
| `__owner__` | Row, Columns, Indexes | back-reference к родительской таблице |
| `__items__` | FixedArray, Columns, Indexes | внутренний array storage |
| `__map__` | Map | внутренний JS Map |
| `__rows__` | ValueTable | массив строк |
| `__fields__` | IndexDef | имена полей индекса |
| `__execDepth__` | context | shared recursion counter |
| `__variables__` | context | CaseInsensitiveMap переменных |
| `__functions__` | context | CaseInsensitiveMap функций |
| `__lastException__` | context | последнее исключение |
| `__dsl_error_wrapped__` | Error | маркер двойного wrapping (defineMethod) |
| `__dsl_inner_message__` | Error | исходное сообщение ошибки |

---

## 6. Compile Lowering Patterns

| DSL | JS IR | Примечание |
|-----|-------|-----------|
| `Имя` (read) | `context.__variables__.get("имя")` | CaseInsensitiveMap |
| `Имя = val` | `context.__variables__.set("имя", val)` | — |
| `Функция(args)` (builtin) | `__dsl_*(args)` | прямое имя sandbox-параметра |
| `Функция(args)` (user) | `context.__functions__.get("имя")(args)` | lookup по контексту |
| `Новый X(args)` | `__dsl_newX__(args)` | builtin-конструктор |
| `obj.prop` | `__dsl_index__(obj, "prop")` | dot-access read → index call |
| `obj.prop = val` | `__dsl_index_set__(obj, "prop", val)` | dot-access write → index_set |
| `obj[index]` | `__dsl_index__(obj, index)` | bracket read |
| `obj[index] = val` | `__dsl_index_set__(obj, index, val)` | bracket write |
| `a + b` | `__dsl_add__(a, b)` | BSL coercion |
| `a = b` | native JS `===` | **DEBT(v1.5):** будет __dsl_compare__ |
| `a > b` | native JS `>` | **DEBT(v1.5)** |
| `Для i По n Цикл` | `while (i <= n) { ... i++ }` | через .get/.set |
| `Для Каждого v Из col Цикл` | `for (const __item__ of col) { set(v, item); body }` | + scope cleanup |
| `Попытка ... Исключение ... КонецПопытки` | `try { ... } catch(e) { __lastException__ = e; ... }` | — |
| `ВызватьИсключение expr` | `throw new __dsl_RuntimeError__(expr, line)` | — |
| `ВызватьИсключение` | `throw context.__lastException__` | re-throw |
| `Возврат expr` | `return expr` | program mode only |
| `Вычислить(expr)` | `__dsl_eval__(expr, context)` | compileExpression, limited sandbox |
| `Выполнить(code)` | `__dsl_exec__(code, context)` | compileFragment, full sandbox |
| `ИнформацияОбОшибке()` | `__dsl_errorInfo__(context)` | автоподстановка context |

---

## 7. Context Model

```typescript
context = {
  __variables__: CaseInsensitiveMap,  // lowercased keys
  __functions__: CaseInsensitiveMap,  // lowercased keys
  __execDepth__: 0,                   // shared recursion counter (hard limit: 500)
  __lastException__: null,            // for ИнформацияОбОшибке()
}
```

### CaseInsensitiveMap
- Внутри: `Object.create(null)` с lowercased ключами
- Методы: `.get(name)`, `.set(name, value)`, `.delete(name)`
- Не ломает V8 hidden classes, сериализуем

---

## 8. Execution Envelope

```typescript
ExecutionResult = {
  success: boolean;
  output: OutputEvent[];       // { type: "message"|"warning"|"error"|"info", value: string }
  result?: unknown;            // последнее значение (для Вычислить)
  error?: {
    message: string;
    line?: number;             // только для DSRuntimeError
    column?: number;
    stack?: string;
  };
  diagnostics?: Diagnostic[];  // compile-time errors/warnings
  timing?: {
    parse: number;
    compile: number;
    execute: number;
  };
  runtimeVersion: string;      // RUNTIME_VERSION
}
```

---

## 9. Error Model

| Тип ошибки | Источник | `error.line` | Механизм |
|-----------|----------|-------------|----------|
| Compile | компилятор | в message | `throw new Error()` |
| DSL runtime | ВызватьИсключение | `e.line` | `DSRuntimeError` (branded symbol) |
| Method wrap | defineMethod | — | `new Error("Ошибка при вызове метода контекста (X)")` с `__dsl_inner_message__` |
| JS internal | TypeError/ReferenceError | `undefined` | native JS errors |

---

## 10. Capabilities

### Server (полный набор)
- functions: 24 (включая Найти)
- constructors: 10 (включая Запрос)

### Client (без SQLite)
- functions: 24
- constructors: 9 (без Запрос)

---

## 11. Key Semantic Decisions (зафиксированы)

| Решение | Значение |
|---------|---------|
| `coerceForDisplay` | единый display-helper (nullish→`""`, bool→`"Да"`/`"Нет"`, number→decimal) |
| `formatDslNumber` | decimal comma + space thousand separator |
| `dslCoerceString` | для `+`: undefined→Неопределено, null→Null, bool→Да/Нет, Date→YYYYMMDD |
| `ИнформацияОбОшибке().Описание` | `err.message` (wrapper), inner cause в `__dsl_inner_message__` |
| `row.toString` | `"СтрокаТаблицыЗначений"` |
| `ColumnDef.toString` | `"КолонкаТаблицыЗначений"` |
| `===` для `=` | native JS (DEBT v1.5) |
| Date-ключи в Map | нормализация в YYYYMMDD (value type) |
| Null | language literal, не lookup переменной |
| `Знач` в параметрах | silently skipped |
| `.` vs `[]` | transitional: оба через `__dsl_index__`/`__dsl_index_set__` |

---

*Snapshot создан перед v1.4 Unified Member Dispatch migration.*
*Любое изменение BUILTIN_KEYS, sandbox params, или compile lowering patterns должно сопровождаться обновлением этого документа.*
