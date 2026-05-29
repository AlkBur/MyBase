/**
 * Builtin-функции DSL — фабрики, единый источник реализаций.
 *
 * После рефакторинга (v1.3) builtins.ts делегирует создание объектов
 * в runtime/shared/objects/*.ts. Это позволяет:
 *   - избежать 3000-строчного файла
 *   - переиспользовать объекты в client runtime
 *   - тестировать объекты независимо от sandbox
 *
 * Как добавить новую builtin:
 *   1. Добавить сигнатуру в BuiltinFactories
 *   2. Добавить реализацию в createBuiltins()
 *   3. Добавить в ALL_BUILTINS (compile.ts)
 *   4. Добавить в BUILTIN_KEYS (runtime.ts)
 *   5. Добавить в serverCapabilities / clientCapabilities
 */

import type { OutputEvent } from "./types";
import {
  createArray,
  createFixedArray,
  createFixedMap,
  createStructure,
  createValueTable,
  createMap,
  createUUID,
  getDSLType,
  rowGet,
  rowSet,
  isDSLValueTable,
  isDSLValueTableRow,
  isDSLColumns,
  isDSLIndexes,
  isDSLValueTableRow as isRow,
  isDSLMap,
  isDSLFixedMap,
  isDSLFixedArray,
  isDSLUUID,
  isDSLType,
} from "./objects";
import { DSRuntimeError } from "./errors";

/** Интерфейс всех builtin-фабрик. Каждый метод — одна builtin-функция. */
export type BuiltinFactories = {
  __dsl_log__: (...args: any[]) => void;
  __dsl_currentDate__: () => string;
  __dsl_format__: (value: any, format?: string) => string;
  __dsl_strStartsWith__: (str: string, sub: string) => boolean;
  __dsl_strEndsWith__: (str: string, sub: string) => boolean;
  __dsl_strSplit__: (str: string, del: string, inc?: boolean) => any[];
  __dsl_strConcat__: (arr: string[], sep?: string) => string;
  __dsl_strCompare__: (a: string, b: string) => number;
  __dsl_strFind__: (haystack: string, needle: string, dir?: string, startPos?: number, occ?: number) => number;
  __dsl_strMid__: (str: string, start: number, length: number) => string;
  __dsl_strTemplate__: (tmpl: string, ...args: any[]) => string;
  __dsl_nstr__: (src: string, lang?: string) => string;
  __dsl_newArray__: (size?: any) => any[];
  __dsl_newFixedArray__: (source?: any) => any;
  __dsl_newStructure__: (...args: any[]) => any;
  __dsl_newValueTable__: () => any;
  __dsl_newTypeDescription__: (...types: string[]) => any;
  __dsl_newMap__: (source?: any) => any;
  __dsl_newFixedMap__: (source?: any) => any;
  __dsl_newUUID__: () => any;
  __dsl_type__: (name: string) => any;
  __dsl_typeOf__: (value: any) => any;
  __dsl_add__: (a: any, b: any) => any;
  __dsl_string__: (value: any) => string;
  __dsl_strGetLine__: (str: string, line: number) => string;
  __dsl_index__: (obj: any, index: any) => any;
  __dsl_index_set__: (obj: any, index: any, value: any) => void;
  __dsl_errorInfo__: (context: any) => { Описание: string };
  __dsl_strIsEmpty__: (str: any) => boolean;
  __dsl_trim__: (str: string) => string;
  __dsl_charCode__: (str: string, pos: number) => number;
  __dsl_number__: (value: any) => number;
  __dsl_currentUniversalDateInMillis__: () => number;
  __dsl_newStringQualifiers__: (length?: number) => any;
};

/**
 * Создаёт объект со всеми builtin-функциями.
 * @param output — массив для записи сообщений (Сообщить)
 */
/**
 * Детерминированное форматирование чисел для snapshot-стабильности.
 * - decimal separator: запятая (`,`)
 * - thousand separator: пробел (U+0020)
 * - группировка по 3 разряда
 * - дробная часть не группируется
 *
 * Почему не toLocaleString("ru-RU"):
 *   - ICU-зависимость (разные реализации Bun/Node дают разные символы)
 *   - snapshots становятся flaky
 *   - пробел (U+0020) вместо non-breaking space — детерминированно
 */
