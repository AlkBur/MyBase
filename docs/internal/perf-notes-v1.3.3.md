# perf-notes-v1.3.3.md

## Context

This document captures baseline dispatch microbenchmark observations before the B1.2 lowering migration (`obj.Prop` → `__dsl_member_get__`).

**Environment:**

- Runtime: v1.3.3
- Bun: 1.3.14
- Platform: Windows
- Benchmark suite: `tests/perf/member-dispatch/member-get.bench.ts`

**IMPORTANT:** Absolute nanosecond values on Bun/Windows are noisy. Relative ratios between scenarios are the primary signal.

---

## Dispatch Microbenchmarks

| Scenario             | Median | Relative |
| -------------------- | -----: | -------: |
| direct-js            |   27ns |     1.0x |
| plain-fallback       |   45ns |     1.7x |
| registered           |   55ns |     2.0x |
| registered-nullproto |  138ns |     5.1x |

---

## Interpretation

### Builtin boundary cost is low

`plain-fallback` is only ~1.7x slower than direct JS property access.

This indicates that:

- sandbox builtin invocation cost is acceptable,
- dispatch abstraction itself is viable,
- B1.2 lowering migration is unlikely to fail purely due to call overhead.

---

### Registry lookup is NOT the bottleneck

`registered` adds only ~10ns over `plain-fallback`.

Implication:

- `Map` lookup + indirect handler call are near-noise relative to builtin call overhead,
- future optimization work should focus elsewhere:
  - lowercase normalization,
  - row/column lookup,
  - shape instability,
  - allocation pressure,
  - polymorphic dispatch paths.

This significantly de-risks the unified member dispatch architecture.

---

### Null-prototype objects are unsuitable for hot runtime paths

`registered-nullproto` shows ~5.1x slowdown versus direct JS access.

Observed implications:

- prototype-less objects likely degrade inline caches,
- dictionary-mode behavior is expensive,
- hidden-class stability matters significantly.

**Conclusion:** `Object.create(null)` should not be used for hot runtime objects such as:

- ValueTableRow
- Structure
- Map-like runtime containers

Future runtime object work (v1.5+) should prefer:

- stable shaped objects,
- normal prototype chains,
- slot-backed storage.

---

## B.0 Snapshot Canary

After B1.2 migration:

```bash
rg "__dsl_member_get__" tests/compile/expected
```

Expected:

- only dot-access snapshots contain `__dsl_member_get__`
- bracket-access snapshots MUST continue using `__dsl_index__`

**Rationale:** B1.2 intentionally narrows migration scope to dot-access lowering only.

If bracket-access snapshots begin containing `__dsl_member_get__`, this indicates accidental over-migration of bracket semantics.

This can silently break:

- error-path asymmetry,
- row lookup semantics,
- indexed access behavior,
- future B1.3/B1.4 stabilization assumptions.

---

## Expectations for B1.2

Expected:

- microbench numbers remain mostly unchanged,
- DSL-level benchmarks (`member-access.*`) may regress slightly due to lowering rewrite.

Interpretation rule:

- if microbench remains stable but DSL benchmarks regress,
  the issue is likely in generated JS / lowering shape,
  NOT in dispatch implementation itself.

---

## Forward-looking notes (v1.5)

Likely future bottlenecks:

- lowercase normalization (`toLowerCase`)
- row column resolution
- polymorphic access chains
- dynamic property fallback paths

Likely NOT bottlenecks:

- registry lookup itself
- builtin call boundary itself
