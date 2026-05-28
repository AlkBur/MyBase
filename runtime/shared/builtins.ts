// ======================================================================
//  Builtin-функции DSL — фабрики, единый источник реализаций
//
//  Архитектура:
//    BuiltinFactories — интерфейс, описывающий все возможные builtins.
//    createBuiltins(output) — фабрика, возвращающая объект с реализациями.
//    Все builtins захватывают output[] для записи сообщений.
//
//  Как добавить новую builtin:
//    1. Добавить сигнатуру в BuiltinFactories
//    2. Добавить реализацию в createBuiltins()
//    3. Добавить в ALL_BUILTINS в compile.ts
//    4. Добавить в BUILTIN_KEYS в runtime.ts
//    5. Добавить в serverCapabilities / clientCapabilities
//
//  formatOutput() — утилита для красивого вывода в консоль.
// ======================================================================

import { OutputEvent } from "./types";

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
  __dsl_newStructure__: () => Record<string, any>;
  /** Специальная builtin: читает context.__lastException__ и возвращает { Описание } */
  __dsl_index__: (obj: any, index: any) => any;
  /** Запись по индексу: obj[index] = value. Прямой JS-доступ с null-check. */
  __dsl_index_set__: (obj: any, index: any, value: any) => void;
  __dsl_errorInfo__: (context: any) => { Описание: string };
};

// ---- Helper: non-enumerable method ----

function defineMethod(obj: any, name: string, fn: Function): void {
  Object.defineProperty(obj, name, {
    value: fn,
    enumerable: false,
    configurable: false,
    writable: false,
  });
}

/**
 * Создаёт объект со всеми builtin-функциями.
 * @param output — массив для записи сообщений (Сообщить)
 */
