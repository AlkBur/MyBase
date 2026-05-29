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

  // toString для String() / конкатенации (иначе Object.create(null) бросает "No default value" в Bun)
  Object.defineProperty(s, "toString", {
    value: () => "Структура",
    enumerable: false, configurable: true, writable: true,
  });

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

  // Инициализация вариативными аргументами
  // Поддерживается два стиля:
  //   1. 1С-стиль: Новый Структура("Ключ1,Ключ2", Знач1, Знач2)
  //   2. Новый стиль: Новый Структура("К1", Знач1, "К2", Знач2, ...)
  if (args.length > 0 && typeof args[0] === "string" && args[0].includes(",")) {
    // 1С-стиль: первый аргумент — список ключей через запятую
    const keys = args[0].split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
    for (let i = 0; i < keys.length; i++) {
      // Если значений больше нет — Неопределено
      const value = i + 1 < args.length ? args[i + 1] : undefined;
      s.Вставить(keys[i], value);
    }
  } else {
    // Новый стиль: чередующиеся ключ, значение, ключ, значение, ...
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i];
      const value = args[i + 1];
      if (key !== undefined) {
        s.Вставить(String(key), value);
      }
    }
  }

  return s;
}
