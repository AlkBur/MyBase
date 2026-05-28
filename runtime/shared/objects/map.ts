/**
 * Соответствие — identity-based Map.
 *
 * Использует нативный JS Map внутри, что даёт:
 *   - undefined/null как ключи
 *   - boolean, number, string как ключи (SameValueZero)
 *   - object/UUID/Type как ключи (reference identity)
 *   - корректную семантику для Тип-синглтонов (один объект на имя типа)
 *
 * Date — исключение: в DSL дата value type, поэтому Date-ключи
 * нормализуются в строку YYYYMMDD. Два Date с одной датой = один ключ.
 *
 * НЕ использует:
 *   - lowercasing ключей (ломает UUID, Тип, object identity)
 *   - stringification всех ключей
 *   - сериализацию
 */
import { defineMethod, defineDSLType } from "./helpers";

/**
 * Нормализация Date-ключа: YYYYMMDD (value type в DSL).
 * Остальные типы проходят без изменений.
 */
function normalizeDSLKey(key: any): any {
  if (key instanceof Date) {
    const y = key.getFullYear();
    const m = String(key.getMonth() + 1).padStart(2, "0");
    const d = String(key.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }
  return key;
}

export function createMap(): any {
  const map: any = Object.create(null);
  const rawStorage = new Map<any, any>();

  // Прокси-обёртка: автоматически нормализует Date-ключи
  // через normalizeDSLKey перед передачей в rawStorage.
  // Сохраняет Map-интерфейс для прямого доступа из __dsl_index__ / __dsl_index_set__.
  const storage = {
    set(key: any, value: any) { rawStorage.set(normalizeDSLKey(key), value); },
    get(key: any) { return rawStorage.get(normalizeDSLKey(key)); },
    has(key: any) { return rawStorage.has(normalizeDSLKey(key)); },
    delete(key: any) { return rawStorage.delete(normalizeDSLKey(key)); },
    get size() { return rawStorage.size; },
    entries() { return rawStorage.entries(); },
    keys() { return rawStorage.keys(); },
    values() { return rawStorage.values(); },
    forEach(fn: any, thisArg?: any) { return rawStorage.forEach(fn, thisArg); },
    [Symbol.iterator]() { return rawStorage[Symbol.iterator](); },
  };

  defineDSLType(map, "Map");

  // Non-enumerable внутреннее хранилище
  Object.defineProperty(map, "__map__", {
    value: storage,
    enumerable: false,
    configurable: false,
    writable: false,
  });

  defineMethod(map, "Вставить", (key: any, value: any) => {
    storage.set(key, value);
  });

  defineMethod(map, "Количество", () => storage.size);

  Object.defineProperty(map, "toString", {
    value: () => "Соответствие",
    enumerable: false,
    configurable: false,
    writable: false,
  });

  return map;
}
