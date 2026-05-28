/**
 * УникальныйИдентификатор — UUID v4.
 *
 * Использует crypto.randomUUID() для генерации.
 * Каждый вызов createUUID() создаёт новый уникальный объект —
 * разных UUID всегда разные, даже с одинаковым значением.
 *
 * toString() возвращает каноническую форму "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx".
 */

import { defineDSLType } from "./helpers";

export type DSLUUID = {
  __dsl_type__: "UniqueIdentifier";
  value: string;
  toString(): string;
};

export function createUUID(): DSLUUID {
  const uuid = crypto.randomUUID();
  const obj = Object.create(null) as DSLUUID;
  defineDSLType(obj, "UniqueIdentifier");
  (obj as any).value = uuid;
  Object.defineProperty(obj, "toString", {
    value: () => uuid,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  return obj;
}
