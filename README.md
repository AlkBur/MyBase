# MyBase — 1C-like DSL Platform

BSL-inspired runtime with zero-install embedded automation (SQLite + Bun).

## Quick Start

```bash
bun install
bun run web        # http://localhost:3000
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run web` | HTTP playground (port 3000, CRUD + examples) |
| `bun run test` | Golden tests (check mode) |
| `bun run typecheck` | TypeScript type check (app only) |
| `bun run test:abi` | ABI assertions |
| `bun run build` | Build to EXE |

## Architecture

DSL code → Tokenizer → Compiler → JS IR → Sandbox Runtime (Server: JIT `new Function()`, Client: AST interpreter stub).

## Forms (Phase D)

> ⚠️ Forms are planned for Phase D.
>
> Release 0.1 includes:
> - Playground
> - Script Storage
> - Examples
>
> Forms documentation describes the frozen contract and future implementation.

### Directory Structure

Source of truth for forms — filesystem.

```
/pages
  manifest.json

  /main
    layout.json
    module.bsl
    meta.json

  /users
    layout.json
    module.bsl
    meta.json
```

- `manifest.json` — page discovery at build time
- `layout.json` — tree of UI components (`root.children`)
- `module.bsl` — form event handlers
- `meta.json` — publication metadata

### layout.json Example

```json
{
  "root": {
    "type": "VerticalGroup",
    "children": [
      {
        "type": "ПолеВвода",
        "name": "Имя",
        "title": "Имя",
        "dataPath": "Объект.Имя"
      },
      {
        "type": "Кнопка",
        "name": "Сохранить",
        "title": "Сохранить",
        "events": {
          "ПриНажатии": "ПриНажатии"
        }
      }
    ]
  }
}
```

### Supported Controls

| Type | Purpose | Status |
|------|---------|--------|
| `VerticalGroup` | Vertical layout container | Planned |
| `HorizontalGroup` | Horizontal layout container | Planned |
| `Group` | Logical group with border/title | Planned |
| `Tabs` | Tab container | Planned |
| `Page` | Single tab page | Planned |
| `Table` | Tabular data element | Planned |
| `ПолеВвода` | Text input field | Planned |
| `Кнопка` | Button | Planned |

Not all controls are implemented in Release 0.1.

### Common Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | Unique element identifier |
| `title` | string | Display label |
| `width` | string | Width (px or %) |
| `enabled` | boolean | Initially enabled |
| `visible` | boolean | Initially visible |
| `variant` | string | Visual variant: `primary`, `secondary`, `danger` |
| `dataPath` | string | Bind to form state field |
| `events` | object | Event handler map |

### Data Binding

`dataPath` binds a control to a field in the form state:

```json
{
  "type": "ПолеВвода",
  "name": "Город",
  "title": "Город",
  "dataPath": "Объект.Город"
}
```

The runtime automatically reads and writes `state.Объект.Город`.

### Events

Reserved event names:

```
ПриСозданииНаСервере
ПриОткрытии
ПриЗакрытии
ПриИзменении
ПриНажатии
```

### module.bsl Example

```bsl
Процедура ПриСозданииНаСервере(Форма, Отказ)
    Форма.Объект.Имя = "Новая запись";
КонецПроцедуры

Процедура ПриНажатии(Элемент, Форма)
    Сообщить("Нажата кнопка: " + Элемент.Имя);
КонецПроцедуры
```

### Renderer Rules

Forms describe semantics, not CSS.

- `layout.json` must not contain `class`
- `layout.json` must not contain `style`
- Renderer transforms components to HTML
- Visual styling is defined by theme
- Display variants are set via `variant`:
  - `primary`
  - `secondary`
  - `danger`

### Runtime Model

Browser never works with layout files directly.

```
Browser
  ↓
FormSession
  ↓
Runtime
  ↓
JSON UI State
  ↓
Browser
```

FormSession is transport-agnostic.

Release 0.1:
- HTTP transport

Reserved:
- WebSocket transport

### Build Pipeline

```
pages/*
    ↓
build-pages
    ↓
SQLite (forms)
```

Forms are edited in filesystem. SQLite is deployment storage only, fully rebuildable from `/pages/`.

```bash
bun run build-pages    # planned — build forms from /pages/ to SQLite
```

## Documentation

[AGENTS.md](./AGENTS.md) — full architecture, roadmap, freezes, and contracts.
