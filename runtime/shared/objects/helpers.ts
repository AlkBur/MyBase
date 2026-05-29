/**
 * Вспомогательные утилиты для DSL-объектов.
 *
 * defineMethod — добавляет non-enumerable метод на объект.
 * Используется для методов Массив, Структура, ТаблицаЗначений и т.д.
 *
 * Почему non-enumerable:
 *   - методы не должны появляться в Для Каждого / Свойства()
 *   - методы не должны сериализоваться
 *   - чище в debug-выводе
 */

export function defineMethod(obj: any, name: string, fn: Function, configurable: boolean = false): void {
  // Оборачиваем метод для единого форматирования BSL-ошибок.
  // При выбрасывании исключения из метода (например, Сдвинуть → DSRuntimeError),
  // мы перехватываем его и создаём новое с контекстным сообщением
  // "Ошибка при вызове метода контекста (ИмяМетода)".
  // Исходное сообщение сохраняется в __dsl_inner_message__ для ИнформацияОбОшибке().
  //
  // Почему не на уровне компилятора:
  //   - централизованно в defineMethod, не нужно менять каждый метод вручную
  //   - единый формат сообщений для всех DSL-методов
  //   - защита от двойного wrapping через __dsl_error_wrapped__
  const wrapped = (...args: any[]) => {
    try {
      return fn(...args);
    } catch (e: any) {
      // Предотвращаем двойной wrapping (если ошибка уже обёрнута)
      if (e?.__dsl_error_wrapped__) throw e;

      const inner = e instanceof Error ? e.message : String(e);
      const wrappedErr = new Error(
        `Ошибка при вызове метода контекста (${name})`
      );
      (wrappedErr as any).__dsl_error_wrapped__ = true;
      (wrappedErr as any).__dsl_inner_message__ = inner;

      throw wrappedErr;
    }
  };

  Object.defineProperty(obj, name, {
    value: wrapped,
    enumerable: false,
    configurable,
    writable: false,
  });
}

/**
 * Тип DSL-объекта (non-enumerable, readonly).
 * @param obj — целевой объект
 * @param typeName — значение __dsl_type__
 */
export function defineDSLType(obj: any, typeName: string): void {
  Object.defineProperty(obj, "__dsl_type__", {
    value: typeName,
    enumerable: false,
    writable: false,
    configurable: false,
  });
}

/**
 * Type guards для DSL-объектов.
 * Используют __dsl_type__ (non-enumerable) для идентификации.
 */

export function isDSLArray(obj: any): obj is any[] {
  return Array.isArray(obj);
}

export function isDSLFixedArray(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "FixedArray";
}

export function isDSLValueTable(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "ValueTable";
}

export function isDSLValueTableRow(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "ValueTableRow";
}

export function isDSLColumns(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "ValueTableColumns";
}

export function isDSLIndexes(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "ValueTableIndexes";
}

export function isDSLStructure(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "Структура";
}

export function isDSLMap(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "Map";
}

export function isDSLFixedMap(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "FixedMap";
}

export function isDSLUUID(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "UniqueIdentifier";
}

export function isDSLType(obj: any): boolean {
  return obj != null && obj.__dsl_type__ === "Type";
}
