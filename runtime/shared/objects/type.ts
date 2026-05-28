/**
 * Тип() — singleton type descriptor.
 *
 * Module-level cache: Тип("Строка") возвращает тот же объект,
 * что и любой другой вызов с тем же именем. Это даёт reference
 * identity для Map-ключей и сравнения:
 *   Тип("Строка") = Тип("Строка")  // true (same object)
 *
 * Альтернативы не подошли:
 *   - new-каждый-раз: ломает сравнения и Map-ключи
 *   - plain string: теряет future metadata (параметры типа, квалификаторы)
 */

import { defineDSLType } from "./helpers";

export type DSLType = {
  __dsl_type__: "Type";
  name: string;
  toString(): string;
};

const typeCache = new Map<string, DSLType>();

/**
 * Маппинг канонических имён в пользовательские отображения.
 * Некоторые 1С-типы при выводе в Сообщить показываются с пробелом
 * (напр. "ФиксированныйМассив" → "Фиксированный массив").
 * Это поведение соответствует 1C:Enterprise.
 */
const TYPE_DISPLAY_NAMES: Record<string, string> = {
  "фиксированныймассив": "Фиксированный массив",
  "фиксированноесоответствие": "Фиксированное соответствие",
};

/**
 * Возвращает singleton-объект типа по имени.
 * Регистронезависимое сопоставление имён 1С-типов.
 * @param name — каноническое имя типа (напр. "ФиксированныйМассив")
 * @param displayName — опциональное пользовательское отображение (если нужно переопределить)
 */
export function getDSLType(name: string, displayName?: string): DSLType {
  const lower = String(name).toLowerCase();
  // Если уже есть в кэше — возвращаем тот же объект
  let t = typeCache.get(lower);
  if (t) return t;

  // Создаём новый тип, freeze для иммутабельности
  const obj = Object.create(null) as DSLType;
  defineDSLType(obj, "Type");
  (obj as any).name = name;
  const display = displayName ?? TYPE_DISPLAY_NAMES[lower] ?? name;
  Object.defineProperty(obj, "toString", {
    value: () => display,
    enumerable: false,
    configurable: false,
    writable: false,
  });
  Object.freeze(obj);

  typeCache.set(lower, obj);
  return obj;
}
