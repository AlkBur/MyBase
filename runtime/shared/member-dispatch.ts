/**
 * Member dispatch registry — unified member access dispatch tables.
 *
 * Registration-based dispatch (not mega-switch) для __dsl_member_get__ / __dsl_member_set__.
 *
 * TRANSITION(v1.4):
 *   Registry заполняется в B.1.3–B.1.4 (Structure, Row).
 *   В B.1.5 регистрируется полиморфный dispatch.
 *   После B.3 регистр используется как единственный dispatch path.
 *
 * Почему registry, а не switch:
 *   - каждая регистрация изолирована (можно тестировать по одному типу)
 *   - легко добавить instrumentation (hit/miss counters)
 *   - inline cache проще построить поверх registry
 *
 * DEBT(v1.5):
 *   Специализировать hot paths (ValueTableRow, Структура, Колонки).
 *   Perf: текущий dispatch ~150–200x медленнее JS property access.
 */

import type { DSLValueTableRow } from "./objects/value-table-row";
import type { ColumnDef } from "./objects/value-table-columns";
import type { DSLIndexDef } from "./objects/value-table-indexes";
import type { DSLType } from "./objects/type";

/** getter для одного DSL-типа */
export type MemberGetter = (target: any, prop: string) => unknown;

/** setter для одного DSL-типа */
export type MemberSetter = (target: any, prop: string, value: any) => void;

// ----- Registry -----

const memberGetRegistry = new Map<string, MemberGetter>();
const memberSetRegistry = new Map<string, MemberSetter>();
let registrySealed = false;

/**
 * Регистрирует getter для DSL-типа.
 * После sealMemberRegistry() вызов бросит ошибку.
 */
export function registerMemberGetter(typeName: string, getter: MemberGetter): void {
  if (registrySealed) throw new Error("Member dispatch registry is sealed");
  memberGetRegistry.set(typeName, getter);
}

/**
 * Регистрирует setter для DSL-типа.
 * После sealMemberRegistry() вызов бросит ошибку.
 */
export function registerMemberSetter(typeName: string, setter: MemberSetter): void {
  if (registrySealed) throw new Error("Member dispatch registry is sealed");
  memberSetRegistry.set(typeName, setter);
}

/**
 * Запечатывает registry — запрещает дальнейшие регистрации.
 * Используется в benchmark'ах для стабилизации JIT assumptions.
 */
export function sealMemberRegistry(): void {
  registrySealed = true;
}

// ----- Dispatch -----

export function dispatchMemberGet(target: any, prop: string): unknown {
  const typeName = target?.__dsl_type__;
  if (typeName && memberGetRegistry.has(typeName)) {
    return memberGetRegistry.get(typeName)!(target, prop);
  }
  // Fallback: native JS property access
  // DEBT(v1.4): prototype-chain traversal currently allowed
  return target?.[prop];
}

export function dispatchMemberSet(target: any, prop: string, value: any): void {
  const typeName = target?.__dsl_type__;
  if (typeName && memberSetRegistry.has(typeName)) {
    memberSetRegistry.get(typeName)!(target, prop, value);
    return;
  }
  target[prop] = value;
}

// ===== B.1.3: Structure dispatch =====

/**
 * В Structure данные хранятся в closure, не на объекте.
 * Делегируем на метод Свойство() — он делает case-insensitive lookup по data[lowerKey].
 * Если ключ не найден → undefined (BSL-семантика).
 *
 * Почему не прямой доступ к __data__:
 *   - closure storage — деталь имплементации createStructure()
 *   - Свойство() уже инкапсулирует lookup + case folding
 *   - B1.3 — первый real dispatch; прямая data-связка позже при Symbol migration
 *
 * TRACKING(v1.4): переписать на Symbol-доступ после C.1 (__data__ → Symbol)
 */
registerMemberGetter("Структура", (target: any, prop: string) => {
  return target.Свойство(prop);
});

// ----- Debug instrumentation (disabled by default) -----

// TRANSITION(v1.4): enable behind debug flag for dispatch hit/miss tracking
// let memberGetHits = 0;
// let memberGetMisses = 0;
// let memberSetHits = 0;
// let memberSetMisses = 0;

// export function resetDispatchCounters(): void {
//   memberGetHits = 0;
//   memberGetMisses = 0;
//   memberSetHits = 0;
//   memberSetMisses = 0;
// }

// export function getDispatchCounters() {
//   return { memberGetHits, memberGetMisses, memberSetHits, memberSetMisses };
// }
