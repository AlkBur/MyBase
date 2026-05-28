/**
 * Строка ТаблицыЗначений — DSLValueTableRow.
 *
 * Хранение: __values__: Record<lowerKey, unknown>
 *   — нижний регистр для case-insensitive семантики
 *
 * Доступ:
 *   row["К1"] — через __dsl_index__ dispatch (case-insensitive)
 *   row.К1 — НЕ поддерживается в Phase 1 (falls back к native JS property)
 *
 * Это intentional transitional behavior:
 *   - bracket-access — canonical API
 *   - dot-access — не гарантирует case-insensitivity
 *   - future: __dsl_member_get__/__dsl_member_set__ унифицирует
 */

import { defineDSLType, isDSLValueTableRow } from "./helpers";

export type DSLValueTableRow = {
  __dsl_type__: "ValueTableRow";
  __values__: Record<string, unknown>;
  __owner__: any;  // ссылка на таблицу-владельца
};

/**
 * Создаёт новую строку таблицы значений.
 * @param owner — ссылка на родительскую ValueTable
 */
export function createRow(owner: any): DSLValueTableRow {
  const row = Object.create(null) as DSLValueTableRow;
  defineDSLType(row, "ValueTableRow");
  row.__values__ = Object.create(null);
  row.__owner__ = owner;
  // Строковое представление для Сообщить / Строка()
  Object.defineProperty(row, "toString", {
    value: () => "СтрокаТаблицыЗначений",
    enumerable: false,
    configurable: true,
    writable: true,
  });
  return row;
}

/**
 * Чтение значения из строки по имени колонки (case-insensitive).
 */
export function rowGet(row: any, key: string): unknown {
  if (!isDSLValueTableRow(row)) {
    return row?.[key];
  }
  const lower = String(key).toLowerCase();
  const v = row.__values__[lower];
  return v !== undefined ? v : undefined;
}

/**
 * Запись значения в строку по имени колонки (case-insensitive).
 */
export function rowSet(row: any, key: string, value: unknown): void {
  if (!isDSLValueTableRow(row)) {
    throw new Error("Попытка записи в нестроковый объект");
  }
  const lower = String(key).toLowerCase();
  row.__values__[lower] = value;
}
