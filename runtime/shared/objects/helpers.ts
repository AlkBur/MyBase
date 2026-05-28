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

export function defineMethod(obj: any, name: string, fn: Function): void {
  Object.defineProperty(obj, name, {
    value: fn,
    enumerable: false,
    configurable: false,
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
