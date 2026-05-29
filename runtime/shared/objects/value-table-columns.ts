/**
 * Колонки ТаблицыЗначений — коллекция ColumnDef.
 *
 * v1.3 — полная реализация методов для valuetable.os.
 *
 * ColumnDef: { Имя, __typeDescription__ }
 *
 * Invariants:
 *   - имя колонки: /^[\p{L}_][\p{L}\p{N}_]*$/u (буквы, цифры, _, не пустое)
 *   - имена уникальны (case-insensitive)
 *   - __typeDescription__ — объект ОписаниеТипов (или undefined)
 */

import { defineMethod, defineDSLType } from "./helpers";

const COLUMN_NAME_RE = /^[\p{L}_][\p{L}\p{N}_]*$/u;

/** Имена методов коллекции Колонки — нельзя использовать как имена колонок */
const RESERVED_COLUMN_METHODS = new Set([
  "добавить", "удалить", "вставить", "очистить", "найти",
]);

export function createValueTableColumns(): any {
  const columns: any = Object.create(null);
  const items: any[] = [];
  const nameIndex: Record<string, number> = Object.create(null);

  defineDSLType(columns, "ValueTableColumns");

  // toString для String() / конкатенации (иначе Object.create(null) бросает "No default value" в Bun)
  Object.defineProperty(columns, "toString", {
    value: () => "Колонки",
    enumerable: false, configurable: true, writable: true,
  });

  /**
   * Добавить(имя, тип?) — добавляет колонку.
   * Валидация имени: буквы, цифры, _, не пустое, не начинается с цифры.
   */
  defineMethod(columns, "Добавить", (name: string, typeDesc?: any) => {
    const nameStr = String(name).trim();
    if (!COLUMN_NAME_RE.test(nameStr)) {
      throw new Error(`Недопустимое имя колонки "${nameStr}"`);
    }
    if (nameStr.length === 0) {
      throw new Error("Имя колонки не может быть пустым");
    }
    const lower = nameStr.toLowerCase();
    if (RESERVED_COLUMN_METHODS.has(lower)) {
      throw new Error(`Имя колонки "${nameStr}" зарезервировано для метода коллекции`);
    }
    if (lower in nameIndex) {
      throw new Error("Колонка с именем '" + nameStr + "' уже существует");
    }

    const col: any = Object.create(null);
    let _colName: string = nameStr;
    const idx = items.length;
    items.push(col);
    nameIndex[lower] = idx;

    // Сохраняем описание типов (если передано)
    if (typeDesc != null && typeDesc.__dsl_type__ === "TypeDescription") {
      Object.defineProperty(col, "__typeDescription__", {
        value: typeDesc, enumerable: false, writable: false, configurable: false,
      });
    }

    // Имя колонки — getter/setter с rename-каскадом
    Object.defineProperty(col, "Имя", {
      get: () => _colName,
      set: (newName: string) => {
        const newNameStr = String(newName).trim();
        if (!COLUMN_NAME_RE.test(newNameStr)) {
          throw new Error(`Недопустимое имя колонки "${newNameStr}"`);
        }
        const oldLower = _colName.toLowerCase();
        const newLower = newNameStr.toLowerCase();
        if (oldLower === newLower) return;

        // Регистрируем новый defineProperty на коллекции
        Object.defineProperty(columns, newNameStr, {
          get: () => col, configurable: true, enumerable: false,
        });

        // Обновляем nameIndex
        delete nameIndex[oldLower];
        nameIndex[newLower] = idx;

        // Переносим данные во всех существующих строках
        if (columns.__owner__ && columns.__owner__.__rows__) {
          const rows = columns.__owner__.__rows__;
          for (const row of rows) {
            if (oldLower in row.__values__) {
              row.__values__[newLower] = row.__values__[oldLower];
              delete row.__values__[oldLower];
            }
            if (Object.prototype.hasOwnProperty.call(row, _colName)) {
              row[newNameStr] = row[_colName];
              delete row[_colName];
            }
          }
        }

        // Обновляем поля во всех индексах
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
      configurable: true, enumerable: true,
    });

    // toString для String() / конкатенации (иначе Object.create(null) бросает "No default value" в Bun)
    // Значение: "КолонкаТаблицыЗначений" — BSL-семантика, объект колонки, а не её имя.
    Object.defineProperty(col, "toString", {
      value: () => "КолонкаТаблицыЗначений",
      enumerable: false, writable: false, configurable: false,
    });

    // Регистронезависимый доступ по имени: .К1
    try {
      Object.defineProperty(columns, nameStr, {
        get: () => col, configurable: true, enumerable: false,
      });
    } catch (e: any) {
      throw new Error(`Cannot define column "${nameStr}" on columns: ${e.message}`);
    }

    return col;
  });

  /**
   * Удалить(цель) — удаляет колонку.
   * цель: ColumnDef (ref), число (индекс), строка (имя).
   */
  defineMethod(columns, "Удалить", (target: any) => {
    let idx: number;

    if (target && typeof target.Имя === "string") {
      // ColumnDef reference
      idx = items.indexOf(target);
      if (idx === -1) throw new Error("Колонка не найдена в коллекции");
    } else if (typeof target === "number") {
      idx = target;
      if (idx < 0 || idx >= items.length) {
        throw new Error("Индекс находится за границами массива");
      }
    } else if (typeof target === "string") {
      const lower = target.toLowerCase();
      const found = nameIndex[lower];
      if (found === undefined) {
        idx = -1;
        // Пытаемся как число-в-строке
        const n = Number(target);
        if (!isNaN(n) && n >= 0 && n < items.length) idx = n;
        else throw new Error("Колонка не найдена");
      } else {
        idx = found;
      }
    } else {
      throw new Error("Неверный тип аргумента для Удалить");
    }

    // Удаляем из nameIndex
    const removedCol = items[idx];
    const removedName = String(removedCol.Имя).toLowerCase();
    delete nameIndex[removedName];

    // Удаляем из массива
    items.splice(idx, 1);

    // Перестраиваем nameIndex для всех последующих колонок
    for (let i = idx; i < items.length; i++) {
      const ci = items[i];
      const ciLower = String(ci.Имя).toLowerCase();
      nameIndex[ciLower] = i;
    }

    // Удаляем defineProperty на коллекции
    delete columns[removedCol.Имя];
  });

  /**
   * Очистить() — удаляет все колонки.
   */
  defineMethod(columns, "Очистить", () => {
    if (columns.__owner__ && columns.__owner__.Индексы) {
      columns.__owner__.Индексы.__onColumnsCleared__();
    }
    items.length = 0;
    for (const key of Object.keys(nameIndex)) {
      delete nameIndex[key];
    }
    for (const key of Object.keys(columns)) {
      if (key !== "__dsl_type__" && key !== "__owner__") {
        delete columns[key];
      }
    }
    columns.__items__ = items;
  });

  /**
   * Найти(имя) — поиск колонки по имени (case-insensitive).
   */
  defineMethod(columns, "Найти", (name: string) => {
    const lower = String(name).toLowerCase();
    const idx = nameIndex[lower];
    return idx !== undefined ? items[idx] : undefined;
  });

  /**
   * Вставить(индекс, имя) — вставляет колонку на позицию.
   */
  defineMethod(columns, "Вставить", (index: any, name: string) => {
    const nameStr = String(name).trim();
    if (!COLUMN_NAME_RE.test(nameStr)) {
      throw new Error(`Недопустимое имя колонки "${nameStr}"`);
    }
    if (RESERVED_COLUMN_METHODS.has(nameStr.toLowerCase())) {
      throw new Error(`Имя колонки "${nameStr}" зарезервировано для метода коллекции`);
    }
    const lower = nameStr.toLowerCase();
    if (lower in nameIndex) {
      throw new Error("Колонка с именем '" + nameStr + "' уже существует");
    }

    let idx = Number(index);
    if (isNaN(idx)) idx = items.length;
    idx = Math.max(0, Math.min(idx, items.length));

    // Создаём колонку
    const col: any = Object.create(null);
    let _colName: string = nameStr;
    items.splice(idx, 0, col);
    // Перестраиваем nameIndex
    for (let i = 0; i < items.length; i++) {
      const ci = items[i];
      const ciLower = String(ci.Имя).toLowerCase();
      nameIndex[ciLower] = i;
    }

    // Настраиваем Имя (как в Добавить)
    Object.defineProperty(col, "Имя", {
      get: () => _colName,
      set: (newName: string) => {
        const newNameStr = String(newName).trim();
        if (!COLUMN_NAME_RE.test(newNameStr)) throw new Error(`Недопустимое имя колонки "${newNameStr}"`);
        const oldLower = _colName.toLowerCase();
        const newLower = newNameStr.toLowerCase();
        if (oldLower === newLower) return;
        Object.defineProperty(columns, newNameStr, { get: () => col, configurable: true, enumerable: false });
        delete nameIndex[oldLower];
        nameIndex[newLower] = idx;
        if (columns.__owner__ && columns.__owner__.__rows__) {
          const rows = columns.__owner__.__rows__;
          for (const row of rows) {
            if (oldLower in row.__values__) { row.__values__[newLower] = row.__values__[oldLower]; delete row.__values__[oldLower]; }
            if (Object.prototype.hasOwnProperty.call(row, _colName)) { row[newNameStr] = row[_colName]; delete row[_colName]; }
          }
        }
        _colName = newNameStr;
      },
      configurable: true, enumerable: true,
    });

    // toString для String() / конкатенации
    Object.defineProperty(col, "toString", {
      value: () => "КолонкаТаблицыЗначений",
      enumerable: false, writable: false, configurable: false,
    });

    Object.defineProperty(columns, nameStr, { get: () => col, configurable: true, enumerable: false });

    return col;
  });

  /**
   * Индекс(колонка) — возвращает позицию колонки (0-based).
   * Аргумент должен быть ColumnDef (объектом колонки).
   * Для неверных типов выбрасывает "Неверный тип аргумента".
   */
  defineMethod(columns, "Индекс", (target: any) => {
    if (!target || typeof target.Имя !== "string") {
      throw new Error("Неверный тип аргумента");
    }
    const idx = items.indexOf(target);
    if (idx === -1) throw new Error("Колонка не найдена");
    return idx;
  }, true);

  // Количество — метод
  defineMethod(columns, "Количество", () => items.length, true);

  // Сумма — undefined (не определяем как геттер)
  // Используется только в тесте как Т.Колонки.Сумма (возвращает undefined)

  // Доступ по индексу [n]
  columns.__items__ = items;

  return columns;
}