export function createBuiltins(output: OutputEvent[]): BuiltinFactories {
  return {
    // ---- Вывод сообщений ----
    __dsl_log__: (...args: any[]) => {
      // 1C-семантика: Истина→"Да", Ложь→"Нет", Неопределено→""
      const toDslString = (a: any): string => {
        if (a === undefined || a === null) return "";
        if (a === true) return "Да";
        if (a === false) return "Нет";
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

    /** Разделение строки. inc=true: сохраняет пустые элементы */
    __dsl_strSplit__: (str: string, del: string, inc = true) => {
      const res = inc ? str.split(del) : str.split(del).filter((s) => s !== "");
      (res as any).Количество = () => res.length;
      return res;
    },

    __dsl_strConcat__: (arr: string[], sep?: string) => arr.join(sep ?? ""),

    /** Регистронезависимое сравнение: -1, 0, 1 */
    __dsl_strCompare__: (a: string, b: string) => {
      const ca = a.toLowerCase();
      const cb = b.toLowerCase();
      return ca === cb ? 0 : (ca > cb ? 1 : -1);
    },

    /** Поиск подстроки. Возвращает 1-based позицию или 0 если не найдено */
    __dsl_strFind__: (haystack: string, needle: string, _dir?: string, startPos = 1, _occ = 1) => {
      const idx = haystack.indexOf(needle, startPos - 1);
      return idx === -1 ? 0 : idx + 1;
    },

    /** Извлечение подстроки (1-based, безопасные границы). В 1C — Сред() */
    __dsl_strMid__: (str: string, start: number, length: number) => {
      const s = Math.max(0, (start < 1 ? 1 : start) - 1);
      return String(str).substring(s, s + Math.max(0, length));
    },

    /** Шаблон строки: %1, %2, … подставляются из аргументов */
    __dsl_strTemplate__: (tmpl: string, ...args: any[]) =>
      tmpl.replace(/%(\d+)/g, (_, n) => String(args[Number(n) - 1] ?? "")),

    /**
     * Многоязычная строка: "en=Hello;ru=Привет"
     * Разбирает формат "en=Hello;ru=Привет" и возвращает значение
     * для запрошенного языка или en по умолчанию.
     */
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
    __dsl_newArray__: (size?: number) => {
      const arr: any[] = [];

      // Поддержка необязательного размера: Новый Массив(5)
      if (size !== undefined) {
        if (typeof size !== "number" || !Number.isInteger(size) || size < 0) {
          throw new Error("Ошибка при вызове конструктора (Массив)");
        }
        arr.length = size;
      }

      defineMethod(arr, "Добавить", (item: any) => { arr.push(item); });
      defineMethod(arr, "Количество", () => arr.length);
      defineMethod(arr, "Вставить", (index: number, item: any) => {
        if (index < 0 || index > arr.length) throw new Error("Индекс находится за границами массива");
        arr.splice(index, 0, item);
      });
      defineMethod(arr, "Удалить", (index: number) => {
        if (index < 0 || index >= arr.length) throw new Error("Индекс находится за границами массива");
        arr.splice(index, 1);
      });
      defineMethod(arr, "Очистить", () => { arr.length = 0; });
      defineMethod(arr, "Найти", (item: any) => {
        const i = arr.indexOf(item);
        return i === -1 ? undefined : i;
      });

      return arr;
    },

    __dsl_newStructure__: () => {
      const s = Object.create(null);
      const data: Record<string, any> = Object.create(null);
      // Сохраняем оригинальные ключи (с регистром) для Свойства()
      const originalKeys: Record<string, string> = Object.create(null);
      // Явный счётчик (не Object.keys) — чище при удалениях
      let count = 0;

      const norm = (k: string) => String(k).toLowerCase();

      Object.defineProperty(s, "__data__", {
        value: data,
        enumerable: false,
        configurable: false,
        writable: false,
      });

      defineMethod(s, "Вставить", (key: string, value: any) => {
        const nk = norm(key);
        if (!(nk in originalKeys)) {
          originalKeys[nk] = key;
          count++;
        }
        data[nk] = value;
      });

      defineMethod(s, "Свойство", (key: string) => data[norm(key)]);

      defineMethod(s, "Удалить", (key: string) => {
        const nk = norm(key);
        if (nk in originalKeys) {
          delete originalKeys[nk];
          delete data[nk];
          count--;
        }
      });

      defineMethod(s, "Количество", () => count);

      defineMethod(s, "Свойства", () => Object.values(originalKeys));

      return s;
    },

    // ---- Доступ по индексу ----
    /** Чтение: obj[index]. Прямой JS-доступ с защитой от null/undefined. */
    __dsl_index__: (obj: any, index: any) => {
      if (obj == null) {
        throw new Error("Доступ по индексу к неопределённому объекту");
      }
      return obj[index];
    },

    /** Запись: obj[index] = value. Прямой JS-доступ с защитой от null/undefined. */
    __dsl_index_set__: (obj: any, index: any, value: any) => {
      if (obj == null) {
        throw new Error("Доступ по индексу к неопределённому объекту");
      }
      obj[index] = value;
    },

    // ---- Информация об ошибке ----
    /**
     * Возвращает замороженный объект с полем Описание.
     * Читает context.__lastException__ (устанавливается в try/catch).
     * Object.freeze() гарантирует неизменяемость — попытка изменить
     * свойство Описание вызовет TypeError (в strict mode).
     */
    __dsl_errorInfo__: (context: any) => Object.freeze({
      Описание: context.__lastException__?.message ?? "",
    }),
  };
}

// ---- Вспомогательные утилиты ----

/** Форматирование output для консольного вывода */
export function formatOutput(output: OutputEvent[]): string[] {
  return output.map((ev) => {
    switch (ev.type) {
      case "message": return `💬 [DSL]: ${ev.value}`;
      case "warning": return `⚠️  [DSL]: ${ev.value}`;
      case "error": return `❌ [DSL]: ${ev.value}`;
      case "info": return `ℹ️  [DSL]: ${ev.value}`;
      default: return `[DSL]: ${ev.value}`;
    }
  });
}
