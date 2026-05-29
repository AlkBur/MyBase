# Object Model — DSL Runtime Layer

## Invariants

### DSL objects are NOT plain JS objects

All runtime DSL objects carry a non-enumerable `__dsl_type__` property:

```ts
{
  __dsl_type__: "ValueTable"     // non-enumerable, readonly
}
```

This enables:
- runtime type dispatch (`__dsl_index__`, `__dsl_index_set__`)
- future: serialization, debugger, reflection
- isolation from plain JS objects

### All runtime collections are capability-controlled

Constructors are only available if declared in `RuntimeCapabilities.constructors`.
Compile-time validation prevents creating disallowed objects.

### Object identity is preserved

Each DSL object retains its identity across operations.
No implicit cloning, no implicit re-creation.

### Case-insensitive semantics at storage layer

DSL object storage (`__values__` in rows, `data` in structures) uses lowercased keys.
This guarantees `row["К1"] === row["к1"]` via the dispatch layer.

### Member access model is transitional

Current model:

| Access pattern | API layer | Case-insensitive? |
|---|---|---|
| `obj["key"]` | `__dsl_index__` / `__dsl_index_set__` (dispatch) | ✅ |
| `obj.key` (dot) | native JS property | ❌ not guaranteed |

**Intentional:**
- `row["key"]` — canonical API. All DSL semantics guaranteed.
- `row.key` — currently falls back to JS property semantics.
  Case-insensitivity NOT guaranteed.
  Exists in tests by accident of consistent casing.
  Will be hardened via `__dsl_member_get__` / `__dsl_member_set__` in future.

### `[]` is dispatch-based, not native JS indexing

`__dsl_index__` (read) and `__dsl_index_set__` (write) route through a centralized dispatch
function that checks `__dsl_type__` and delegates to the appropriate storage layer.
This provides:
- per-type read/write semantics (readonly guards for FixedMap, Indexes)
- bounds checking for columns, rows, indexes
- case-insensitive member access on DSL objects
- foundation for member dispatch migration (v1.4 Phase B)

### Transitional bridge: native property sync

Currently, `__dsl_index_set__` for `DSLValueTableRow` writes to both `__values__[lower]`
and `row[originalKey]` (native property). This is `TRANSITION(v1.4)` — a bridge for
dot-access consistency, to be removed in v1.4 Phase B.2 after member_set migration.

## v1.4 Member dispatch migration

### Phase B.1 — Read-only (`__dsl_member_get__`)

Introduce unified read dispatch:
- compile.ts dot-access (`obj.prop`) → `__dsl_member_get__`
- compile.ts bracket-access (`obj["prop"]`) → `__dsl_member_get__`
- Same dispatch for all DSL object types (Row, Table, Structure, Map, etc.)
- Transitional native-property fallback preserved (removed in B.2)

### Phase B.2 — Stabilization

- Remove native-property fallback in `__dsl_index__` (ValueTableRow)
- Remove native-property sync in `__dsl_index_set__` (ValueTableRow)
- Remove native-property fallback in `НайтиСтроки`
- Remove native-property sync in `Свернуть`
- Verify all golden tests pass with member_get-only dispatch

### Phase B.3 — Write dispatch (`__dsl_member_set__`)

- compile.ts assignment → `__dsl_member_set__` (instead of `__dsl_index_set__`)
- Replace `__dsl_index_set__` calls with `__dsl_member_set__`
- Remove `__dsl_index__` / `__dsl_index_set__` builtins entirely

### Phase C — Hardening

- Symbol migration: `__dsl_type__` → `Symbol("dsl:type")`, `__values__` → `Symbol("dsl:values")`
- Formalize member dispatch in RFC-0001
- `__dsl_member_get__` restricts to own-properties via `Object.hasOwn()`

## Future hardening (v1.5+)

### Comparison engine

`__dsl_compare__` replaces native `===`, `>`, `<`, `>=`, `<=` for DSL semantics
(type-sensitive comparison, BSL collation).

### Serialization

`__dsl_type__` will drive a unified serialization contract
(JSON.stringify replacer, structured clone, debugger formatters).
