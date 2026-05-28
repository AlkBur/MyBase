/**
 * Массив — DSL-обёртка над JS Array.
 *
 * Вынесен из builtins.ts в отдельный модуль для:
 *   - упрощения builtins.ts (делегирует сюда)
 *   - возможности переиспользовать в client runtime
 *   - единой точки изменения методов массива
 *
 * Отличия от 1С:
 *   0-based индексы (1С — 1-based для Найти, но 0-based для Вставить/Удалить)
 *   Найти возвращает индекс (0-based) или Неопределено
 */

import { defineMethod } from "./helpers";

/**
 * Создаёт новый DSL-массив.
 * @param size — опциональный размер (Новый Массив(5))
 */
export function createArray(size?: number): any[] {
  const arr: any[] = [];

  if (size !== undefined) {
    if (typeof size !== "number" || !Number.isInteger(size) || size < 0) {
      throw new Error("Ошибка при вызове конструктора (Массив)");
    }
    arr.length = size;
  }

  defineMethod(arr, "Добавить", (item: any) => { arr.push(item); });
  defineMethod(arr, "Количество", () => arr.length);
  defineMethod(arr, "Вставить", (index: number, item: any) => {
    if (index < 0 || index > arr.length) throw new Error("Индекс находится за границами массива");
    arr.splice(index, 0, item);
  });
  defineMethod(arr, "Удалить", (index: number) => {
    if (index < 0 || index >= arr.length) throw new Error("Индекс находится за границами массива");
    arr.splice(index, 1);
  });
  defineMethod(arr, "Очистить", () => { arr.length = 0; });
  defineMethod(arr, "Найти", (item: any) => {
    const i = arr.indexOf(item);
    return i === -1 ? undefined : i;
  });

  return arr;
}
