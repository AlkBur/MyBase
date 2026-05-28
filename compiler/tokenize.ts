// ======================================================================
//  Токенизатор — разбивает 1C-подобный код на токены
//
//  Вход: строка исходного кода .os
//  Выход: массив Token[] с типом, значением, строкой и колонкой
//
//  Что делает:
//    1. Пропускает пробелы и переносы строк (отслеживая line/col)
//    2. Распознаёт комментарии // … до конца строки — игнорирует
//    3. Распознаёт строковые литералы в двойных кавычках:
//       - "" внутри строки → экранированная кавычка (1C-стиль)
//       - перевод строки внутри литерала → ошибка
//       - незакрытая строка до конца файла → ошибка
//    4. Распознаёт числа (только целые)
//    5. Распознаёт двухсимвольные операторы: <>, >=, <=
//    6. Распознаёт односимвольные операторы: =+-*/;(),.<>
//    7. Распознаёт ключевые слова (KEYWORD) и идентификаторы (IDENTIFIER)
//       через список KEYWORDS — всё остальное IDENTIFIER
//    8. Если символ не подходит ни под одну категорию — ошибка "Неизвестный символ"
//
//  Важно: ключевые слова регистрозависимы (должны точно совпадать),
//  имена переменных/функций — регистронезависимы (приводятся к lowercase
//  внутри CaseInsensitiveMap в runtime, а здесь не меняются)
// ======================================================================

/** Множество ключевых слов языка. Все остальные слова — идентификаторы. */
const KEYWORDS = new Set([
  "Процедура", "КонецПроцедуры",
  "Функция", "КонецФункции",
  "Если", "Тогда", "Иначе", "ИначеЕсли", "КонецЕсли",
  "Возврат",
  "И", "ИЛИ", "НЕ",
  "Новый",
  "Для", "По", "Шаг", "Каждого", "Из", "Цикл", "КонецЦикла", "Пока",
  "ВызватьИсключение",
  "Попытка", "Исключение", "КонецПопытки",
]);

export type TokenType = "KEYWORD" | "IDENTIFIER" | "STRING" | "NUMBER" | "OPERATOR" | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;       // текущая позиция в строке
  let line = 1;    // текущая строка (1-indexed)
  let col = 1;     // текущая колонка (1-indexed)

  while (i < source.length) {
    // ---- 1. Пробелы ----
    if (/\s/.test(source.charAt(i))) {
      if (source[i] === "\n") { line++; col = 1; } else { col++; }
      i++;
      continue;
    }

    // ---- 2. Line comment // ----
    if (source[i] === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") i++;
      continue;
    }

    // ---- 3. Строковый литерал "..." ----
    if (source[i] === '"') {
      const startLine = line;
      const startCol = col;
      i++; col++;
      let value = "";
      while (i < source.length) {
        // Экранирование: "" → один символ " (1C-стиль, не JS-стиль)
        if (source[i] === '"' && source[i + 1] === '"') {
          value += '"';
          i += 2;
          col += 2;
          continue;
        }
        // Одиночная закрывающая кавычка — конец строки
        if (source[i] === '"') break;
        // Перевод строки внутри строки: сохраняем \n, опционально удаляем |
    if (source[i] === "\n") {
      value += "\n";
      i++; line++; col = 1;
      while (source[i] === " " || source[i] === "\t") { i++; col++; }
      if (source[i] === "|") { i++; col++; }
      continue;
    }
        value += source[i];
        i++;
        col++;
      }
      // Дошли до конца файла, а кавычку не нашли
      if (i >= source.length) {
        throw new Error(`Незакрытая строка на строке ${startLine}`);
      }
      i++; col++;
      tokens.push({ type: "STRING", value, line: startLine, col: startCol });
      continue;
    }

    // ---- 4. Число (включая десятичные 3.14) ----
    if (/\d/.test(source.charAt(i))) {
      const start = i;
      const startCol = col;
      while (i < source.length && /\d/.test(source.charAt(i))) { i++; col++; }
      // Десятичная часть: если следующий символ . и за ним цифра
      if (source[i] === "." && i + 1 < source.length && /\d/.test(source[i + 1])) {
        i++; col++; // потребляем .
        while (i < source.length && /\d/.test(source.charAt(i))) { i++; col++; }
      }
      tokens.push({ type: "NUMBER", value: source.slice(start, i), line, col: startCol });
      continue;
    }

    // ---- 5. Двухсимвольные операторы (проверяем первыми) ----
    const twoChar = source.slice(i, i + 2);
    if (["<>", ">=", "<="].includes(twoChar)) {
      tokens.push({ type: "OPERATOR", value: twoChar, line, col });
      i += 2; col += 2;
      continue;
    }

    // ---- 6. Односимвольные операторы ----
    if ("=+-*/;(),.<>&[]".includes(source.charAt(i))) {
      tokens.push({ type: "OPERATOR", value: source.charAt(i), line, col });
      i++; col++;
      continue;
    }

    // ---- 7. Слово (буква или _) — ключевое слово или идентификатор ----
    // Юникодные буквы \p{L} позволяют кириллицу и другие алфавиты
    if (/[\p{L}_]/u.test(source.charAt(i))) {
      const start = i;
      const startCol = col;
      while (i < source.length && /[\p{L}\d_]/u.test(source.charAt(i))) { i++; col++; }
      const word = source.slice(start, i);
      tokens.push({
        type: KEYWORDS.has(word) ? "KEYWORD" : "IDENTIFIER",
        value: word,
        line,
        col: startCol,
      });
      continue;
    }

    // ---- 8. Date literal 'YYYYMMDD' ----
    if (source[i] === "'") {
      const startLine = line;
      const startCol = col;
      i++; col++;
      let value = "";
      while (i < source.length && source[i] !== "'") {
        value += source[i]; i++; col++;
      }
      if (i >= source.length) {
        throw new Error(`Незакрытая дата на строке ${startLine}`);
      }
      i++; col++;
      if (!/^\d{8}$/.test(value)) {
        throw new Error(`Неверный формат даты '${value}' на строке ${startLine}`);
      }
      tokens.push({ type: "DATE", value, line: startLine, col: startCol });
      continue;
    }

    // ---- 9. Всё остальное — ошибка ----
    throw new Error(`Неизвестный символ '${source.charAt(i)}' на строке ${line}`);
  }

  // Всегда добавляем терминатор EOF для удобства парсера
  tokens.push({ type: "EOF", value: "", line, col });
  return tokens;
}