function formatDslNumber(n: number): string {
  // NaN, Infinity — без форматирования
  if (!Number.isFinite(n)) return String(n);
  const parts = String(n).split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return parts.length > 1 ? `${parts[0]},${parts[1]}` : parts[0];
}

/**
 * Единая string coercion для отображения значений в Сообщить, СтрШаблон, Формат.
 * - undefined/null → ""
 * - boolean → "Да"/"Нет"
 * - number → formatDslNumber (decimal comma, thousand separators)
 * - остальное → String(value) (через toString для DSL-объектов)
 *
 * Отличается от dslCoerceString (__dsl_add__), которая сохраняет null/undefined
 * как "Null"/"Неопределено" — семантика конкатенации, а не отображения.
 */
function coerceForDisplay(v: unknown): string {
  if (v === undefined || v === null) return "";
  if (v === true) return "Да";
  if (v === false) return "Нет";
  if (typeof v === "number") return formatDslNumber(v);
  return String(v);
}

/**
 * 1C-style string coercion для бинарного +.
 * Отличается от toDslString (Сообщить):
 *   undefined → "Неопределено", а не ""
 *   null → "Null", а не ""
 *   true → "Истина", а не "Да"
 *   false → "Ложь", а не "Нет"
 *
 * Это семантика BSL выражения "" + x, а не Сообщить(x).
 */
function dslCoerceString(v: unknown): string {
  if (v === undefined) return "Неопределено";
  if (v === null) return "Null";
  if (v === true) return "Да";
  if (v === false) return "Нет";
  // Date → YYYYMMDD (platform-independent, timezone-safe)
  if (v instanceof Date) {
    const y = v.getFullYear();
    const m = String(v.getMonth() + 1).padStart(2, "0");
    const d = String(v.getDate()).padStart(2, "0");
    return `${y}${m}${d}`;
  }
  return String(v);
}

