/**
 * ФиксированноеСоответствие — immutable DSL type.
 *
 * Является immutable-обёрткой над Map (Соответствие):
 *   - Нет метода Вставить
 *   - Запись через __dsl_index_set__ запрещена (read-only guard)
 *   - Чтение несуществующего ключа через [] бросает исключение
 *   - Получить(key) возвращает Неопределено для отсутствующего ключа
 *   - Хранит shallow-копию пар исходного Map'а
 *
 * Архитектурное решение:
 *   Wrapper поверх JS Map (не plain object) — даёт:
 *   - Identity-based ключи (любые типы, как у Соответствие)
 *   - Единую нормализацию Date-ключей
 *   - Консистентность с Соответствие по семантике ключей
 */
import { defineMethod, defineDSLType, isDSLMap, isDSLFixedMap } from "./helpers";
import { DSRuntimeError } from "../errors";

export type DSLFixedMap = {
  __dsl_type__: "FixedMap";
  __items__: Map<any, any>;
  Количество(): number;
  Получить(key: any): any;
  toString(): string;
};

/**
 * Создаёт фиксированное соответствие из source (Соответствие или ФиксированноеСоответствие).
 * Снимает shallow-копию пар — мутация оригинала не затрагивает фиксированное соответствие.
 * @param source — исходный Map или FixedMap (опционально, пустой если не передан)
 */
export function createFixedMap(source?: any): any {
  // Валидация source — только DSL Map или FixedMap
  if (source !== undefined && !isDSLMap(source) && !isDSLFixedMap(source)) {
    throw new DSRuntimeError(
      "Ошибка при вызове конструктора (ФиксированноеСоответствие)"
    );
  }

  const storage = new Map<any, any>();

  // Снимаем shallow-копию пар из source
  if (source !== undefined) {
    const srcStorage = isDSLMap(source) ? source.__map__ : source.__items__;
    for (const [key, value] of srcStorage.entries()) {
      storage.set(key, value);
    }
  }

  // Объект без прототипа — полная изоляция от prototype chain
  const obj = Object.create(null);
  defineDSLType(obj, "FixedMap");

  // Внутреннее хранилище пар (неперечислимое, немодифицируемое)
  Object.defineProperty(obj, "__items__", {
    value: storage,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  // --- Публичные методы ---

  defineMethod(obj, "Количество", () => storage.size);

  /**
   * Получить(key) — безопасное чтение, возвращает Неопределено
   * для отсутствующего ключа. В отличие от bracket-доступа,
   * не бросает исключение.
   */
  defineMethod(obj, "Получить", (key: any) => {
    return storage.has(key) ? storage.get(key) : undefined;
  });

  // toString для конкатенации и вывода
  Object.defineProperty(obj, "toString", {
    value: () => "Фиксированное соответствие",
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return obj;
}
