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

import { OutputEvent } from "./types";
import {
  createArray,
  createStructure,
  createValueTable,
  rowGet,
  rowSet,
  isDSLValueTable,
  isDSLValueTableRow,
  isDSLColumns,
  isDSLIndexes,
  isDSLValueTableRow as isRow,
} from "./objects";

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
  __dsl_newArray__: (size?: number) => any[];
  __dsl_newStructure__: (...args: any[]) => any;
  __dsl_newValueTable__: () => any;
  __dsl_newTypeDescription__: (...types: string[]) => any;
  __dsl_string__: (value: any) => string;
  __dsl_strGetLine__: (str: string, line: number) => string;
  __dsl_index__: (obj: any, index: any) => any;
  __dsl_index_set__: (obj: any, index: any, value: any) => void;
  __dsl_errorInfo__: (context: any) => { Описание: string };
};

/**
 * Создаёт объект со всеми builtin-функциями.
 * @param output — массив для записи сообщений (Сообщить)
 */
/**
 * Детерминированное форматирование чисел для snapshot-стабильности.
 * Использует пробел как разделитель групп разрядов:
 *   1000 → "1 000"
 *   1000000 → "1 000 000"
 *
 * Почему не toLocaleString("ru-RU"):
 *   - ICU-зависимость (разные реализации Bun/Node дают разные символы)
 *   - snapshots становятся flaky
 *   - пробел (U+0020) вместо non-breaking space — детерминированно
 */
function formatDslNumber(n: number): string {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function createBuiltins(output: OutputEvent[]): BuiltinFactories {
  return {
    // ---- Вывод сообщений ----
    __dsl_log__: (...args: any[]) => {
      const toDslString = (a: any): string => {
        if (a === undefined || a === null) return "";
        if (a === true) return "Да";
        if (a === false) return "Нет";
        if (typeof a === "number") return formatDslNumber(a);
        return String(a);
      };
      const msg = args.map(toDslString).join(" ");
      output.push({ type: "message", value: msg });
    },

    // ---- Дата/время ----
    __dsl_currentDate__: () => {
      const d = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");
      return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    },

    // ---- Форматирование ----
    __dsl_format__: (value: any, _format?: string) => String(value),

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
      tmpl.replace(/%(\d+)/g, (_, n) => String(args[Number(n) - 1] ?? "")),

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

    __dsl_newArray__: (size?: number) => createArray(size),

    __dsl_newStructure__: (...args: any[]) => createStructure(...args),

    __dsl_newValueTable__: () => createValueTable(),

    __dsl_newTypeDescription__: (...types: string[]) => {
      // Phase 1: stub — просто сохраняем типы
      const td = Object.create(null);
      Object.defineProperty(td, "__dsl_type__", {
        value: "TypeDescription",
        enumerable: false,
        writable: false,
        configurable: false,
      });
      td.types = types;
      return td;
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
      return lines[line - 1];
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

      // DSLValueTableRow — case-insensitive по __values__ с fallback на native property
      if (isDSLValueTableRow(obj)) {
        const lower = String(index).toLowerCase();
        const v = obj.__values__[lower];
        if (v !== undefined) return v;
        // Fallback: dot-access мог записать значение как native property
        const nativeVal = (obj as any)[String(index)];
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

      // fallback: plain JS access
      obj[index] = value;
    },

    // ---- Информация об ошибке ----
    __dsl_errorInfo__: (context: any) => Object.freeze({
      Описание: context.__lastException__?.message ?? "",
    }),
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
