/**
 * ТаблицаЗначений — центральный DSL-объект для табличных данных.
 *
 * v1.3 — полная реализация методов для valuetable.os.
 *
 * Инварианты:
 *   - row.__owner__ === table для всех строк
 *   - rows хранятся в __rows__: DSLValueTableRow[]
 *   - column names case-insensitive через __values__[lowerKey]
 *   - Индексы — metadata: поле __fields__ хранит имена колонок.
 *     Кэш индекса (Map<value, Row>) строится лениво внутри Найти()
 *     и сбрасывается при любой мутации таблицы (добавление/удаление
 *     строки, изменение значения). Никакого сложного invalidation engine.
 *
 * Owner-chain:
 *   columns.__owner__ = table
 *   indexes.__owner__ = table
 *   row.__owner__ = table
 */

import { createRow, rowGet, rowSet } from "./value-table-row";
import type { DSLValueTableRow } from "./value-table-row";
import { createValueTableColumns } from "./value-table-columns";
import { createValueTableIndexes } from "./value-table-indexes";

import { defineMethod, defineDSLType, isDSLValueTableRow, isDSLStructure, isDSLArray } from "./helpers";
import { DSRuntimeError } from "../errors";

/**
 * Вспомогательная функция: парсит строку со списком имён колонок.
 * Примеры: "Кол1, Кол2" → ["Кол1", "Кол2"];  "" → []
 */
/**
 * Разбирает строку с именами колонок, разделёнными запятыми,
 * в массив имён (trimmed, non-empty).
 *
 * Использует strtok-семантику для split:
 *   - Пропускает ведущие разделители (leading `,`).
 *   - Не создаёт пустые хвостовые токены (`"a,"` → `["a"]`).
 *   - Пробел ПОСЛЕ запятой — это не разделитель, а часть токена
 *     (`"a, "` → токен `" "` → после trim → `""` → исключение).
 *
 * Это объясняет разницу между `", Тест"` (leading comma skipped)
 * и `"Тест, "` (trailing space creates empty column name → throw).
 *
 * @param str — исходная строка с именами
 * @param emptyAsAll — если true и str пустая/ws-only, возвращает null
 *   (сигнал "все колонки"), а не []
 */
function parseColumnList(str: string, emptyAsAll = false): string[] | null {
  if (str == null || (typeof str === "string" && str.trim() === "")) {
    return emptyAsAll ? null : [];
  }
  if (typeof str !== "string") return [];

  // strtok-style split: ведущие разделители пропускаются,
  // пустые хвостовые токены не создаются.
  const tokens: string[] = [];
  let i = 0;
  while (i < str.length) {
    // Skip leading delimiters
    while (i < str.length && str[i] === ',') i++;
    if (i >= str.length) break;
    // Find end of token
    let end = i;
    while (end < str.length && str[end] !== ',') end++;
    tokens.push(str.slice(i, end));
    i = end;
  }

  // Trim whitespace from each token
  const trimmed = tokens.map((s) => s.trim());

  // Validate: any empty segment after trim → пустое имя колонки → ошибка
  // (это ловится в Свернуть, т.к. column "" не существует)
  for (const s of trimmed) {
    if (s === "") {
      throw new Error(
        "Ошибка при разборе списка колонок: обнаружено пустое имя колонки"
      );
    }
  }

  return trimmed;
}

/**
 * Разбирает target для методов, принимающих колонку:
 * - строка (имя колонки, case-insensitive)
 * - число (индекс колонки)
 * - ColumnDef (объект колонки с полем Имя)
 * Возвращает имя колонки или null если не найдена.
 */
function resolveColumnName(columns: any, target: any): string | null {
  if (typeof target === "string") {
    if (target === "") return null;
    return target;
  }
  if (typeof target === "number") {
    const col = columns.__items__[target];
    return col ? col.Имя : null;
  }
  // ColumnDef reference — проверяем что это наша колонка
  if (target && typeof target.Имя === "string") {
    // Проверяем что колонка принадлежит этой таблице
    const found = columns.Найти(target.Имя);
    return found === target ? target.Имя : null;
  }
  return null;
}

