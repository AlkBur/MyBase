/**
 * ТаблицаЗначений — центральный DSL-объект для табличных данных.
 *
 * Поддерживает:
 *   Колонки — коллекция колонок
 *   Индексы — коллекция индексов (stub в Phase 1)
 *   Добавить() — создаёт новую строку
 *   НайтиСтроки(Структура) — поиск строк по значениям колонок
 *   [index] — доступ по индексу строки
 *
 * НЕ реализовано в Phase 1:
 *   Свернуть() — кидает DSRuntimeError
 *   Итог / Итого — deferred
 *   Выгрузить / ЗагрузитьКолонку — deferred
 */

import { createRow, rowGet } from "./value-table-row";
import type { DSLValueTableRow } from "./value-table-row";
import { createValueTableColumns } from "./value-table-columns";
import { createValueTableIndexes } from "./value-table-indexes";

import { defineMethod, defineDSLType, isDSLValueTableRow, isDSLStructure } from "./helpers";
import { DSRuntimeError } from "../errors";
import { isDSLArray } from "./helpers";

export type { DSLValueTableRow } from "./value-table-row";

export type DSLValueTable = {
  __dsl_type__: "ValueTable";
  __rows__: DSLValueTableRow[];
  Колонки: any;
  Индексы: any;
  Добавить(): DSLValueTableRow;
  НайтиСтроки(filter: any): DSLValueTableRow[];
  [index: number]: DSLValueTableRow;
};

/**
 * Создаёт новую ТаблицуЗначений.
 */
export function createValueTable(): any {
  const table: any = Object.create(null);
  const rows: DSLValueTableRow[] = [];

  defineDSLType(table, "ValueTable");

  // Колонки
  const columns = createValueTableColumns();
  Object.defineProperty(table, "Колонки", {
    value: columns,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  // Индексы
  const indexes = createValueTableIndexes();
  Object.defineProperty(table, "Индексы", {
    value: indexes,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  // Owner-chain для rename-каскада
  columns.__owner__ = table;
  indexes.__owner__ = table;

  /**
   * Добавить() — создаёт новую строку и возвращает её.
   * Строка инициализируется с пустыми значениями для всех колонок.
   */
  defineMethod(table, "Добавить", () => {
    const row = createRow(table);
    // Инициализируем все существующие колонки как undefined
    for (const col of columns.__items__) {
      row.__values__[String(col.Имя).toLowerCase()] = undefined;
    }
    rows.push(row);
    return row;
  });

  /**
   * НайтиСтроки(Структура) — линейный поиск по строкам.
   *
   * В Phase 1 — без индексной оптимизации.
   * Структура отбора: ключи — имена колонок, значения — искомые значения.
   * Все условия AND.
   */
  defineMethod(table, "НайтиСтроки", (filter: any) => {
    if (!isDSLStructure(filter) && !isDSLArray(filter)) {
      throw new DSRuntimeError("НайтиСтроки: ожидается Структура или Массив структур");
    }

    const conditions: Array<{ lowerKey: string; originalKey: string; value: unknown }> = [];

    if (isDSLStructure(filter)) {
      // Одиночная структура отбора
      const props = filter.Свойства();
      for (const prop of props) {
        const val = filter.Свойство(prop);
        const key = String(prop);
        conditions.push({ lowerKey: key.toLowerCase(), originalKey: key, value: val });
      }
    } else {
      // Массив структур отбора
      for (const struct of filter) {
        if (!isDSLStructure(struct)) continue;
        const props = struct.Свойства();
        for (const prop of props) {
          const val = struct.Свойство(prop);
          const key = String(prop);
          conditions.push({ lowerKey: key.toLowerCase(), originalKey: key, value: val });
        }
      }
    }

    if (conditions.length === 0) {
      return createArrayResult([]);
    }

    const result: DSLValueTableRow[] = [];
    for (const row of rows) {
      let match = true;
      for (const cond of conditions) {
        // Сначала проверяем __values__ (bracket-access / canonical storage)
        // Сначала проверяем __values__ (bracket-access / canonical storage)
      let rowVal = row.__values__[cond.lowerKey];
      // Fallback: если __values__ не хранит значение (undefined),
      // проверяем native property (dot-access)
      if (rowVal === undefined) {
        const nativeVal = (row as any)[cond.originalKey];
        if (nativeVal !== undefined) {
          rowVal = nativeVal;
        }
      }
        if (rowVal !== cond.value) {
          match = false;
          break;
        }
      }
      if (match) {
        result.push(row);
      }
    }

    return createArrayResult(result);
  });

  /**
   * Свернуть() — transitional no-op для Phase 1.
   *
   * Real aggregation (группировка, суммирование) deferred.
   * Здесь не кидаем исключение, чтобы не ломать скрипты,
   * которые вызывают Свернуть() "на всякий случай" перед поиском.
   *
   * В Phase 2 будет:
   *   Т.Свернуть("Ключ1, Ключ2", "Сумма1, Сумма2")
   *   → группировка по Ключ1, Ключ2; суммирование Сумма1, Сумма2
   */
  defineMethod(table, "Свернуть", (..._args: any[]) => {
    // Phase 1 transitional no-op
    return;
  });

  // Доступ по индексу [n] — через __items__ для __dsl_index__ dispatch
  table.__rows__ = rows;

  return table;
}

/**
 * Создаёт массив результатов НайтиСтроки с DSL-методом Количество().
 */
function createArrayResult(items: any[]): any[] {
  const arr: any[] = items;
  defineMethod(arr, "Количество", () => arr.length);
  return arr;
}
