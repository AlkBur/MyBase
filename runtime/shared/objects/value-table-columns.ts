/**
 * Колонки ТаблицыЗначений — коллекция ColumnDef.
 *
 * Поддерживает:
 *   Добавить("Имя") — добавляет колонку
 *   Добавить("Имя", Тип) — добавляет колонку с типом (тип игнорируется в Phase 1)
 *   Очистить() — удаляет все колонки
 *   Найти("Имя") — поиск по имени (case-insensitive)
 *   Количество: number — геттер
 *   [index] — доступ по индексу
 *   .ИмяКолонки — доступ по имени через defineProperty
 *
 * Каждая колонка — ColumnDef:
 *   { Имя: string }
 *
 * Для Phase 1 defineProperty на колонках — нормально, т.к. это metadata layer:
 *   - относительно статичен
 *   - мало mutation paths
 *   - rename редкий
 */

import { defineMethod, defineDSLType } from "./helpers";

/**
 * ColumnDef — описание колонки ТаблицыЗначений.
 *
 * Имя — getter/setter. При смене имени:
 *   - обновляет defineProperty на коллекции колонок
 *   - обновляет nameIndex
 *   - переносит данные во всех строках (через owner chain)
 *   - обновляет поля во всех индексах
 */
export type ColumnDef = {
  Имя: string;
};

/**
 * Создаёт коллекцию колонок для таблицы значений.
 */
export function createValueTableColumns(): any {
  const columns: any = Object.create(null);
  const items: ColumnDef[] = [];
  // lowerName → column index для быстрого поиска
  const nameIndex: Record<string, number> = Object.create(null);

  defineDSLType(columns, "ValueTableColumns");

  defineMethod(columns, "Добавить", (name: string, _type?: any) => {
    const lower = String(name).toLowerCase();
    // Проверка дубликатов — в 1С дубликаты имён колонок не допускаются
    if (lower in nameIndex) {
      throw new Error("Колонка с именем '" + name + "' уже существует");
    }
    const col: any = Object.create(null);
    let _colName: string = String(name);
    const idx = items.length;
    items.push(col);
    nameIndex[lower] = idx;

    // Имя колонки — getter/setter с rename-каскадом
    Object.defineProperty(col, "Имя", {
      get: () => _colName,
      set: (newName: string) => {
        const newNameStr = String(newName);
        const oldLower = _colName.toLowerCase();
        const newLower = newNameStr.toLowerCase();
        if (oldLower === newLower) return;

        // 1. Регистрируем новый defineProperty на коллекции
        Object.defineProperty(columns, newNameStr, {
          get: () => col,
          configurable: true,
          enumerable: false,
        });

        // 2. Обновляем nameIndex
        delete nameIndex[oldLower];
        nameIndex[newLower] = idx;

        // 3. Переносим данные во всех существующих строках
        if (columns.__owner__ && columns.__owner__.__rows__) {
          const rows = columns.__owner__.__rows__;
          for (const row of rows) {
            // Перенос из __values__ (bracket-access путь)
            if (oldLower in row.__values__) {
              row.__values__[newLower] = row.__values__[oldLower];
              delete row.__values__[oldLower];
            }
            // Перенос native-свойства (dot-access путь)
            if (Object.prototype.hasOwnProperty.call(row, _colName)) {
              row[newNameStr] = row[_colName];
              delete row[_colName];
            }
          }
        }

        // 4. Обновляем поля во всех индексах
        if (columns.__owner__ && columns.__owner__.Индексы) {
          const indexes = columns.__owner__.Индексы.__items__;
          for (const idxDef of indexes) {
            if (typeof idxDef.__renameField__ === "function") {
              idxDef.__renameField__(_colName, newNameStr);
            }
          }
        }

        _colName = newNameStr;
      },
      configurable: true,
      enumerable: true,
    });

    // Регистронезависимый доступ по имени: .К1
    Object.defineProperty(columns, name, {
      get: () => col,
      configurable: true,
      enumerable: false,
    });

    return col;
  });

  defineMethod(columns, "Очистить", () => {
    // Очищаем поля во всех индексах до удаления колонок
    if (columns.__owner__ && columns.__owner__.Индексы) {
      columns.__owner__.Индексы.__onColumnsCleared__();
    }
    items.length = 0;
    for (const key of Object.keys(nameIndex)) {
      delete nameIndex[key];
    }
    // Удаляем defineProperty (кроме __dsl_type__ и __owner__)
    for (const key of Object.keys(columns)) {
      if (key !== "__dsl_type__" && key !== "__owner__") {
        delete columns[key];
      }
    }
    // Восстанавливаем __items__ (удалён при очистке ключей)
    columns.__items__ = items;
  });

  defineMethod(columns, "Найти", (name: string) => {
    const lower = String(name).toLowerCase();
    const idx = nameIndex[lower];
    return idx !== undefined ? items[idx] : undefined;
  });

  // Количество — метод (вызывается с ())
  defineMethod(columns, "Количество", () => items.length);

  // Доступ по индексу [n] — через хранение в массиве
  // Сохраняем ссылку для __dsl_index__ dispatch
  columns.__items__ = items;

  return columns;
}
