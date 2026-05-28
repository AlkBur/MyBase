/**
 * Структура — DSL-объект с динамическими свойствами.
 *
 * Поддерживает регистронезависимый доступ к свойствам.
 * В отличие от 1С, конструктор принимает вариативные аргументы:
 *   Новый Структура("К1", Значение1, "К2", Значение2, ...)
 *
 * Внутреннее хранение: data[lowerKey] с сохранением оригинальных ключей.
 */

import { defineMethod, defineDSLType } from "./helpers";

export function createStructure(...args: any[]): Record<string, any> {
  const s = Object.create(null);
  const data: Record<string, any> = Object.create(null);
  const originalKeys: Record<string, string> = Object.create(null);
  let count = 0;

  const norm = (k: string) => String(k).toLowerCase();

  defineDSLType(s, "Структура");

  defineMethod(s, "Вставить", (key: string, value: any) => {
    const nk = norm(key);
    if (!(nk in originalKeys)) {
      originalKeys[nk] = key;
      count++;
    }
    data[nk] = value;
  });

  defineMethod(s, "Свойство", (key: string) => data[norm(key)]);

  defineMethod(s, "Удалить", (key: string) => {
    const nk = norm(key);
    if (nk in originalKeys) {
      delete originalKeys[nk];
      delete data[nk];
      count--;
    }
  });

  defineMethod(s, "Количество", () => count);

  defineMethod(s, "Свойства", () => Object.values(originalKeys));

  // Инициализация вариативными аргументами: ключ1, знач1, ключ2, знач2, ...
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];
    if (key !== undefined) {
      s.Вставить(String(key), value);
    }
  }

  return s;
}
