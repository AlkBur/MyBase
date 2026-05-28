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

`__dsl_index__` and `__dsl_index_set__` route through a centralized dispatch function
that checks `__dsl_type__` and delegates to the appropriate storage layer.
This is the foundation for future:
- prototype-chain hardening
- computed property interception
- readonly collection guards

## Future hardening

### `__dsl_member_get__` / `__dsl_member_set__`

Will replace current mixed model with unified member access:
- dot-access goes through same dispatch as bracket-access
- case-insensitive semantics guaranteed for all access patterns
- prototype-chain traversal restricted to own-properties only

### Prototype-chain hardening

Currently: `obj[key]` fallback allows prototype-chain traversal.
Future: restricted to own-properties via `Object.hasOwn()`.

### Serialization

`__dsl_type__` will drive a unified serialization contract
(JSON.stringify replacer, structured clone, debugger formatters).
