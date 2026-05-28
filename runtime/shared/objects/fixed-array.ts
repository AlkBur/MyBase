/**
 * ФиксированныйМассив — immutable DSL type.
 *
 * Является обёрткой над массивом, не допускающей изменения:
 *   - Нет методов Добавить/Вставить/Удалить/Очистить
 *   - Запись по индексу через __dsl_index_set__ запрещена (read-only guard)
 *   - Хранит shallow-копию исходного массива, чтобы мутация оригинала
 *     не влияла на фиксированный массив
 *
 * Архитектурное решение:
 *   Wrapper поверх JS array выбран осознанно — это даёт:
 *   - Полный контроль над DSL-ошибками (не native TypeError от Object.freeze)
 *   - Возможность нормального __dsl_index__ dispatch по __dsl_type__
 *   - Консистентность с __dsl_index_set__ (не полагаемся на JS-исключения)
 *
 * @module ФиксированныйМассив
 */

import { defineMethod, defineDSLType } from "./helpers";

export type DSLFixedArray = {
  __dsl_type__: "FixedArray";
  __items__: any[];
  Количество(): number;
  ВГраница(): number;
  toString(): string;
};

/**
 * Создаёт фиксированный массив из исходного массива (shallow copy).
 * @param source — исходный Массив (опционально, пустой если не передан)
 */
export function createFixedArray(source?: any): any {
  const items: any[] = [];

  if (source !== undefined) {
    if (!Array.isArray(source)) {
      throw new Error("Ошибка при вызове конструктора (ФиксированныйМассив)");
    }
    // Снимаем shallow-копию — мутация оригинала не затрагивает фиксированный массив
    for (const el of source) {
      items.push(el);
    }
  }

  // Объект без прототипа — полная изоляция от prototype chain
  const obj = Object.create(null);
  defineDSLType(obj, "FixedArray");

  // Внутреннее хранилище элементов (неперечислимое, немодифицируемое)
  Object.defineProperty(obj, "__items__", {
    value: items,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  // --- Публичные методы ---

  defineMethod(obj, "Количество", () => items.length);

  /**
   * ВГраница() — возвращает наибольший индекс.
   * Для пустого массива возвращает -1 (1С-семантика).
   */
  defineMethod(obj, "ВГраница", () => items.length - 1);

  // toString для конкатенации и вывода — делегирует в getDSLType
  Object.defineProperty(obj, "toString", {
    value: () => "Фиксированный массив",
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return obj;
}