/**
 * Сбрасывает индексные кэши на коллекции индексов.
 * Вызывается при любой мутации таблицы.
 */
function invalidateIndexCaches(indexes: any): void {
  for (const idxDef of indexes.__items__) {
    idxDef.__cache__ = null;
  }
}

/**
 * Создаёт массив с DSL-методом Количество().
 */
function createArrayResult(items: any[]): any[] {
  const arr: any[] = items;
  defineMethod(arr, "Количество", () => arr.length);
  return arr;
}

export function createValueTable(): any {
  const table: any = Object.create(null);
  const rows: DSLValueTableRow[] = [];

  defineDSLType(table, "ValueTable");

  // toString для String() / конкатенации (иначе Object.create(null) бросает "No default value" в Bun)
  Object.defineProperty(table, "toString", {
    value: () => "ТаблицаЗначений",
    enumerable: false, configurable: true, writable: true,
  });

  // Итератор — для Для Каждого … Из Т Цикл
  Object.defineProperty(table, Symbol.iterator, {
    value: function* () { yield* rows; },
    enumerable: false, writable: false, configurable: false,
  });

  // Колонки
  const columns = createValueTableColumns();
  Object.defineProperty(table, "Колонки", {
    value: columns, enumerable: false, writable: false, configurable: false,
  });

  // Индексы
  const indexes = createValueTableIndexes();
  Object.defineProperty(table, "Индексы", {
    value: indexes, enumerable: false, writable: false, configurable: false,
  });

  // Owner-chain
  columns.__owner__ = table;
  indexes.__owner__ = table;

  // ======================================================================
  //  Количество / Добавить / Удалить / Получить / Индекс / Вставить
  // ======================================================================

  defineMethod(table, "Количество", () => rows.length);

  defineMethod(table, "Добавить", () => {
    const row = createRow(table);
    for (const col of columns.__items__) {
      row.__values__[String(col.Имя).toLowerCase()] = undefined;
    }
    rows.push(row);
    invalidateIndexCaches(indexes);
    return row;
  });

  /**
   * Удалить(строка) — удаляет строку по ссылке.
   * Удалить(индекс) — если передан number, удаляет по индексу.
   */
  defineMethod(table, "Удалить", (target: any) => {
    if (isDSLValueTableRow(target)) {
      const idx = rows.indexOf(target);
      if (idx === -1) throw new DSRuntimeError("Строка не принадлежит таблице значений");
      rows.splice(idx, 1);
    } else {
      const idx = Number(target);
      if (isNaN(idx) || idx < 0 || idx >= rows.length) {
        throw new DSRuntimeError("Значение индекса выходит за пределы диапазона");
      }
      rows.splice(idx, 1);
    }
    invalidateIndexCaches(indexes);
  });

  /** Получить(индекс) — возвращает строку по индексу с bounds check. */
  defineMethod(table, "Получить", (index: any) => {
    const idx = Number(index);
    if (isNaN(idx) || idx < 0 || idx >= rows.length) {
      throw new DSRuntimeError("Значение индекса выходит за пределы диапазона");
    }
    return rows[idx];
  });

  /** Индекс(строка) — возвращает позицию строки или throw для не-строки. */
  defineMethod(table, "Индекс", (target: any) => {
    if (!isDSLValueTableRow(target)) {
      throw new DSRuntimeError("Неверный тип аргумента");
    }
    const idx = rows.indexOf(target);
    if (idx === -1) throw new DSRuntimeError("Строка не принадлежит таблице значений");
    return idx;
  });

  /**
   * Вставить(индекс) — вставляет строку на позицию.
   * 1C-семантика: если индекс > rows.length, то append (capped).
   * Не создаёт sparse rows.
   */
  defineMethod(table, "Вставить", (index: any) => {
    const rawIdx = Number(index);
    const cappedIdx = isNaN(rawIdx) ? rows.length : Math.max(0, Math.min(rawIdx, rows.length));
    const row = createRow(table);
    for (const col of columns.__items__) {
      row.__values__[String(col.Имя).toLowerCase()] = undefined;
    }
    rows.splice(cappedIdx, 0, row);
    invalidateIndexCaches(indexes);
    return row;
  });

  /**
   * Сдвинуть(строка|индекс, смещение) — перемещает строку.
   * src: строка, число или строка-число.
   * offset: число или строка-число.
   */
  defineMethod(table, "Сдвинуть", (src: any, offset: any) => {
    // Определяем исходный индекс
    let srcIdx: number;
    if (isDSLValueTableRow(src)) {
      srcIdx = rows.indexOf(src);
      if (srcIdx === -1) throw new DSRuntimeError("Строка не принадлежит таблице значений");
    } else {
      srcIdx = Number(src);
      // coerce + NaN check before ownership/bounds: BSL validation order
      if (isNaN(srcIdx)) {
        throw new DSRuntimeError("Неверный тип аргумента");
      }
      if (srcIdx < 0 || srcIdx >= rows.length) {
        throw new DSRuntimeError("Значение индекса выходит за пределы диапазона");
      }
    }

    const off = Number(offset);
    if (isNaN(off)) throw new DSRuntimeError("Неверный тип аргумента");

    const targetIdx = srcIdx + off;
    if (targetIdx < 0 || targetIdx >= rows.length) {
      throw new DSRuntimeError("Неправильное смещение внутри коллекции");
    }

    // Перемещаем строку
    const row = rows.splice(srcIdx, 1)[0];
    rows.splice(targetIdx, 0, row);
    invalidateIndexCaches(indexes);
  });

  // ======================================================================
  //  ВыгрузитьКолонку / ЗагрузитьКолонку
  // ======================================================================

  /**
   * ВыгрузитьКолонку(цель) — извлекает значения колонки в массив.
   * цель: имя (строка), индекс (число) или ColumnDef.
   */
  defineMethod(table, "ВыгрузитьКолонку", (target: any) => {
    const colName = resolveColumnName(columns, target);
    if (!colName) throw new DSRuntimeError("Колонка не найдена");
    const lower = colName.toLowerCase();
    const result: any[] = [];
    for (const row of rows) {
      const v = row.__values__[lower];
      result.push(v !== undefined ? v : (row as any)[colName]);
    }
    return createArrayResult(result);
  });

  /**
   * ЗагрузитьКолонку(массив, цель) — загружает массив значений в колонку.
   * Если массив длиннее строк — добавляет строки.
   * Если короче — только перезаписывает существующие.
   */
  defineMethod(table, "ЗагрузитьКолонку", (arr: any, target: any) => {
    if (!Array.isArray(arr)) {
      throw new DSRuntimeError("Ожидается массив значений");
    }
    const colName = resolveColumnName(columns, target);
    if (!colName) throw new DSRuntimeError("Колонка не найдена");
    const lower = colName.toLowerCase();

    for (let i = 0; i < arr.length; i++) {
      // Если строк не хватает — добавляем
      if (i >= rows.length) {
        const row = createRow(table);
        for (const col of columns.__items__) {
          row.__values__[String(col.Имя).toLowerCase()] = undefined;
        }
        rows.push(row);
      }
      rows[i].__values__[lower] = arr[i];
      (rows[i] as any)[colName] = arr[i];
    }
    invalidateIndexCaches(indexes);
  });

  // ======================================================================
  //  Итог (type-aware column sum)
  // ======================================================================

  /**
   * Итог(цель) — возвращает сумму значений колонки.
   * Если колонка имеет ОписаниеТипов:
   *   - включает "Дата" → Неопределено
   *   - только "Строка" → парсит каждое значение как число (Number), нечисловые → 0
   *   - "Строка,Число" → суммирует только нативные числа (тип number)
   * Если нет ОписанияТипов → суммирует числа, нечисловые → 0
   */
  defineMethod(table, "Итог", (target: any) => {
    const colName = resolveColumnName(columns, target);
    if (!colName) throw new DSRuntimeError("Колонка не найдена");

    // Получаем описание типов колонки (если есть)
    const colObj = columns.Найти(colName);
    const typeDesc = colObj ? colObj.__typeDescription__ : undefined;

    // Проверяем типы
    const types: string[] = typeDesc?.types ?? [];
    const hasDate = types.some((t: string) => t.toLowerCase() === "дата");
    const hasNumber = types.some((t: string) => t.toLowerCase() === "число");
    const hasString = types.some((t: string) => t.toLowerCase() === "строка");

    // Если тип содержит Дата — возвращаем Неопределено
    if (hasDate) return undefined;

    const lower = colName.toLowerCase();
    let sum = 0;

    for (const row of rows) {
      const v = row.__values__[lower];

      if (hasString && !hasNumber) {
        // Только Строка: пытаемся парсить каждое значение как число
        if (typeof v === "number") {
          sum += v;
        } else if (v != null) {
          const parsed = Number(v);
          if (!Number.isNaN(parsed)) sum += parsed;
        }
      } else if (hasNumber) {
        // Строка+Число или только Число: только нативные числа
        if (typeof v === "number") sum += v;
      } else {
        // Нет описания типов: суммируем числа
        if (typeof v === "number") {
          sum += v;
        } else if (v != null && v !== undefined) {
          const parsed = Number(v);
          if (!Number.isNaN(parsed)) sum += parsed;
        }
      }
    }

    return sum;
  });

  // ======================================================================
  //  Свернуть — real group-by + sum aggregation
  // ======================================================================

  /**
   * Свернуть(группы, суммы) — сворачивает таблицу: group-by + accumulation.
   * группы: строка с именами колонок группировки ("," — разделитель).
   * суммы: строка с именами колонок суммирования.
   *
   * Правила (BSL):
   * - Если группы пустые — все строки сворачиваются в одну.
   * - Если суммы не указаны (undefined) — суммируются все числовые колонки,
   *   не входящие в группировку.
   * - Суммируются только Number.isFinite значения.
   * - После свёртки остаются только колонки группировки + суммирования.
   * - Ключ группировки учитывает тип значения (number != string).
   */
  defineMethod(table, "Свернуть", (groupStr?: any, sumStr?: any) => {
    const groupCols = parseColumnList(String(groupStr ?? ""), true);
    const sumCols = parseColumnList(String(sumStr ?? ""), true);

    // Phase 2.3B: при авто-определении сумм исключаем групповые колонки
    const groupLower = (groupCols ?? []).map((n: string) => n.toLowerCase());
    let sumColNames: string[] | null = sumCols;
    if (sumColNames === null) {
      sumColNames = columns.__items__
        .map((c: any) => c.Имя)
        .filter((name: string) => !groupLower.includes(name.toLowerCase()));
    }
    const sumLower = sumColNames.map((n: string) => n.toLowerCase());

    // ================================================================
    // Случай A: нет группировки — все строки в одну
    // ================================================================
    if (groupCols === null || groupCols.length === 0) {
      const resultRow = createRow(table);

      for (const row of rows) {
        for (const lower of sumLower) {
          const v = row.__values__[lower];
          if (typeof v === "number" && Number.isFinite(v)) {
            const current = resultRow.__values__[lower] as number || 0;
            // Phase 2.3D: rowSet синхронизирует native property
            rowSet(resultRow, lower, current + v);
          }
        }
      }

      rows.length = 0;
      rows.push(resultRow);
      invalidateIndexCaches(indexes);

      // Phase 2.3A: удаляем несуммовые колонки
      for (const col of [...columns.__items__]) {
        if (!sumLower.includes(String(col.Имя).toLowerCase())) {
          columns.Удалить(col);
        }
      }
      return;
    }

    // ================================================================
    // Случай B: есть группировка
    // ================================================================
    const groups = new Map<string, any>();

    for (const row of rows) {
      // Phase 2.3C: type-sensitive ключ (number 12 ≠ string "12")
      const keyParts = groupCols.map((col: string) => {
        const lower = col.toLowerCase();
        const v = row.__values__[lower];
        const t = typeof v;
        const s = v !== undefined && v !== null ? String(v) : "";
        return `${t}\x00${s}`;
      });
      const key = keyParts.join("\x01");

      if (!groups.has(key)) {
        const newRow = createRow(table);
        for (const col of columns.__items__) {
          const colLower = String(col.Имя).toLowerCase();
          if (groupLower.includes(colLower)) {
            // Phase 2.3D: rowSet вместо прямого __values__
            rowSet(newRow, col.Имя, row.__values__[colLower]);
          }
          if (sumLower.includes(colLower)) {
            // Phase 2.3D: rowSet синхронизирует native property
            rowSet(newRow, col.Имя, 0);
          }
        }
        groups.set(key, newRow);
      }

      const targetRow = groups.get(key);
      for (const sumName of sumColNames) {
        const lower = sumName.toLowerCase();
        const v = row.__values__[lower];
        if (typeof v === "number" && Number.isFinite(v)) {
          const current = targetRow.__values__[lower] as number || 0;
          // Phase 2.3D: rowSet синхронизирует native property
          rowSet(targetRow, sumName, (current as number) + v);
        }
      }
    }

    rows.length = 0;
    for (const [, aggRow] of groups) {
      rows.push(aggRow);
    }
    invalidateIndexCaches(indexes);

    // Phase 2.3A: удаляем колонки, не входящие в группы/суммы
    const keepLower = new Set([...groupLower, ...sumLower]);
    for (const col of [...columns.__items__]) {
      if (!keepLower.has(String(col.Имя).toLowerCase())) {
        columns.Удалить(col);
      }
    }
  });

  // ======================================================================
  //  Скопировать — full table copy + overloads
  // ======================================================================

  /**
   * Скопировать() / Скопировать(массив) / Скопировать(структура)
   * Скопировать(массив, колонки) / Скопировать(структура, колонки)
   * Скопировать(, "") — пустой фильтр = все строки, второй аргумент = колонки
   */
  defineMethod(table, "Скопировать", (filterOrRows?: any, colFilterStr?: any) => {
    // Определяем, какие строки копировать
    let sourceRows: DSLValueTableRow[];

    if (filterOrRows === undefined || filterOrRows === null) {
      // Все строки
      sourceRows = [...rows];
    } else if (isDSLStructure(filterOrRows)) {
      // Отбор по структуре — используем НайтиСтроки для получения подходящих строк
      // НайтиСтроки возвращает массив, копируем по ссылкам
      const matched = findRowsByStructure(filterOrRows);
      sourceRows = [...matched];
    } else if (isDSLArray(filterOrRows)) {
      // Массив строк — копируем данные из указанных строк
      // (не проверяем владельца — в 1С можно копировать строки из другой таблицы)
      sourceRows = [...filterOrRows];
    } else if (typeof filterOrRows === "string") {
      // Если передан только colFilterStr (без фильтра строк)
      sourceRows = [...rows];
      colFilterStr = filterOrRows;
    } else {
      sourceRows = [...rows];
    }

    // Определяем колонки для копирования
    let targetCols: any[];
    const colFilter = String(colFilterStr ?? "");
    if (colFilter === "") {
      // Все колонки
      targetCols = columns.__items__;
    } else {
      // Только указанные
      const names = colFilter.split(",").map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      targetCols = [];
      for (const name of names) {
        const col = columns.Найти(name);
        if (col) targetCols.push(col);
      }
    }

    // Создаём новую таблицу
    const newTable = createValueTable();

    // Копируем колонки
    for (const col of targetCols) {
      newTable.Колонки.Добавить(col.Имя, col.__typeDescription__);
    }

    // Копируем строки (shallow values)
    for (const srcRow of sourceRows) {
      const newRow = newTable.Добавить();
      for (const col of newTable.Колонки.__items__) {
        const lower = String(col.Имя).toLowerCase();
        newRow.__values__[lower] = srcRow.__values__[lower];
        (newRow as any)[col.Имя] = srcRow.__values__[lower];
      }
    }

    return newTable;
  });

  /**
   * СкопироватьКолонки() — создаёт новую таблицу с такой же структурой колонок,
   * но без строк.
   */
  defineMethod(table, "СкопироватьКолонки", () => {
    const newTable = createValueTable();
    for (const col of columns.__items__) {
      newTable.Колонки.Добавить(col.Имя, col.__typeDescription__);
    }
    return newTable;
  });

  // ======================================================================
  //  Сортировать
  // ======================================================================

  /**
   * Сортировать(спецификация) — multi-column sort.
   * Формат: "Колонка1 [ВОЗР|УБЫВ], Колонка2 [ВОЗР|УБЫВ], ..."
   *   По умолчанию — ВОЗР (ascending).
   *   Лишние слова после направления → ошибка.
   *   Пробелы до/после запятых и имён игнорируются.
   * Детерминированное сравнение: < / > (не localeCompare).
   */
  defineMethod(table, "Сортировать", (spec: string) => {
    // Парсим спецификацию
    const parts = String(spec).split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    const sortRules: Array<{ colLower: string; desc: boolean }> = [];

    for (const part of parts) {
      const tokens = part.split(/\s+/).filter((s) => s.length > 0);
      if (tokens.length === 0) continue;
      if (tokens.length > 2) {
        throw new DSRuntimeError("Неверный параметр сортировки");
      }

      const colName = tokens[0];
      // Проверяем что колонка существует
      if (!columns.Найти(colName)) {
        throw new DSRuntimeError(`Колонка "${colName}" не найдена`);
      }

      const dir = tokens.length >= 2 ? tokens[1].toUpperCase() : "ВОЗР";
      if (dir !== "ВОЗР" && dir !== "УБЫВ") {
        throw new DSRuntimeError("Неверный параметр сортировки");
      }

      sortRules.push({ colLower: colName.toLowerCase(), desc: dir === "УБЫВ" });
    }

    // Сортируем (стабильная сортировка — Array.sort в ES2019+ стабилен)
    rows.sort((a: any, b: any) => {
      for (const rule of sortRules) {
        const va = a.__values__[rule.colLower];
        const vb = b.__values__[rule.colLower];

        // Null/undefined всегда в начале
        if (va == null && vb == null) continue;
        if (va == null) return rule.desc ? 1 : -1;
        if (vb == null) return rule.desc ? -1 : 1;

        // Числа: числовое сравнение
        if (typeof va === "number" && typeof vb === "number") {
          if (va < vb) return rule.desc ? 1 : -1;
          if (va > vb) return rule.desc ? -1 : 1;
          continue;
        }

        // Булевы: false < true
        if (typeof va === "boolean" && typeof vb === "boolean") {
          if (va === vb) continue;
          if (!va && vb) return rule.desc ? 1 : -1;
          return rule.desc ? -1 : 1;
        }

        // Даты
        if (va instanceof Date && vb instanceof Date) {
          if (va < vb) return rule.desc ? 1 : -1;
          if (va > vb) return rule.desc ? -1 : 1;
          continue;
        }

        // Строки: детерминированное сравнение через < >
        if (typeof va === "string" && typeof vb === "string") {
          if (va < vb) return rule.desc ? 1 : -1;
          if (va > vb) return rule.desc ? -1 : 1;
          continue;
        }

        // Разные типы: сортируем по строковому представлению
        const sa = String(va);
        const sb = String(vb);
        if (sa < sb) return rule.desc ? 1 : -1;
        if (sa > sb) return rule.desc ? -1 : 1;
      }
      return 0;
    });
  });

  // ======================================================================
  //  ЗаполнитьЗначения(значение, колонки)
  // ======================================================================

  /**
   * ЗаполнитьЗначения(значение, колонки) — заполняет указанные колонки
   * значением во всех строках.
   * колонки: пустая строка → все колонки.
   */
  defineMethod(table, "ЗаполнитьЗначения", (value: any, colFilter: string) => {
    const names = parseColumnList(colFilter, true);
    const targetCols = names === null
      ? columns.__items__.map((c: any) => c.Имя)
      : names;

    const lowers: string[] = [];
    for (const name of targetCols) {
      const col = columns.Найти(name);
      if (col) lowers.push(name.toLowerCase());
    }

    for (const row of rows) {
      for (const lower of lowers) {
        row.__values__[lower] = value;
        // Не синхронизируем native property — это transitional bridge
      }
    }
  });

  // ======================================================================
  //  Найти (OR search with optional transient index)
  // ======================================================================

  /**
   * Найти(значение, колонки) — поиск строки по значению.
   * колонки: "" или не указано → все колонки.
   *            "Кол1, Кол2" → OR по указанным колонкам.
   * Возвращает первую подходящую строку или Неопределено.
   *
   * Если для одной из колонок есть индекс metadata, использует
   * transient Map для ускорения (см. transient index strategy).
   */
  defineMethod(table, "Найти", (value: any, colFilter?: any) => {
    const names = parseColumnList(String(colFilter ?? ""), true);
    const searchCols: string[] = [];

    if (names === null) {
      // Все колонки
      for (const col of columns.__items__) {
        searchCols.push(String(col.Имя).toLowerCase());
      }
    } else {
      for (const name of names) {
        const col = columns.Найти(name);
        if (col) searchCols.push(name.toLowerCase());
      }
    }

    if (searchCols.length === 0) return undefined;

    // Пытаемся найти проиндексированную колонку
    for (const lower of searchCols) {
      // Проверяем, есть ли индекс на эту колонку
      for (const idxDef of indexes.__items__) {
        const fields: string[] = idxDef.__fields__;
        if (fields.some((f: string) => f.toLowerCase() === lower)) {
          // Transient index lookup
          if (idxDef.__cache__ === null) {
            // Строим кэш
            const cache = new Map<any, any>();
            for (const row of rows) {
              const v = row.__values__[lower];
              if (!cache.has(v)) {
                cache.set(v, row);
              }
            }
            idxDef.__cache__ = cache;
          }
          const cached = idxDef.__cache__.get(value);
          if (cached !== undefined) return cached;
          // Не найдено в индексе — продолжаем поиск по другим колонкам
        }
      }
    }

    // Linear scan по всем колонкам (OR semantics, первая подходящая)
    for (const row of rows) {
      for (const lower of searchCols) {
        const v = row.__values__[lower];
        // strict equality ===
        if (v === value) return row;
        // Fallback to native property
        if (v === undefined) {
          // Ищем оригинальное имя колонки для native fallback
          for (const col of columns.__items__) {
            if (String(col.Имя).toLowerCase() === lower) {
              if ((row as any)[col.Имя] === value) return row;
              break;
            }
          }
        }
      }
    }

    return undefined;
  });

  // ======================================================================
  //  НайтиСтроки — overridden with column-existence check
  // ======================================================================

  /**
   * НайтиСтроки(Структура) — линейный AND-поиск.
   * Выбрасывает исключение если имя колонки в отборе не существует.
   */
  function findRowsByStructure(filter: any): DSLValueTableRow[] {
    const conditions: Array<{ lowerKey: string; originalKey: string; value: unknown }> = [];

    if (isDSLStructure(filter)) {
      const props = filter.Свойства();
      for (const prop of props) {
        const val = filter.Свойство(prop);
        const key = String(prop);
        // Проверяем существование колонки
        if (!columns.Найти(key)) {
          throw new DSRuntimeError(`Колонка "${key}" не найдена`);
        }
        conditions.push({ lowerKey: key.toLowerCase(), originalKey: key, value: val });
      }
    }

    if (conditions.length === 0) return [];

    const result: DSLValueTableRow[] = [];
    for (const row of rows) {
      let match = true;
      for (const cond of conditions) {
        const rowVal = row.__values__[cond.lowerKey];
        if (rowVal === undefined) {
          const nativeVal = (row as any)[cond.originalKey];
          if (nativeVal !== cond.value) { match = false; break; }
        } else if (rowVal !== cond.value) {
          match = false; break;
        }
      }
      if (match) result.push(row);
    }

    return result;
  }

  defineMethod(table, "НайтиСтроки", (filter: any) => {
    if (!isDSLStructure(filter)) {
      throw new DSRuntimeError("НайтиСтроки: ожидается Структура");
    }
    return createArrayResult(findRowsByStructure(filter));
  });

  // Доступ по индексу [n] — через __rows__ для __dsl_index__ dispatch
  table.__rows__ = rows;

  return table;
}
