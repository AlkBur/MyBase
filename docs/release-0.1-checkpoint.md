# Release 0.1 Checkpoint

## Phase A — Web Playground

**Status:** Completed

### Manual UI Verification (B)

| Test | Result |
|------|--------|
| Static file serving (`GET /`, 200) | ✅ PASS |
| Execute `Сообщить("Hello")` | ✅ PASS |
| Loop 1..10 (10 lines output) | ✅ PASS |
| Error `НеизвестнаяФункция()` | ✅ PASS |
| Empty code | ✅ PASS |
| Syntax error `Сообщить(` | ✅ PASS |
| Large output loop 1..1000 | ✅ PASS |

### Automated Test Suite (C)

| Suite | Result |
|-------|--------|
| Golden runtime tests (25) | ✅ All pass |
| Compile snapshot tests (9) | ✅ All pass |
| ABI assertions (9) | ✅ All pass |
| Invariant tests (9) | ⚠️ 8/9 pass |

**Known invariant failure:**

```
structure.Ключ === structure['Ключ'] (dot == bracket): dot=1 bracket=
```

This is a documented transitional state (compiler invariant #23).
Bracket/dot unification is deferred to Phase D (B.1.6).
Covered by: `Core Freeze until Release 0.1`.

---

## Phase B — Storage (SQLite + CRUD)

**Status:** Completed

### CRUD Smoke Tests (18/18)

| Test | Result |
|------|--------|
| POST — create script | ✅ PASS |
| POST — empty body defaults | ✅ PASS |
| GET — list scripts | ✅ PASS |
| GET /:id — existing script | ✅ PASS |
| GET /:id — nonexistent (404) | ✅ PASS |
| PUT — update source | ✅ PASS |
| PUT — nonexistent (404) | ✅ PASS |
| DELETE — existing script | ✅ PASS |
| DELETE — nonexistent (404) | ✅ PASS |

### UI Features

- Auto-create on +Новый (POST immediately)
- Dirty flag with `suppressDirty` guard
- Visual `Изменено` indicator
- Confirm dialog on dirty switch
- Clean init without monkey-patch
- XSS-safe `textContent` rendering

### Automated Test Suite

| Suite | Result |
|-------|--------|
| Golden runtime tests (25) | ✅ All pass |
| ABI assertions (9) | ✅ All pass |
| Compile invariants (17) | ✅ All pass |
| Member access invariants (8/9) | ⚠️ 1 known transitional |

**Date:** 2026-05-31

**Next:** Phase C — Examples & Export

---

## Phase C — Examples & Export

**Status:** Completed

### Examples (5 scripts)

| File | Description | API Result |
|------|-------------|------------|
| `hello.os` | Сообщить, строки, шаблоны, булевы, Null | ✅ 10 lines |
| `loops.os` | Для, Для Каждого, Пока, вложенные циклы | ✅ 31 lines |
| `arrays.os` | Массив, ФиксированныйМассив, методы | ✅ 20 lines |
| `functions.os` | Процедуры, Функции, рекурсия, Вычислить | ✅ 11 lines |
| `objects.os` | Структура, Соответствие, ТаблицаЗначений, СписокЗначений, ТипЗнч | ✅ 32 lines |

### UI Features

- `<select>` in toolbar: загрузка примера с `confirmIfDirty`
- Кнопка «Скачать»: Blob → download `.os` файл
- Все примеры из `public/examples/*.os` через `GET /examples/*.os`

### Commit History

- `517d8fe` — Phase B: storage and playground stabilization (tag: `phase-b-baseline`)
- *(next)* — Phase C: examples and export (tag: `release-0.1`)

---

## Summary: Release 0.1 Complete

| Phase | Status |
|-------|--------|
| A — Web Playground | ✅ Complete |
| B — Storage | ✅ Complete |
| C — Examples | ✅ Complete |
| Release 0.1 | ✅ Ready |