export function createBuiltins(output: OutputEvent[]): BuiltinFactories {
  return {
    // ---- Вывод сообщений ----
    __dsl_log__: (...args: any[]) => {
      const msg = args.map(coerceForDisplay).join(" ");
      output.push({ type: "message", value: msg });
    },

    // ---- Дата/время ----
    __dsl_currentDate__: () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },

    // ---- Форматирование ----
    __dsl_format__: (value: any, formatStr?: string) => {
      // Парсим форматную строку: "ЧГ=" — без группировки разрядов
      if (formatStr != null && formatStr !== "") {
        const parts = formatStr.split(",").map((p) => p.trim()).filter((p) => p.length > 0);
        let grouping = true;
        for (const part of parts) {
          if (part.startsWith("ЧГ=") || part.startsWith("ЧРГ=")) {
            grouping = false;
          }
        }
        if (!grouping) {
          return coerceForDisplay(value);
        }
      }
      return coerceForDisplay(value);
    },

    // ---- Строковые функции ----
    __dsl_strStartsWith__: (str: string, sub: string) => str.startsWith(sub),

    __dsl_strEndsWith__: (str: string, sub: string) => str.endsWith(sub),

    __dsl_strSplit__: (str: string, del: string, inc = true) => {
      const res = inc ? str.split(del) : str.split(del).filter((s) => s !== "");
      (res as any).Количество = () => res.length;
      return res;
    },

    __dsl_strConcat__: (arr: string[], sep?: string) => arr.join(sep ?? ""),

    __dsl_strCompare__: (a: string, b: string) => {
      const ca = a.toLowerCase();
      const cb = b.toLowerCase();
      return ca === cb ? 0 : (ca > cb ? 1 : -1);
    },

    __dsl_strFind__: (haystack: string, needle: string, _dir?: string, startPos = 1, _occ = 1) => {
      const idx = haystack.indexOf(needle, startPos - 1);
      return idx === -1 ? 0 : idx + 1;
    },

    __dsl_strMid__: (str: string, start: number, length: number) => {
      const s = Math.max(0, (start < 1 ? 1 : start) - 1);
      return String(str).substring(s, s + Math.max(0, length));
    },

    __dsl_strTemplate__: (tmpl: string, ...args: any[]) =>
      tmpl.replace(/%(\d+)/g, (_, n) => coerceForDisplay(args[Number(n) - 1])),

    __dsl_nstr__: (src: string, lang?: string) => {
      const parts = src.split(";").reduce((acc: Record<string, string>, p) => {
        const m = p.match(/^\s*(\w+)\s*=\s*(.+)\s*$/);
        if (m) acc[m[1]!.toLowerCase()] = m[2]!;
        return acc;
      }, {});
      const l = (lang ?? "en").toLowerCase();
      return parts[l] ?? parts["en"] ?? Object.values(parts)[0] ?? src;
    },

    // ---- Конструкторы ----

    __dsl_newArray__: (source?: any) => {
      // Copy-constructor из ФиксированныйМассив
      if (isDSLFixedArray(source)) {
        const arr = createArray();
        for (const el of source.__items__) {
          arr.push(el);
        }
        return arr;
      }
      return createArray(source);
    },

    __dsl_newFixedArray__: (source?: any) => createFixedArray(source),

    __dsl_newStructure__: (...args: any[]) => createStructure(...args),

    __dsl_newValueTable__: () => createValueTable(),

    __dsl_newTypeDescription__: (...args: any[]) => {
      // Парсим строку типов: "Строка,Число" → ["Строка", "Число"]
      let types: string[] = [];
      let qualifiers: any = undefined;
      if (args.length > 0 && typeof args[0] === "string") {
        types = args[0].split(",").map((t: string) => t.trim()).filter((t: string) => t.length > 0);
      }
      // Третий аргумент — квалификаторы (если есть)
      if (args.length >= 3 && args[2] != null && args[2].__dsl_type__ === "StringQualifiers") {
        qualifiers = args[2];
      }
      const td = Object.create(null);
      // toString для String() / конкатенации (иначе Object.create(null) бросает "No default value" в Bun)
      Object.defineProperty(td, "toString", {
        value: () => "ОписаниеТипов",
        enumerable: false, configurable: true, writable: true,
      });
      Object.defineProperty(td, "__dsl_type__", {
        value: "TypeDescription",
        enumerable: false,
        writable: false,
        configurable: false,
      });
      td.types = types;
      td.qualifiers = qualifiers;
      return td;
    },

    __dsl_newMap__: (source?: any) => {
      // Copy-constructor из ФиксированноеСоответствие
      if (isDSLFixedMap(source)) {
        const map = createMap();
        for (const [key, value] of source.__items__.entries()) {
          map.__map__.set(key, value);
        }
        return map;
      }
      return createMap();
    },

    __dsl_newFixedMap__: (source?: any) => createFixedMap(source),

    __dsl_newUUID__: () => createUUID(),

    // ---- Тип() ----
    __dsl_type__: (name: string) => getDSLType(name),

    // ---- ТипЗнч() ----
    __dsl_typeOf__: (value: any) => {
      if (value === undefined) return getDSLType("Неопределено");
      if (value === null) return getDSLType("Null");
      if (typeof value === "boolean") return getDSLType("Булево");
      if (typeof value === "number") return getDSLType("Число");
      if (typeof value === "string") return getDSLType("Строка");
      if (isDSLFixedArray(value)) return getDSLType("ФиксированныйМассив");
      if (Array.isArray(value)) return getDSLType("Массив");
      if (isDSLFixedMap(value)) return getDSLType("ФиксированноеСоответствие");
      if (isDSLMap(value)) return getDSLType("Соответствие");
      if (isDSLUUID(value)) return getDSLType("УникальныйИдентификатор");
      if (isDSLType(value)) return getDSLType("Тип");
      if (value instanceof Date) return getDSLType("Дата");
      return getDSLType("Неопределено");
    },

    // ---- __dsl_add__ (бинарный +) ----
    __dsl_add__: (a: any, b: any) => {
      // Числовое сложение
      if (typeof a === "number" && typeof b === "number") {
        return a + b;
      }
      // Конкатенация, если хотя бы один операнд строка
      if (typeof a === "string" || typeof b === "string") {
        return dslCoerceString(a) + dslCoerceString(b);
      }
      // Всё остальное — делегируем JS
      return (a as any) + (b as any);
    },

    // ---- Строка() ----
    __dsl_string__: (value: any) => {
      if (value === undefined || value === null) return "";
      if (value === true) return "Да";
      if (value === false) return "Нет";
      if (typeof value === "object" && typeof value.toString === "function") {
        return value.toString();
      }
      return String(value);
    },

    // ---- СтрПолучитьСтроку / StrGetLine ----
    /**
     * Возвращает строку по номеру (1-индексированный).
     * Нормализует \r\n → \n для совместимости с Windows line endings.
     * При выходе за границы возвращает "" (согласно семантике 1С).
     *
     * Реализация: split по \n, возврат lines[line-1] или "".
     * Альтернатива (indexOf в цикле) — сложнее, без прироста производительности.
     */
    __dsl_strGetLine__: (str: string, line: number) => {
      const normalized = String(str).replace(/\r\n/g, "\n");
      const lines = normalized.split("\n");
      if (line < 1 || line > lines.length) return "";
      return lines[line - 1] ?? "";
    },

    // ---- ПустаяСтрока ----
    __dsl_strIsEmpty__: (str: any) => String(str ?? "") === "",

    // ---- СокрЛП (trim) ----
    __dsl_trim__: (str: string) => String(str).trim(),

    // ---- КодСимвола (char code at 1-based position) ----
    __dsl_charCode__: (str: string, pos: number) => {
      const s = String(str);
      const p = Number(pos);
      if (p < 1 || p > s.length) return 0;
      return s.charCodeAt(p - 1);
    },

    // ---- Число (string→number, throws on NaN) ----
    __dsl_number__: (value: any) => {
      const n = Number(value);
      if (Number.isNaN(n)) {
        throw new DSRuntimeError(
          "Преобразование к типу Число не может быть выполнено"
        );
      }
      return n;
    },

    // ---- ТекущаяУниверсальнаяДатаВМиллисекундах ----
    __dsl_currentUniversalDateInMillis__: () => Date.now(),

    // ---- КвалификаторыСтроки ----
    __dsl_newStringQualifiers__: (length?: number) => {
      const sq = Object.create(null);
      // toString для String() / конкатенации (иначе Object.create(null) бросает "No default value" в Bun)
      Object.defineProperty(sq, "toString", {
        value: () => "КвалификаторыСтроки",
        enumerable: false, configurable: true, writable: true,
      });
      Object.defineProperty(sq, "__dsl_type__", {
        value: "StringQualifiers",
        enumerable: false,
        writable: false,
        configurable: false,
      });
      sq.Длина = length ?? 0;
      return sq;
    },

    // ---- Доступ по индексу ----
    /**
     * Чтение: obj[index]. Dispatch-based — разные типы DSL-объектов
     * обрабатываются по-своему.
     *
     * TODO(v2.0): заменить на централизованный __dsl_member_get__
     * с prototype-chain hardening.
     */
    __dsl_index__: (obj: any, index: any) => {
      if (obj == null) {
        return undefined;
      }

      // DSLValueTableRow — case-insensitive по __values__
      // Если index — число, то это доступ по индексу колонки (а не имени)
      if (isDSLValueTableRow(obj)) {
        if (typeof index === "number") {
          const colCount = obj.__owner__?.Колонки?.__items__?.length ?? 0;
          if (index < 0 || index >= colCount) {
            throw new Error("Значение индекса выходит за пределы диапазона");
          }
          const colObj = obj.__owner__?.Колонки?.__items__?.[index];
          if (!colObj) throw new Error("Значение индекса выходит за пределы диапазона");
          const lower = String(colObj.Имя).toLowerCase();
          const v = obj.__values__[lower];
          return v !== undefined ? v : undefined;
        }
        // Доступ по имени колонки. Проверяем, что колонка существует в таблице-владельце.
        // Если колонка была удалена — в 1С это исключение, а не undefined.
        const colName = String(index);
        const owner = obj.__owner__;
        const col = owner?.Колонки?.Найти(colName);
        if (!col) {
          throw new Error("Колонка не найдена");
        }
        const lower = colName.toLowerCase();
        const v = obj.__values__[lower];
        if (v !== undefined) return v;
        // Fallback: dot-access мог записать значение как native property
        const nativeVal = (obj as any)[colName];
        return nativeVal !== undefined ? nativeVal : undefined;
      }

      // DSLValueTable — доступ по индексу строки
      if (isDSLValueTable(obj)) {
        const idx = Number(index);
        if (idx < 0 || idx >= obj.__rows__.length) {
          throw new Error("Индекс находится за границами массива");
        }
        return obj.__rows__[idx];
      }

      // Columns — доступ к колонке по индексу
      if (isDSLColumns(obj)) {
        const idx = Number(index);
        if (idx < 0 || idx >= obj.__items__.length) {
          throw new Error("Индекс находится за границами массива");
        }
        return obj.__items__[idx];
      }

      // Indexes — доступ к индексу по позиции
      if (isDSLIndexes(obj)) {
        const idx = Number(index);
        if (idx < 0 || idx >= obj.__items__.length) {
          throw new Error("Индекс находится за границами массива");
        }
        return obj.__items__[idx];
      }

      // FixedArray — доступ к элементу по 0-based индексу
      if (isDSLFixedArray(obj)) {
        const idx = Number(index);
        if (idx < 0 || idx >= obj.__items__.length) {
          throw new Error("Индекс находится за границами массива");
        }
        return obj.__items__[idx];
      }

      // FixedMap — чтение по ключу, бросает исключение при отсутствии
      if (isDSLFixedMap(obj)) {
        const normalized = obj.__items__.has(index);
        if (!normalized) {
          throw new DSRuntimeError(
            "Значение, соответствующее ключу, не задано"
          );
        }
        return obj.__items__.get(index);
      }

      // Map — доступ к значению по ключу (identity-based)
      if (isDSLMap(obj)) {
        return obj.__map__.get(index);
      }

      // fallback: plain JS access
      // TODO: prototype-chain traversal currently allowed.
      // Hardened runtime will restrict to own-properties only.
      return obj[index];
    },

    /**
     * Запись: obj[index] = value. Dispatch-based.
     *
     * Для DSL-объектов с readonly семантикой (индексы) выбрасывает ошибку.
     */
    __dsl_index_set__: (obj: any, index: any, value: any) => {
      if (obj == null) {
        throw new Error("Доступ по индексу к неопределённому объекту");
      }

      // Indexes — readonly collection
      if (isDSLIndexes(obj)) {
        throw new Error("Запись по индексу в коллекцию индексов запрещена");
      }

      // DSLValueTableRow — case-insensitive запись
      if (isDSLValueTableRow(obj)) {
        const lower = String(index).toLowerCase();
        obj.__values__[lower] = value;
        // Синхронизируем native property для dot-access консистентности
        (obj as any)[String(index)] = value;
        return;
      }

      // DSLValueTable — запись строки по индексу
      if (isDSLValueTable(obj)) {
        obj.__rows__[index] = value;
        return;
      }

      // Columns — запись колонки по индексу
      if (isDSLColumns(obj)) {
        obj.__items__[index] = value;
        return;
      }

      // FixedMap — read-only, запись запрещена
      if (isDSLFixedMap(obj)) {
        throw new DSRuntimeError(
          "Индексированное значение доступно только для чтения"
        );
      }

      // Map — запись по ключу (identity-based)
      if (isDSLMap(obj)) {
        obj.__map__.set(index, value);
        return;
      }

      // FixedArray — read-only, запись запрещена
      if (isDSLFixedArray(obj)) {
        throw new Error("Индексированное значение доступно только для чтения");
      }

      // fallback: plain JS access
      obj[index] = value;
    },

    // ---- Информация об ошибке ----
    __dsl_errorInfo__: (context: any) => {
      const err = context.__lastException__;
      // Возвращаем err.message (обёрнутое сообщение) как публичный интерфейс.
      // defineMethod оборачивает ошибки в "Ошибка при вызове метода контекста (X)",
      // и это сообщение становится видимым через ИнформацияОбОшибке().Описание.
      // Внутреннее сообщение (__dsl_inner_message__) доступно только для отладки.
      const desc = err?.message ?? "";
      return Object.freeze({ Описание: desc });
    },
  };
}

/** Форматирование output для консольного вывода */
export function formatOutput(output: OutputEvent[]): string[] {
  return output.map((ev) => {
    switch (ev.type) {
      case "message": return `[DSL]: ${ev.value}`;
      case "warning": return `[DSL]: ${ev.value}`;
      case "error": return `[DSL]: ${ev.value}`;
      case "info": return `[DSL]: ${ev.value}`;
      default: return `[DSL]: ${ev.value}`;
    }
  });
}
