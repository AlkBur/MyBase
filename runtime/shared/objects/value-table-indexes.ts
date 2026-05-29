/**
 * Индексы ТаблицыЗначений — STUB для Phase 1.
 *
 * Реализует API-поверхность индексов без реального индексного движка:
 *   Добавить("К1") / Добавить("К1,К2") — создаёт запись об индексе
 *   Удалить(индекс) — удаляет индекс
 *   Очистить() — очищает все индексы
 *   Количество: number — геттер
 *   [index] — доступ по индексу
 *   [index][fieldIndex] — доступ к имени поля индекса
 *
 * НЕ реализовано в Phase 1:
 *   - B-tree / hash index
 *   - incremental maintenance
 *   - index-based search в НайтиСтроки
 *   - readonly-защита записи (Т.Индексы[0] = x)
 *
 * Настоящие индексы — vNext: mini database engine.
 */

import { defineMethod, defineDSLType } from "./helpers";

/**
 * Описание одного индекса — содержит массив имён полей.
 * Поддерживает строковое представление через Строка().
 */
export type DSLIndexDef = {
  __dsl_type__: "ValueTableIndex";
  __fields__: string[];
  __clearFields__: () => void;
  __renameField__: (oldName: string, newName: string) => void;
  /** 0-based доступ к имени поля */
  [index: number]: string;
  /** Строковое представление: "К1, К2, К3" */
  toString(): string;
};

/**
 * Перестраивает числовые accessor'ы индекса из __fields__.
 * Сначала удаляет все старые числовые ключи, затем создаёт новые.
 */
function rebuildIndexAccessors(index: any): void {
  const fields: string[] = index.__fields__;
  // Удаляем старые числовые accessor'ы
  for (const key of Object.keys(index)) {
    if (/^\d+$/.test(key)) {
      delete index[key];
    }
  }
  // Создаём новые
  for (let i = 0; i < fields.length; i++) {
    Object.defineProperty(index, String(i), {
      get: () => index.__fields__[i]!,
      configurable: true,
      enumerable: false,
    });
  }
}

function createIndexDef(fieldsStr: string, _owner?: any): DSLIndexDef {
  const fields = fieldsStr.split(",").map((f) => f.trim()).filter((f) => f.length > 0);

  const index: any = Object.create(null);
  defineDSLType(index, "ValueTableIndex");
  index.__fields__ = fields;

  rebuildIndexAccessors(index);

  // Переименование поля индекса при rename колонки
  index.__renameField__ = (oldName: string, newName: string) => {
    const flds = index.__fields__ as string[];
    let changed = false;
    for (let i = 0; i < flds.length; i++) {
      if (flds[i]!.toLowerCase() === String(oldName).toLowerCase()) {
        flds[i] = newName;
        changed = true;
      }
    }
    if (changed) {
      rebuildIndexAccessors(index);
    }
  };

  // Очистка полей индекса (при очистке колонок)
  index.__clearFields__ = () => {
    index.__fields__.length = 0;
    rebuildIndexAccessors(index);
  };

  index.toString = () => fields.join(", ");

  // Итерация: Для Каждого Из мИндекс Цикл
  // Перебирает имена полей индекса
  index[Symbol.iterator] = () => fields[Symbol.iterator]();

  return index;
}

/**
 * Создаёт коллекцию индексов для таблицы значений.
 */
export function createValueTableIndexes(): any {
  const indexes: any = Object.create(null);
  const items: DSLIndexDef[] = [];

  defineDSLType(indexes, "ValueTableIndexes");

  // toString для String() / конкатенации (иначе Object.create(null) бросает "No default value" в Bun)
  Object.defineProperty(indexes, "toString", {
    value: () => "Индексы",
    enumerable: false, configurable: true, writable: true,
  });

  defineMethod(indexes, "Добавить", (fields: string) => {
    // Валидация: каждое поле должно существовать как колонка
    if (indexes.__owner__) {
      const columns = indexes.__owner__.Колонки;
      const fieldNames = fields.split(",").map((f) => f.trim()).filter((f) => f.length > 0);
      for (const f of fieldNames) {
        if (!columns.Найти(f)) {
          throw new Error("Колонка '" + f + "' не существует");
        }
      }
    }
    const idx = createIndexDef(fields, indexes.__owner__);
    items.push(idx);
    return idx;
  });

  defineMethod(indexes, "Удалить", (idx: DSLIndexDef) => {
    const pos = items.indexOf(idx);
    if (pos === -1) throw new Error("Индекс не найден в коллекции");
    items.splice(pos, 1);
  });

  defineMethod(indexes, "Очистить", () => {
    items.length = 0;
  });

  // Количество — метод (вызывается с (), как в Массив.Количество())
  defineMethod(indexes, "Количество", () => items.length);

  // Для доступа по индексу через __dsl_index__
  indexes.__items__ = items;

  // Вызывается из Колонки.Очистить() — очищает поля всех индексов
  indexes.__onColumnsCleared__ = () => {
    for (const idx of items) {
      idx.__clearFields__();
    }
  };

  // Итерация: Для Каждого Из Т.Индексы Цикл
  indexes[Symbol.iterator] = () => items[Symbol.iterator]();

  return indexes;
}
