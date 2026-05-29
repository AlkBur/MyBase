/**
 * Строка ТаблицыЗначений — DSLValueTableRow.
 *
 * Хранение: __values__: Record<lowerKey, unknown>
 *   — нижний регистр для case-insensitive семантики
 *
 * Доступ:
 *   row["К1"] — через __dsl_index__ dispatch (case-insensitive)
 *   row.К1 — НЕ поддерживается в Phase 1 (falls back к native JS property)
 *   row.Получить(индекс) — доступ по индексу колонки с bounds check
 *
 * Это intentional transitional behavior:
 *   - bracket-access — canonical API
 *   - dot-access — не гарантирует case-insensitivity
 *   - future: __dsl_member_get__/__dsl_member_set__ унифицирует
 */

import { defineDSLType, defineMethod, isDSLValueTableRow } from "./helpers";
import { DSRuntimeError } from "../errors";

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
  // BSL: String(СтрокаТаблицыЗначений) возвращает "СтрокаТаблицыЗначений",
  // что matches diagnostic output и упрощает отладку.
  // Ранее было принято решение вернуть "" на основе неоднозначного чтения BSL,
  // но при сверке с golden snapshot выяснилось, что BSL-ожидание — именно имя типа.
  Object.defineProperty(row, "toString", {
    value: () => "СтрокаТаблицыЗначений",
    enumerable: false, configurable: true, writable: true,
  });

  /**
   * Получить(индекс) — возвращает значение колонки по индексу.
   * 1С-семантика: 0-based индекс, bounds check.
   */
  defineMethod(row, "Получить", (index: any) => {
    const idx = Number(index);
    const colCount = owner.Колонки?.__items__?.length ?? 0;
    if (isNaN(idx) || idx < 0 || idx >= colCount) {
      throw new DSRuntimeError("Значение индекса выходит за пределы диапазона");
    }
    const colObj = owner.Колонки.__items__[idx];
    if (!colObj) throw new DSRuntimeError("Значение индекса выходит за пределы диапазона");
    const lower = String(colObj.Имя).toLowerCase();
    const v = row.__values__[lower];
    return v !== undefined ? v : undefined;
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
  // TRANSITION(v1.4): remove after member_set migration — native-property sync
  (row as any)[String(key)] = value;
}
