# Prototype-chain hardening (design note)

> Security consideration: sandboxed execution vs native JS objects.
> **Current runtime is sandboxed for accidental misuse, not hostile adversarial execution.**

---

## Threat model

Текущая архитектура использует:

- `new Function()` для server JIT
- Plain JS arrays/objects для Массив/Структура
- `Object.create(null)` для CaseInsensitiveMap

Это означает, что:

- `Массив.constructor.constructor("return this")()` — потенциально доступен
- `__proto__` pollution — возможен через member access
- `prototype` chain — не заблокирован

При этом:

- Нет `globalThis`, `require`, `process` в sandbox params
- Все builtins контролируются
- Компилятор контролирует код до выполнения

---

## Attack surface

| Vector | Risk | Notes |
|--------|------|-------|
| `obj.constructor.constructor(...)` | Medium | Требует знания JS от пользователя DSL |
| `__proto__` assignment | Low | Структура использует plain objects |
| `prototype` pollution | Low | Массив — native JS Array |
| Sandbox via `eval`/`new Function` | None | Не передаются в sandbox params |

---

## Why not fixing now

1. **Runtime semantics not stabilized.** Closures, interpreter, fragment semantics — всё это изменит object model.
2. **Ad-hoc blacklists are fragile.** `if (name === "__proto__")` в 20 местах — endless whack-a-mole.
3. **DST is developer-facing, not multi-tenant.** Сейчас runtime не предназначен для hostile code execution (untrusted input).
4. **Performance overhead.** Wrapping коллекций добавит overhead до стабилизации семантики.

---

## Future options

### A. Wrapped collections (DSLArray / DSLStructure)

```ts
class DSLArray {
  #data: any[];
  Добавить(val) { this.#data.push(val); }
  // whitelist API — никакого доступа к prototype/constructor
}
```

- Safest вариант
- Требует переписывания коллекций
- Ломает сериализацию

### B. Member access validation

На compiler/runtime boundary:

```ts
const FORBIDDEN_MEMBERS = new Set(["__proto__", "prototype", "constructor"]);
```

- Compile-time check для `.property` access
- Не защищает от runtime dynamic access
- Blacklist — fragile by nature

### C. AST interpreter

Client runtime interpreter использует AST walker без JS property access.
Естественно решает часть проблем prototype-chain.

---

## Recommendation

**Defer до стабилизации semantics и появления closures.**

Действия сейчас:

1. Зафиксировать threat model в этом документе
2. Вернуться к вопросу после:
   - runtime semantics document
   - closures
   - client interpreter design
3. Тогда выбрать один из вариантов (A, B, или комбинацию)
