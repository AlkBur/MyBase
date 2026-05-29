/**
 * Runtime contracts — единый слой семантических функций.
 *
 * После extraction (v1.3.3 → v1.4) builtins.ts становится thin facade,
 * а contract.ts — источником истины для coercion, display, type guards.
 *
 * Назначение:
 *   - Централизовать BSL-семантику (не размазывать по builtins.ts, objects/*, compile.ts)
 *   - Дать единый import-путь для type guards примитивов
 *   - Изолировать display-семантику от runtime-семантики
 *
 * Почему grouped objects, не flat exports:
 *   - Сatches naming collisions заранее (display vs runtime coercion)
 *   - Легче мокать в тестах
 *   - Tree-shaking friendly
 *   - Не превращается в 40-функциональный flat-файл через 6 месяцев
 */

// ======================================================================
//  DisplayContract — форматирование для вывода пользователю
// ======================================================================

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

export const DisplayContract = {
  coerceForDisplay,
  formatDslNumber,
};

// ======================================================================
//  TypeContract — type guards для примитивов
//
//  Зачем нужны отдельные функции вместо typeof:
//    - BSL type system не совпадает с JS
//    - Централизованная точка изменения (напр. boxing detection)
//    - Позволяет позже добавить isDSLNumber(NaN) → true и т.д.
//
//  Строгость:
//    - isDSLNumber(NaN) → true  (BSL number domain не делит finite/non-finite)
//    - isDSLString(new String("x")) → false (boxed primitives — JS artifact)
//    - isDSLDate(x) → x instanceof Date
// ======================================================================

/**
 * Проверяет, является ли значение BSL-числом (JS primitive number).
 * NaN → true (BSL number domain включает NaN).
 * Boxed Number → false (не BSL-тип).
 */
function isDSLNumber(v: unknown): v is number {
  return typeof v === "number";
}

/**
 * Проверяет, является ли значение BSL-строкой (JS primitive string).
 * Boxed String → false (JS artifact, не BSL).
 */
function isDSLString(v: unknown): v is string {
  return typeof v === "string";
}

/**
 * Проверяет, является ли значение BSL-булевым (JS primitive boolean).
 */
function isDSLBoolean(v: unknown): v is boolean {
  return typeof v === "boolean";
}

/**
 * Проверяет, является ли значение BSL-датой (JS Date).
 */
function isDSLDate(v: unknown): v is Date {
  return v instanceof Date;
}

export const TypeContract = {
  isDSLNumber,
  isDSLString,
  isDSLBoolean,
  isDSLDate,
};

// ======================================================================
//  CoercionContract — BSL-специфичное приведение типов
//
//  Отличается от DisplayContract:
//    DisplayContract — для вывода пользователю (Сообщить, СтрШаблон)
//    CoercionContract — для runtime-семантики (конкатенация, сравнение)
// ======================================================================

/**
 * 1C-style string coercion для бинарного +.
 * Отличается от coerceForDisplay:
 *   undefined → "Неопределено", а не ""
 *   null → "Null", а не ""
 *   true → "Да", а не "Да" (совпадает)
 *   false → "Нет", а не "Нет" (совпадает)
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

export const CoercionContract = {
  dslCoerceString,
};
