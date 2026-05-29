// ======================================================================
//  Compiler — двухпроходный транслятор BSL → JS IR
//
//  Архитектура:
//    Класс Compiler инкапсулирует состояние компиляции.
//    Два публичных entry point:
//      1. compileProgram()  — полная программа (statements + definitions)
//      2. compileExpr()     — только выражение (для Вычислить)
//
//  Первый проход (collectFunctions):
//    Собирает имена пользовательских функций/процедур и их арность.
//    Нужен для валидации аргументов и раннего связывания.
//
//  Второй проход (parseStatements / parseExpression):
//    Генерирует JS-код строкой (не AST). Поддерживает:
//    - Присваивание, вызовы функций, цепочки методов
//    - Процедуры/Функции, Возврат
//    - Если/ИначеЕсли/Иначе, Для/Пока, Новый
//    - ВызватьИсключение, Попытка/Исключение/КонецПопытки
//    - Вычислить(), ИнформацияОбОшибке() — с автоподстановкой context
//
//  Как работает генерация:
//    - Переменные:     context.__variables__.get/set("имя")
//    - Функции:        context.__functions__.get/set("имя")
//    - Builtins:       __dsl_* (...)
//    - Конструкторы:   new __dsl_Query__(__dsl_db__) и т.д.
//
//  Безопасность:
//    - Capability-based: компилятор принимает RuntimeCapabilities,
//      проверяет доступность функций/конструкторов для target
//    - Expression mode запрещает statements (для Вычислить)
//    - Разрешённые builtins определяются из capabilities
// ======================================================================

import { tokenize, type Token } from "./tokenize";
import type { RuntimeCapabilities } from "../runtime/shared/types";
import type { DiagnosticsCollector } from "../runtime/shared/diagnostics";

/**
 * AssignTarget — промежуточное представление lvalue для присваивания.
 * Позволяет различать присваивание переменной и индекса без string-hack'ов.
 *
 * variable: простой идентификатор
 * index: доступ по индексу (chain of [n])
 *
  * B.1.2: dot-read lowering → __dsl_member_get__ (в parseMethodChain).
  * TODO(v1.4): bracket-read → member_get, write → member_set.
 */
type AssignTarget =
  | { kind: "variable"; name: string }
  | { kind: "index"; object: AssignTarget; index: string };

// ======================================================================
//  ALL_BUILTINS — реестр всех builtin-функций (русские и английские алиасы)
//  Ключ: имя в DSL, значение: JS-имя функции в sandbox
//  Для добавления новой builtin нужно обновить:
//    1. ALL_BUILTINS — сюда
//    2. BuiltinFactories (runtime/shared/builtins.ts)
//    3. createBuiltins() (runtime/shared/builtins.ts)
//    4. BUILTIN_KEYS (runtime/server/runtime.ts)
//    5. serverCapabilities/ clientCapabilities
// ======================================================================

const ALL_BUILTINS: Record<string, string> = {
  "Сообщить": "__dsl_log__",
  "ТекущаяДата": "__dsl_currentDate__",
  "Формат": "__dsl_format__",
  "СтрНачинаетсяС": "__dsl_strStartsWith__",
  "StrStartsWith": "__dsl_strStartsWith__",
  "СтрЗаканчиваетсяНа": "__dsl_strEndsWith__",
  "StrEndsWith": "__dsl_strEndsWith__",
  "СтрРазделить": "__dsl_strSplit__",
  "StrSplit": "__dsl_strSplit__",
  "СтрСоединить": "__dsl_strConcat__",
  "StrConcat": "__dsl_strConcat__",
  "СтрСравнить": "__dsl_strCompare__",
  "StrCompare": "__dsl_strCompare__",
  "СтрНайти": "__dsl_strFind__",
  "StrFind": "__dsl_strFind__",
  "Найти": "__dsl_strFind__",
  "Сред": "__dsl_strMid__",
  "СтрШаблон": "__dsl_strTemplate__",
  "StrTemplate": "__dsl_strTemplate__",
  "НСтр": "__dsl_nstr__",
  "NStr": "__dsl_nstr__",
  "Вычислить": "__dsl_eval__",
  "ИнформацияОбОшибке": "__dsl_errorInfo__",
  "Выполнить": "__dsl_exec__",
  "Строка": "__dsl_string__",
  "СтрПолучитьСтроку": "__dsl_strGetLine__",
  "StrGetLine": "__dsl_strGetLine__",
  "Тип": "__dsl_type__",
  "ТипЗнч": "__dsl_typeOf__",
  "ПустаяСтрока": "__dsl_strIsEmpty__",
  "СокрЛП": "__dsl_trim__",
  "КодСимвола": "__dsl_charCode__",
  "Число": "__dsl_number__",
  "ТекущаяУниверсальнаяДатаВМиллисекундах": "__dsl_currentUniversalDateInMillis__",
};

// ======================================================================
//  ALL_CONSTRUCTORS — реестр конструкторов для Новый
//  Значение — JS-выражение, которое создаёт объект
//  Специальный __dsl_db__ — экземпляр БД, доступный только в server
// ======================================================================

const ALL_CONSTRUCTORS: Record<string, string> = {
  "запрос": "new __dsl_Query__(__dsl_db__)",
  "массив": "__dsl_newArray__",
  "фиксированныймассив": "__dsl_newFixedArray__",
  "структура": "__dsl_newStructure__",
  "таблицазначений": "__dsl_newValueTable__",
  "описаниетипов": "__dsl_newTypeDescription__",
  "соответствие": "__dsl_newMap__",
  "фиксированноесоответствие": "__dsl_newFixedMap__",
  "уникальныйидентификатор": "__dsl_newUUID__",
  "квалификаторыстроки": "__dsl_newStringQualifiers__",
};

/** Строит карту builtins, разрешённых для данного runtime */
function buildBuiltinMap(caps: RuntimeCapabilities): Record<string, string> {
  const allowed = new Set(caps.functions.map((f) => f.toLowerCase()));
  const result: Record<string, string> = {};
  for (const key of Object.keys(ALL_BUILTINS)) {
    if (allowed.has(key.toLowerCase())) {
      result[key] = ALL_BUILTINS[key]!;
    }
  }
  return result;
}

/** Строит карту конструкторов, разрешённых для данного runtime */
function buildConstructorMap(caps: RuntimeCapabilities): Record<string, string> {
  const allowed = new Set(caps.constructors.map((c) => c.toLowerCase()));
  const result: Record<string, string> = {};
  for (const key of Object.keys(ALL_CONSTRUCTORS)) {
    if (allowed.has(key.toLowerCase())) {
      result[key] = ALL_CONSTRUCTORS[key]!;
    }
  }
  return result;
}

// ======================================================================
//  Приоритеты операторов (чем больше число, тем выше приоритет)
//  Используется в parseExpression() для рекурсивного спуска по precedence
// ======================================================================

// DEBT(v1.5): И/ИЛИ in PRECEDENCE emit raw JS — no __dsl_and__/__dsl_or__ lowering yet
const PRECEDENCE: Record<string, number> = {
  "ИЛИ": 1, "И": 2,
  "=": 3, "<>": 3, ">": 3, "<": 3, ">=": 3, "<=": 3,
  "+": 4, "-": 4, "*": 5, "/": 5, "%": 5,
};

// ======================================================================
//  Compiler — класс состояния компиляции
// ======================================================================

class Compiler {
  private tokens: Token[];
  private pos = 0;
  /** Для каждого JS-выражения хранит номер строки исходного .os-файла */
  private lineMap: number[] = [];
  /** Аккумулятор сгенерированного JS-кода (по строкам) */
  private lines: string[] = [];
  private capabilities: RuntimeCapabilities;

  // ---- карты для быстрого lookup ----
  private BUILTIN_MAP: Record<string, string>;
  private BUILTIN_MAP_LOWER: Record<string, string> = {};
  private CONSTRUCTOR_MAP: Record<string, string>;
  /** Имена пользовательских функций (lowercase → original case) */
  private localFunctionsMap = new Map<string, string>();
  /** Арность пользовательских функций (lowercase → кол-во параметров) */
  // Хранит { total: общее число параметров, mandatory: число обязательных (до первого =) }
  private functionArgInfo = new Map<string, { total: number; mandatory: number }>();
  /** Разрешённые имена builtins (lowercase) */
  private allowedFunctions: Set<string>;
  /** Разрешённые конструкторы (lowercase) */
  private allowedConstructors: Set<string>;
  /** Режим компиляции: program — полный, expression — Вычислить(), fragment — Выполнить() */
  private mode: "program" | "expression" | "fragment" = "program";
  /** Счётчик для генерации уникальных имён переменных в Для Каждого (избегает redeclare) */
  private forEachCounter = 0;
  /** Опциональный сборщик диагностики (compile-time only) */
  private diag?: DiagnosticsCollector;

  /** Токены, запрещённые в fragment-mode (compileFragment) */
  private static FORBIDDEN_IN_FRAGMENT = new Set(["Процедура", "Функция", "Перем", "Возврат"]);

  constructor(code: string, capabilities: RuntimeCapabilities, diag?: DiagnosticsCollector) {
    this.tokens = tokenize(code);
    this.capabilities = capabilities;
    this.diag = diag;
    this.BUILTIN_MAP = buildBuiltinMap(capabilities);
    // Строим lower-копию для быстрого регистронезависимого поиска builtin
    for (const key of Object.keys(this.BUILTIN_MAP)) {
      this.BUILTIN_MAP_LOWER[key.toLowerCase()] = this.BUILTIN_MAP[key]!;
    }
    this.CONSTRUCTOR_MAP = buildConstructorMap(capabilities);
    this.allowedFunctions = new Set(capabilities.functions.map((f) => f.toLowerCase()));
    this.allowedConstructors = new Set(capabilities.constructors.map((c) => c.toLowerCase()));
    // Заполняем localFunctionsMap всеми разрешёнными функциями и конструкторами
    // для корректного связывания builtins как "известных функций"
    for (const name of capabilities.functions) {
      this.localFunctionsMap.set(name.toLowerCase(), name);
    }
  }

  // ====================================================================
  //  Первый проход — сбор имён функций и их арности
  //  Пробегает по токенам, находит Процедура/Функция, извлекает имя и
  //  количество параметров. Сохраняет в localFunctionsMap и functionArgInfo.
  // ====================================================================

  collectFunctions(): void {
    for (let i = 0; i < this.tokens.length; i++) {
      const t = this.tokens[i];
      if (t && t.type === "KEYWORD" && (t.value === "Процедура" || t.value === "Функция")) {
        const next = this.tokens[i + 1];
        if (next && next.type === "IDENTIFIER") {
          const lowerName = next.value.toLowerCase();
          this.localFunctionsMap.set(lowerName, next.value);
          // Ищем открывающую скобку
          let j = i + 2;
          while (j < this.tokens.length && !(this.tokens[j]?.type === "OPERATOR" && this.tokens[j]?.value === "(")) j++;
          if (j < this.tokens.length) {
            j++;
            let total = 0;
            let mandatory = 0;
            // Считаем IDENTIFIERы между скобками (параметры)
            // Пропускаем модификатор Знач (pass-by-value, в нашей модели игнорируется)
            while (j < this.tokens.length && !(this.tokens[j]?.type === "OPERATOR" && this.tokens[j]?.value === ")")) {
              if (this.tokens[j]?.type === "IDENTIFIER" && this.tokens[j]?.value.toLowerCase() !== "знач") {
                total++;
                // Если следующий токен =, то параметр имеет значение по умолчанию
                // (не входит в mandatory)
                const nextTok = this.tokens[j + 1];
                if (nextTok?.type === "OPERATOR" && nextTok.value === "=") {
                  // параметр с default — не обязательный
                } else {
                  mandatory++;
                }
              }
              j++;
            }
            this.functionArgInfo.set(lowerName, { total, mandatory });
          }
        }
      }
    }
  }

  // ====================================================================
  //  Диагностика (compile-time)
  // ====================================================================

  /**
   * Регистрирует compile-time ошибку в DiagnosticsCollector (если есть)
   * и продолжает — не заменяет throw, т.к. компилятор не может
   * осмысленно продолжать после ошибки.
   */
  private diagError(code: string, message: string, line?: number): void {
    this.diag?.error(code, message, line);
  }

  // ====================================================================
  //  Helpers — работа с потоком токенов
  // ====================================================================

  /** Посмотреть текущий токен без потребления */
  private peek(): Token {
    return this.tokens[this.pos] ?? this.tokens[this.tokens.length - 1]!;
  }

  /** Потребить и вернуть текущий токен */
  private consume(): Token {
    return this.tokens[this.pos++] ?? this.tokens[this.tokens.length - 1]!;
  }

  /** Ожидать токен определённого типа и (опционально) значения */
  private expect(type: string, value?: string): Token {
    const t = this.peek();
    if (t.type === "EOF") {
      this.diagError("SYNTAX_ERROR", `Неожиданный конец кода`);
      throw new Error(`Неожиданный конец кода`);
    }
    if (t.type !== type || (value !== undefined && t.value !== value)) {
      this.diagError("SYNTAX_ERROR", `Ожидался "${value || type}", получен "${t.value}"`, t.line);
      throw new Error(`Ожидался "${value || type}", получен "${t.value}" на строке ${t.line}`);
    }
    return this.consume();
  }

  /** Проверить, является ли имя известной пользовательской функцией */
  private isFunction(name: string): boolean {
    return this.localFunctionsMap.has(name.toLowerCase());
  }

  /** Получить оригинальное имя функции (с сохранением регистра) */
  private getOriginalName(name: string): string {
    return this.localFunctionsMap.get(name.toLowerCase()) ?? name;
  }

  /** Валидация вызова builtin-функции — проверка, разрешена ли она для target */
  private validateFunctionCall(name: string, line: number): void {
    const lower = name.toLowerCase();
    // Проверяем по ALL_BUILTINS, а не по allowedFunctions, чтобы отличить
    // builtin (известную систему) от неизвестного имени
    const isBuiltin = Object.keys(ALL_BUILTINS).some((k) => k.toLowerCase() === lower);
    if (isBuiltin && !this.allowedFunctions.has(lower)) {
      this.diagError("FUNCTION_UNAVAILABLE", `Функция "${name}" недоступна для target=${this.capabilities.name}`, line);
      throw new Error(`Функция "${name}" недоступна для target=${this.capabilities.name} (строка ${line})`);
    }
  }

  /**
   * Генерирует вызов функции.
   * Для builtins — прямое имя sandbox-функции.
   * Для пользовательских:
   *   - в program mode: прямой вызов JS-функции
   *   - в expression mode: через context.__functions__.get()
   * Специальные функции (Вычислить, ИнформацияОбОшибке) получают
   * автоматическую подстановку context как последнего аргумента.
   */
  private generateFunctionCall(name: string, line: number): string {
    const isBuiltin = this.BUILTIN_MAP_LOWER[name.toLowerCase()] !== undefined;
    const jsName = isBuiltin ? this.BUILTIN_MAP_LOWER[name.toLowerCase()]! : this.getOriginalName(name);
    this.consume(); // съедаем (
    const args = this.parseFunctionArgs();

    // Валидация числа аргументов по functionArgInfo (только для пользовательских)
    const argInfo = this.functionArgInfo.get(name.toLowerCase());
    if (argInfo) {
      if (args.length > argInfo.total) {
        this.diagError("ARGUMENT_COUNT", `Функция "${name}" ожидает ${argInfo.total} аргументов, передано ${args.length}`, line);
        throw new Error(
          `Функция "${name}" ожидает ${argInfo.total} ` +
          `аргументов, передано ${args.length} (строка ${line})`
        );
      }
      if (args.length < argInfo.mandatory) {
        this.diagError("ARGUMENT_COUNT", `Функция "${name}" ожидает не менее ${argInfo.mandatory} аргументов, передано ${args.length}`, line);
        throw new Error(
          `Функция "${name}" ожидает не менее ${argInfo.mandatory} ` +
          `аргументов, передано ${args.length} (строка ${line})`
        );
      }
    }

    // Для Вычислить, ИнформацияОбОшибке, Выполнить автоматически подставляем context
    if (jsName === "__dsl_eval__" || jsName === "__dsl_errorInfo__" || jsName === "__dsl_exec__") {
      args.push("context");
    }

    // В expression mode не-builtin функции вызываются через контекст
    if (this.mode === "expression" && !isBuiltin && jsName !== "__dsl_eval__" && jsName !== "__dsl_errorInfo__" && jsName !== "__dsl_exec__") {
      return `context.__functions__.get(${JSON.stringify(name)})(${args.join(", ")})`;
    }

    return `${jsName}(${args.join(", ")})`;
  }

  // ====================================================================
  //  Парсинг выражений
  //
  //  Алгоритм: рекурсивный спуск по precedence (Pratt parsing).
  //  parseExpression(minPrec) — основной entry point.
  //  parsePrimary() — парсит атомарные выражения:
  //    - числа, строки, скобки, унарный НЕ, Новый, идентификаторы
  //  Бинарные операторы обрабатываются в цикле while с учётом приоритета.
  //
  //  TODO: присваивание в выражении запрещено на уровне грамматики.
  //  В expression mode генерируется return (...), поэтому присваивание
  //  скомпилируется, но будет багом — нужно явно запретить.
  // ====================================================================

  private parseExpression(minPrec = 0): string {
    let left = this.parsePrimary();
    while (true) {
      const t = this.peek();
      const prec = t.type === "KEYWORD"
        ? (PRECEDENCE[t.value] ?? -1)
        : (t.type === "OPERATOR" ? (PRECEDENCE[t.value] ?? -1) : -1);
      if (prec === -1 || prec < minPrec) break;
      this.consume();
      const op = t.value;
      const right = this.parseExpression(prec + 1);
      // Преобразуем сравнение = в ===, <> в !==
      // DEBT(v1.5): comparison engine still JS-native; needs __dsl_compare__
      if (op === "=") left = `${left} === ${right}`;
      else if (op === "<>") left = `${left} !== ${right}`;
      // Бинарный + идёт через __dsl_add__ для 1C-style string coercion
      else if (op === "+") left = `__dsl_add__(${left}, ${right})`;
      // DEBT(v1.5): arithmetic operators (> < >= <=) still JS-native; needs __dsl_compare__
      // DEBT(v1.5): logical И/ИЛИ emit raw JS И/ИЛИ which is NOT valid JS.
      // Needs __dsl_and__ / __dsl_or__ with short-circuit eval.
      else left = `${left} ${op} ${right}`;
    }
    return left;
  }

  /** Парсит аргументы функции внутри скобок (включая закрывающую скобку) */
  private parseFunctionArgs(): string[] {
    const args: string[] = [];
    if (this.peek().value !== ")") {
      // Пропущенный первый аргумент: (, )
      if (this.peek().type === "OPERATOR" && this.peek().value === ",") {
        args.push("undefined");
      } else {
        args.push(this.parseExpression(0));
      }
      while (this.peek().type === "OPERATOR" && this.peek().value === ",") {
        this.consume();
        // Разрешаем замыкающую запятую: Сообщить(1,) — 1С-совместимость
        if (this.peek().type === "OPERATOR" && this.peek().value === ")") break;
        // Пропущенный аргумент: , , (две запятые подряд) — значение не указано
        if (this.peek().type === "OPERATOR" && (this.peek().value === "," || this.peek().value === ")")) {
          args.push("undefined");
        } else {
          args.push(this.parseExpression(0));
        }
      }
    }
    this.expect("OPERATOR", ")");
    return args;
  }

  /**
   * Парсит цепочку вызовов методов: obj.method1().method2()
   * На входе уже есть начальное выражение (например, чтение переменной).
   * Каждый .property превращается в obj.property.
   * Если после .property идёт ( — значит вызов метода.
   */
  private parseMethodChain(objectExpr: string): string {
    let expr = objectExpr;
    while (this.peek().type === "OPERATOR" && this.peek().value === ".") {
      this.consume();
      const prop = this.expect("IDENTIFIER").value;
      if (this.peek().type === "OPERATOR" && this.peek().value === "(") {
        this.consume();
        const args = this.parseFunctionArgs();
        expr = `${expr}.${prop}(${args.join(", ")})`;
      } else {
        // TRANSITION(v1.4): dot-read → __dsl_member_get__
        // B.1.2: compile dot-read lowering to member_get (not native JS property)
        // Method calls stay as .method(args) — only reads change.
        expr = `__dsl_member_get__(${expr}, ${JSON.stringify(prop)})`;
      }
    }
    return expr;
  }

  /**
   * Парсит цепочку индексов: identifier [expr] [expr] ...
   * Возвращает AssignTarget для объекта, который можно прочитать или записать.
   * Не обрабатывает .property и .method() — они остаются в parseMethodChain.
   */
  private parsePostfix(name: string): AssignTarget {
    let target: AssignTarget = { kind: "variable", name };
    while (this.peek().type === "OPERATOR" && this.peek().value === "[") {
      this.consume();
      const index = this.parseExpression(0);
      this.expect("OPERATOR", "]");
      target = { kind: "index", object: target, index };
    }
    return target;
  }

  /** Генерирует JS-выражение для чтения AssignTarget */
  private emitRead(target: AssignTarget): string {
    if (target.kind === "variable") {
      return `context.__variables__.get(${JSON.stringify(target.name)})`;
    }
    return `__dsl_index__(${this.emitRead(target.object)}, ${target.index})`;
  }

  /** Генерирует JS-выражение для записи AssignTarget */
  private emitWrite(target: AssignTarget, value: string): string {
    if (target.kind === "variable") {
      return `context.__variables__.set(${JSON.stringify(target.name)}, ${value})`;
    }
    const obj = this.emitRead(target.object);
    return `__dsl_index_set__(${obj}, ${target.index}, ${value})`;
  }

  /**
   * Завершает simple statement: ожидает ';' и потребляет его.
   *
   * В DSL ';' обязателен для simple statements.
   * Block statements (Если/Для/Попытка/Процедура) self-delimited
   * через соответствующий Конец* keyword.
   *
   * Исключение: EOF — последний statement в потоке может не иметь ';'.
   * Это необходимо для fragment mode (Выполнить), где код часто
   * передаётся без завершающей точки с запятой.
   *
   * Это упрощает grammar и избегает newline-sensitive parsing.
   */
  // Множество блоковых терминаторов, перед которыми ; может отсутствовать
  private BLOCK_TERMINATORS = new Set([
    "КонецЦикла", "КонецЕсли", "КонецПопытки", "КонецПроцедуры", "КонецФункции",
    "Иначе", "ИначеЕсли", "Исключение",
  ]);

  private expectStatementEnd(): void {
    // EOF — штатное завершение (fragment mode, последний statement)
    if (this.peek().type === "EOF") return;
    // Блоковый терминатор — ; может отсутствовать (1С-стиль)
    if (this.peek().type === "KEYWORD" && this.BLOCK_TERMINATORS.has(this.peek().value)) return;
    this.expect("OPERATOR", ";");
  }

  /**
   * Парсит первичное выражение (атом).
   * Определяет тип токена и возвращает JS-представление.
   */
  private parsePrimary(): string {
    const t = this.peek();
    let expr: string;

    // ---- Число ----
    if (t.type === "NUMBER") { this.consume(); expr = t.value; }
    // ---- Строка (JSON.stringify для экранирования) ----
    else if (t.type === "STRING") { this.consume(); expr = JSON.stringify(t.value); }
    // ---- Скобки ( ... ) ----
    else if (t.type === "OPERATOR" && t.value === "(") {
      this.consume();
      const inner = this.parseExpression(0);
      this.expect("OPERATOR", ")");
      expr = `(${inner})`;
    }
    // ---- Унарный НЕ ----
    // 1С-семантика: НЕ связывает слабее сравнений (a = b), НЕ a = b = НЕ (a = b)
    // Прецедент 2 позволяет consume =/<>/>/</>=/<= (prec 3) и арифметику (prec 4-5),
    // но НЕ consume И/ИЛИ (prec 1).
    else if (t.type === "KEYWORD" && t.value === "НЕ") {
      this.consume();
      expr = `!(${this.parseExpression(2)})`;
    }
    // ---- Унарный минус / плюс: -1, +5 ----
    else if (t.type === "OPERATOR" && (t.value === "-" || t.value === "+")) {
      this.consume();
      expr = `${t.value}(${this.parseExpression(6)})`;
    }
    // ---- Date literal 'YYYYMMDD' / 'YYYY-MM-DD' / 'YYYY-MM-DD HH:MM:SS' ----
    else if (t.type === "DATE") {
      this.consume();
      const s = t.value;
      // Парсим через split по нецифровым разделителям
      const nums = s.split(/[^\d]/).map(Number);
      const y = nums[0] ?? 0;
      const m = nums[1] ?? 1;
      const d = nums[2] ?? 1;
      const h = nums[3] ?? 0;
      const min = nums[4] ?? 0;
      const sec = nums[5] ?? 0;
      expr = `new Date(${y}, ${m - 1}, ${d}, ${h}, ${min}, ${sec})`;
    }
    // ---- Ternary ?(cond, a, b) - function-style ----
    // 1C-синтаксис: ?(Условие, ЗначениеЕслиДа, ЗначениеЕслиНет)
    // Специальная форма: распознаётся ДО generic call-chain, чтобы
    // не конфликтовать с method-chain парсингом.
    else if (t.type === "OPERATOR" && t.value === "?") {
      this.consume();
      this.expect("OPERATOR", "(");
      const condition = this.parseExpression(0);
      this.expect("OPERATOR", ",");
      const thenVal = this.parseExpression(0);
      this.expect("OPERATOR", ",");
      const elseVal = this.parseExpression(0);
      this.expect("OPERATOR", ")");
      expr = `(${condition} ? ${thenVal} : ${elseVal})`;
    }
    // ---- Новый (конструктор) ----
    else if (t.type === "KEYWORD" && t.value === "Новый") {
      this.consume();
      const className = this.expect("IDENTIFIER").value;
      const lowerName = className.toLowerCase();
      const ctor = this.CONSTRUCTOR_MAP[lowerName];

      // Парсим аргументы конструктора, если есть: Новый Массив(5), Новый Массив
      let args: string[] = [];
      let hasParens = false;
      if (this.peek().type === "OPERATOR" && this.peek().value === "(") {
        this.consume();
        args = this.parseFunctionArgs();
        hasParens = true;
      }

      if (ctor) {
        // Запрос — special: конструктор с неявным __dsl_db__, не принимает пользовательские аргументы
        if (lowerName === "запрос") {
          expr = "new __dsl_Query__(__dsl_db__)";
        } else if (hasParens && args.length > 0) {
          expr = `${ctor}(${args.join(", ")})`;
        } else {
          expr = `${ctor}()`;
        }
      }
      else if (ALL_CONSTRUCTORS[lowerName]) {
        this.diagError("CONSTRUCTOR_UNAVAILABLE", `Конструктор "${className}" недоступен для target=${this.capabilities.name}`, t.line);
        throw new Error(`Конструктор "${className}" недоступен для target=${this.capabilities.name} (строка ${t.line})`);
      } else {
        this.diagError("UNKNOWN_CONSTRUCTOR", `Неизвестный класс "${className}"`, t.line);
        throw new Error(`Неизвестный класс "${className}" на строке ${t.line}`);
      }
    }
    // ---- Идентификатор (имя переменной, функции) ----
    else if (t.type === "IDENTIFIER") {
      this.consume();
      const name = t.value;

      // Language literals — всегда true/false/null/undefined независимо от контекста
      if (name === "Истина") { expr = "true"; }
      else if (name === "Ложь") { expr = "false"; }
      else if (name === "Null") { expr = "null"; }
      else if (name === "Неопределено") { expr = "undefined"; }
      else {
        // Парсим постфиксную цепочку [index] и другие
        const target = this.parsePostfix(name);

        if (this.peek().type === "OPERATOR" && this.peek().value === "(") {
          // Функция: имя(аргументы) — только для plain variable
          if (!this.isFunction(name)) {
            if (this.mode === "expression") {
              this.consume();
              const args = this.parseFunctionArgs();
              expr = `context.__functions__.get(${JSON.stringify(name)})(${args.join(", ")})`;
            } else {
              this.validateFunctionCall(name, t.line);
              this.diagError("UNKNOWN_FUNCTION", `Функция "${name}" не определена`, t.line);
              throw new Error(`Функция "${name}" не определена на строке ${t.line}`);
            }
          } else {
            expr = this.generateFunctionCall(name, t.line);
          }
        } else if (this.peek().type === "OPERATOR" && this.peek().value === ".") {
          // Цепочка методов: переменная[0].метод()
          expr = this.parseMethodChain(this.emitRead(target));
        } else {
          // Простое чтение переменной/индекса
          expr = this.emitRead(target);
        }
      }
    } else {
      this.diagError("SYNTAX_ERROR", `Неожиданный токен "${t.value}"`, t.line);
      throw new Error(`Неожиданный токен "${t.value}" на строке ${t.line}`);
    }

    // После любого primary-выражения может идти комбинация:
    //   .метод/.свойство и [index] в любом порядке
    // Например: Функция()[0].Свойство, Новый Массив()[0].Метод()
    while (true) {
      if (this.peek().type === "OPERATOR" && this.peek().value === ".") {
        expr = this.parseMethodChain(expr);
      } else if (this.peek().type === "OPERATOR" && this.peek().value === "[") {
        this.consume();
        const index = this.parseExpression(0);
        this.expect("OPERATOR", "]");
        expr = `__dsl_index__(${expr}, ${index})`;
      } else {
        break;
      }
    }

    return expr;
  }

  // ====================================================================
  //  Парсинг statements (программный режим)
  //
  //  parseStatements(terminators) — основной цикл.
  //  Читает токены, пока не встретит один из terminators или EOF.
  //  Каждый токен идентифицируется как начало конструкции и
  //  генерируется соответствующий JS-код.
  //
  //  parseStatementsCapture(terminators) — обёртка, которая перехватывает
  //  сгенерированные строки во временный массив и возвращает их.
  //  Нужен для вложенных блоков (Если, Для, Попытка).
  // ====================================================================

  /** Добавить JS-строку в выходной буфер, запомнив номер строки .os */
  private emit(text: string, osLine: number): void {
    this.lines.push(text);
    this.lineMap.push(osLine);
  }

  /** Парсит statements в текущем буфере lines */
  private parseStatements(terminators: Set<string>): void {
    while (!terminators.has(this.peek().value) && this.peek().type !== "EOF") {
      // Пропускаем пустые statement-разделители (;). Multiple ;; не ошибка.
      while (this.peek().type === "OPERATOR" && this.peek().value === ";") { this.consume(); }
      // После потребления пустых statements проверяем терминатор —
      // если после ;; сразу идёт КонецЕсли/КонецЦикла, выходим
      if (terminators.has(this.peek().value) || this.peek().type === "EOF") continue;
      // Пропускаем директивы &НаКлиенте, &НаСервере и т.д.
      // Пока игнорируются. В будущем — для capability routing / runtime partitioning.
      if (this.peek().type === "OPERATOR" && this.peek().value === "&") {
        this.consume();
        this.expect("IDENTIFIER");
        continue;
      }
      const t = this.peek();

      // ================================================================
      //  Процедура … КонецПроцедуры
      // ================================================================
      if (t.type === "KEYWORD" && t.value === "Процедура") {
        this.consume();
        const name = this.expect("IDENTIFIER").value;
        this.expect("OPERATOR", "(");
        const params: string[] = [];
        // Парсим параметры с опциональным модификатором Знач и значением по умолчанию
        if (this.peek().type === "IDENTIFIER") {
          // Пропускаем Знач
          if (this.peek().value.toLowerCase() === "знач") this.consume();
          let paramName = this.consume().value;
          // Параметр со значением по умолчанию
          if (this.peek().type === "OPERATOR" && this.peek().value === "=") {
            this.consume();
            paramName += " = " + this.parseExpression(0);
          }
          params.push(paramName);
          while (this.peek().type === "OPERATOR" && this.peek().value === ",") {
            this.consume();
            // Пропускаем Знач
            if (this.peek().type === "IDENTIFIER" && this.peek().value.toLowerCase() === "знач") this.consume();
            let nextParam = this.expect("IDENTIFIER").value;
            // Параметр со значением по умолчанию
            if (this.peek().type === "OPERATOR" && this.peek().value === "=") {
              this.consume();
              nextParam += " = " + this.parseExpression(0);
            }
            params.push(nextParam);
          }
        }
        this.expect("OPERATOR", ")");

        // Потребляем опциональный модификатор Экспорт
        if (this.peek().type === "IDENTIFIER" && this.peek().value === "Экспорт") {
          this.consume();
        }

        // Переключаемся на временный буфер для тела процедуры
        const bodyLines: string[] = [];
        const bodyLineMap: number[] = [];
        const savedLines = this.lines;
        const savedMap = this.lineMap;
        this.lines = bodyLines;
        this.lineMap = bodyLineMap;
        this.parseStatements(new Set(["КонецПроцедуры"]));
        this.lines = savedLines;
        this.lineMap = savedMap;
        this.expect("KEYWORD", "КонецПроцедуры");

        // Генерируем: function имя(параметры) { ... }
        this.emit(`function ${name}(${params.join(", ")}) {`, t.line);
        // Сохраняем параметры в контекст (чтобы были доступны как переменные)
        for (const p of params) {
          const paramName = p.split(" = ")[0];
          this.emit(`  context.__variables__.set(${JSON.stringify(paramName)}, ${paramName});`, t.line);
        }
        for (const l of bodyLines) this.lines.push(l);
        this.emit("}", t.line);
        // Регистрируем функцию в контексте по имени
        this.emit(`context.__functions__.set(${JSON.stringify(name)}, ${name});`, t.line);
        continue;
      }

      // ================================================================
      //  Функция … КонецФункции (аналог Процедуры, но с возвратом значения)
      // ================================================================
      if (t.type === "KEYWORD" && t.value === "Функция") {
        this.consume();
        const name = this.expect("IDENTIFIER").value;
        this.expect("OPERATOR", "(");
        const params: string[] = [];
        // Парсим параметры с опциональным модификатором Знач и значением по умолчанию
        if (this.peek().type === "IDENTIFIER") {
          // Пропускаем Знач
          if (this.peek().value.toLowerCase() === "знач") this.consume();
          let paramName = this.consume().value;
          // Параметр со значением по умолчанию
          if (this.peek().type === "OPERATOR" && this.peek().value === "=") {
            this.consume();
            paramName += " = " + this.parseExpression(0);
          }
          params.push(paramName);
          while (this.peek().type === "OPERATOR" && this.peek().value === ",") {
            this.consume();
            // Пропускаем Знач
            if (this.peek().type === "IDENTIFIER" && this.peek().value.toLowerCase() === "знач") this.consume();
            let nextParam = this.expect("IDENTIFIER").value;
            // Параметр со значением по умолчанию
            if (this.peek().type === "OPERATOR" && this.peek().value === "=") {
              this.consume();
              nextParam += " = " + this.parseExpression(0);
            }
            params.push(nextParam);
          }
        }
        this.expect("OPERATOR", ")");

        // Потребляем опциональный модификатор Экспорт
        if (this.peek().type === "IDENTIFIER" && this.peek().value === "Экспорт") {
          this.consume();
        }

        const bodyLines: string[] = [];
        const bodyLineMap: number[] = [];
        const savedLines = this.lines;
        const savedMap = this.lineMap;
        this.lines = bodyLines;
        this.lineMap = bodyLineMap;
        this.parseStatements(new Set(["КонецФункции"]));
        this.lines = savedLines;
        this.lineMap = savedMap;
        this.expect("KEYWORD", "КонецФункции");

        this.emit(`function ${name}(${params.join(", ")}) {`, t.line);
        for (const p of params) {
          const paramName = p.split(" = ")[0];
          this.emit(`  context.__variables__.set(${JSON.stringify(paramName)}, ${paramName});`, t.line);
        }
        for (const l of bodyLines) this.lines.push(l);
        this.emit("}", t.line);
        this.emit(`context.__functions__.set(${JSON.stringify(name)}, ${name});`, t.line);
        continue;
      }

      // ================================================================
      //  Если … Тогда … ИначеЕсли … Иначе … КонецЕсли
      // ================================================================
      if (t.type === "KEYWORD" && t.value === "Если") {
        this.consume();
        const condition = this.parseExpression(0);
        this.expect("KEYWORD", "Тогда");
        // Собираем тело if во временный массив
        const ifBody = this.parseStatementsCapture(new Set(["Иначе", "ИначеЕсли", "КонецЕсли"]));
        this.emit(`if (${condition}) {`, t.line);
        for (const l of ifBody) this.lines.push(l);
        this.emit("}", t.line);

        // Обрабатываем цепочку ИначеЕсли...Иначе
        while (this.peek().value === "ИначеЕсли" || this.peek().value === "Иначе") {
          const kw = this.consume().value;
          if (kw === "ИначеЕсли") {
            const elseifCond = this.parseExpression(0);
            this.expect("KEYWORD", "Тогда");
            const elseifBody = this.parseStatementsCapture(new Set(["Иначе", "ИначеЕсли", "КонецЕсли"]));
            this.emit(`else if (${elseifCond}) {`, t.line);
            for (const l of elseifBody) this.lines.push(l);
            this.emit("}", t.line);
          } else {
            const elseBody = this.parseStatementsCapture(new Set(["КонецЕсли"]));
            this.emit("else {", t.line);
            for (const l of elseBody) this.lines.push(l);
            this.emit("}", t.line);
          }
        }
        this.expect("KEYWORD", "КонецЕсли");
        continue;
      }

      // ================================================================
      //  Пока … Цикл … КонецЦикла
      // ================================================================
      if (t.type === "KEYWORD" && t.value === "Пока") {
        this.consume();
        const condition = this.parseExpression(0);
        this.expect("KEYWORD", "Цикл");
        const body = this.parseStatementsCapture(new Set(["КонецЦикла"]));
        this.expect("KEYWORD", "КонецЦикла");
        this.emit(`while (${condition}) {`, t.line);
        for (const l of body) this.lines.push(l);
        this.emit("}", t.line);
        continue;
      }

      // ================================================================
      //  Для — два варианта:
      //    1. Для IDENTIFIER = … По … [Шаг …] Цикл … КонецЦикла
      //       → set(var, start); while (get(var) <= end) { ... set(var, get(var) + step); }
      //    2. Для Каждого IDENTIFIER Из expr Цикл … КонецЦикла
      //       → for (const __item__ of iterable) { set(var, __item__); ... } с scope cleanup
      // ================================================================
      if (t.type === "KEYWORD" && t.value === "Для") {
        this.consume();

        // ---- Для Каждого ----
        if (this.peek().type === "KEYWORD" && this.peek().value === "Каждого") {
          this.consume();
          const varName = this.expect("IDENTIFIER").value;
          this.expect("KEYWORD", "Из");
          const expr = this.parseExpression(0);
          this.expect("KEYWORD", "Цикл");
          const body = this.parseStatementsCapture(new Set(["КонецЦикла"]));
          this.expect("KEYWORD", "КонецЦикла");

          this.forEachCounter++;
          const it = `__iterable__${this.forEachCounter}`;
          const item = `__item__${this.forEachCounter}`;
          const prev = `__prev__${this.forEachCounter}`;
          // iterable validation
          this.emit(`const ${it} = ${expr};`, t.line);
          this.emit(`if (!${it} || typeof ${it}[Symbol.iterator] !== 'function') {`, t.line);
          this.emit(`  throw new Error("Значение не поддерживает итерацию (строка " + ${t.line} + ")");`, t.line);
          this.emit("}", t.line);
          // scope cleanup для loop variable
          this.emit(`const ${prev} = context.__variables__.get(${JSON.stringify(varName)});`, t.line);
          this.emit("try {", t.line);
          this.emit(`  for (const ${item} of ${it}) {`, t.line);
          this.emit(`    context.__variables__.set(${JSON.stringify(varName)}, ${item});`, t.line);
          for (const l of body) this.lines.push(l);
          this.emit("  }", t.line);
          this.emit("} finally {", t.line);
          this.emit(`  if (${prev} === undefined) {`, t.line);
          this.emit(`    context.__variables__.delete(${JSON.stringify(varName)});`, t.line);
          this.emit("  } else {", t.line);
          this.emit(`    context.__variables__.set(${JSON.stringify(varName)}, ${prev});`, t.line);
          this.emit("  }", t.line);
          this.emit("}", t.line);
          continue;
        }

        // ---- Для i = … По … [Шаг …] ----
        const varName = this.expect("IDENTIFIER").value;
        this.expect("OPERATOR", "=");
        const startVal = this.parseExpression(0);
        this.expect("KEYWORD", "По");
        const endVal = this.parseExpression(0);
        let stepVal = "1";
        if (this.peek().type === "KEYWORD" && this.peek().value === "Шаг") {
          this.consume();
          stepVal = this.parseExpression(0);
        }
        this.expect("KEYWORD", "Цикл");
        const body = this.parseStatementsCapture(new Set(["КонецЦикла"]));
        this.expect("KEYWORD", "КонецЦикла");
        this.emit(`context.__variables__.set(${JSON.stringify(varName)}, ${startVal});`, t.line);
        this.emit(`while (context.__variables__.get(${JSON.stringify(varName)}) <= ${endVal}) {`, t.line);
        for (const l of body) this.lines.push(l);
        this.emit(`  context.__variables__.set(${JSON.stringify(varName)}, context.__variables__.get(${JSON.stringify(varName)}) + ${stepVal});`, t.line);
        this.emit("}", t.line);
        continue;
      }

      // ================================================================
      //  Возврат [<выражение>]
      //  С выражением: return <expr>;
      //  Без выражения: return;
      // ================================================================
      if (t.type === "KEYWORD" && t.value === "Возврат") {
        this.consume();
        if (this.peek().type === "OPERATOR" && this.peek().value === ";") {
        this.emit("return;", t.line);
        } else {
        const expr = this.parseExpression(0);
        this.emit(`return ${expr};`, t.line);
        }
        this.expectStatementEnd();
        continue;
      }

      // ================================================================
      //  ВызватьИсключение <выражение>
      //  Генерирует throw new __dsl_RuntimeError__(expr, line)
      // ================================================================
      if (t.type === "KEYWORD" && t.value === "ВызватьИсключение") {
        this.consume();
        // Без аргумента — ре-брос текущего исключения (1С-семантика)
        if (this.peek().type === "EOF" || this.peek().value === ";") {
          this.emit(`throw context.__lastException__;`, t.line);
          this.expectStatementEnd();
          continue;
        }
        const expr = this.parseExpression(0);
        this.emit(`throw new __dsl_RuntimeError__(${expr}, ${t.line});`, t.line);
        this.expectStatementEnd();
        continue;
      }

      // ================================================================
      //  Попытка … Исключение … КонецПопытки
      //  Транспилируется в:
      //    context.__lastException__ = null;
      //    try { ... } catch(__dsl_err__) {
      //      context.__lastException__ = __dsl_err__;
      //      ...
      //    }
      //  Блок Исключение опционален (catch без тела)
      // ================================================================
      if (t.type === "KEYWORD" && t.value === "Попытка") {
        this.consume();
        const tryBody = this.parseStatementsCapture(new Set(["Исключение", "КонецПопытки"]));
        let catchBody: string[] = [];
        if (this.peek().value === "Исключение") {
          this.consume();
          catchBody = this.parseStatementsCapture(new Set(["КонецПопытки"]));
        }
        this.expect("KEYWORD", "КонецПопытки");
        this.emit("context.__lastException__ = null;", t.line);
        this.emit("try {", t.line);
        for (const l of tryBody) this.lines.push(l);
        this.emit("} catch (__dsl_err__) {", t.line);
        this.emit("  context.__lastException__ = __dsl_err__;", t.line);
        for (const l of catchBody) this.lines.push(l);
        this.emit("}", t.line);
        continue;
      }

      // ================================================================
      //  Statement: идентификатор
      //  Может быть:
      //    1. target = выражение → присваивание (в т.ч. A[0] = val)
      //    2. Имя(аргументы) → вызов функции
      //    3. target.свойство → метод/свойство (с возможным присваиванием)
      //    4. target; → чтение переменной/индекса
      // ================================================================
      if (t.type === "IDENTIFIER") {
        this.consume();
        const name = t.value;

        // Языковые литералы как statement: Истина; Ложь; Null; Неопределено;
        if (name === "Истина" || name === "Ложь" || name === "Null" || name === "Неопределено") {
          this.emit("/* noop: literal as statement */", t.line);
          this.expectStatementEnd();
          continue;
        }

        // Декларация переменных: Перем ОК, А, Б;
        // В DSL no-op — переменные создаются автоматически при присваивании.
        // Но токены до ';' нужно потребить, чтобы не нарушить парсинг.
        if (name === "Перем" && this.peek().type === "IDENTIFIER") {
          while (this.peek().type !== "EOF") {
            if (this.peek().type === "OPERATOR" && this.peek().value === ";") break;
            this.consume();
          }
          this.expectStatementEnd();
          continue;
        }

        // 1. Парсим постфиксную цепочку [index] (если есть)
        const target = this.parsePostfix(name);

        // 2. Присваивание: target = выражение
        if (this.peek().type === "OPERATOR" && this.peek().value === "=") {
          this.consume();
          const expr = this.parseExpression(0);
          this.emit(`${this.emitWrite(target, expr)};`, t.line);
          this.expectStatementEnd();
          continue;
        }

        // 3. Вызов функции: имя(аргументы)
        if (this.peek().type === "OPERATOR" && this.peek().value === "(") {
          if (!this.isFunction(name)) {
            this.validateFunctionCall(name, t.line);
            this.diagError("UNKNOWN_FUNCTION", `Функция "${name}" не определена`, t.line);
            throw new Error(`Функция "${name}" не определена на строке ${t.line}`);
          }
          this.emit(`${this.generateFunctionCall(name, t.line)};`, t.line);
          this.expectStatementEnd();
          continue;
        }

        // 4. Цепочка методов: target.свойство или target.метод()
        //    Также поддерживает [index] после цепочки: obj.prop[index] = значение
        if (this.peek().type === "OPERATOR" && this.peek().value === ".") {
          let expr = this.emitRead(target);
          // Для __dsl_index_set__ на dot-access: отслеживаем последнее свойство
          let lastProp: string | null = null;
          while (this.peek().type === "OPERATOR" && this.peek().value === ".") {
            this.consume();
            const prop = this.expect("IDENTIFIER").value;
            if (this.peek().type === "OPERATOR" && this.peek().value === "(") {
              this.consume();
              const args = this.parseFunctionArgs();
              expr = `${expr}.${prop}(${args.join(", ")})`;
              lastProp = null; // method call — не property
            } else {
              expr = `${expr}.${prop}`;
              lastProp = prop;
            }
          }
          // После цепочки может быть [index] доступ: obj.prop[index]
          // Для __dsl_index_set__ строим стек объект-индекс пар
          const bracketStack: Array<{ obj: string; idx: string }> = [];
          while (this.peek().type === "OPERATOR" && this.peek().value === "[") {
            this.consume();
            const index = this.parseExpression(0);
            this.expect("OPERATOR", "]");
            bracketStack.push({ obj: expr, idx: index });
            expr = `__dsl_index__(${expr}, ${index})`;
          }
          // После цепочки может быть присваивание: obj.prop[индекс] = значение
          if (this.peek().type === "OPERATOR" && this.peek().value === "=") {
            this.consume();
            const value = this.parseExpression(0);
            if (bracketStack.length > 0) {
              // Генерируем __dsl_index_set__ из последней пары объект-индекс
              const last = bracketStack[bracketStack.length - 1]!;
              expr = `__dsl_index_set__(${last.obj}, ${last.idx}, ${value})`;
            } else if (lastProp !== null) {
              // TRANSITION(v1.4): replace with __dsl_member_set__ after member_set migration
              // Dot-access присваивание: obj.prop = val → __dsl_index_set__(obj, "prop", val)
              // Нужно отделить объект от последнего свойства
              const lastDot = expr.lastIndexOf(".");
              const objExpr = expr.substring(0, lastDot);
              expr = `__dsl_index_set__(${objExpr}, ${JSON.stringify(lastProp)}, ${value})`;
            } else {
              expr = `${expr} = ${value}`;
            }
            this.emit(`${expr};`, t.line);
          } else {
            this.emit(`${expr};`, t.line);
          }
          this.expectStatementEnd();
          continue;
        }

        // 5. Просто target — чтение (валидно в 1C, полезно для отладки)
        this.emit(`${this.emitRead(target)};`, t.line);
        this.expectStatementEnd();
        continue;
      }

      // ================================================================
      //  Новый (как statement — конструктор без присваивания)
      // ================================================================
      if (t.type === "KEYWORD" && t.value === "Новый") {
        this.emit(`${this.parsePrimary()};`, t.line);
        this.expectStatementEnd();
        continue;
      }

      // ================================================================
      //  Неизвестный токен — ошибка компиляции
      // ================================================================
      this.diagError("SYNTAX_ERROR", `Неожиданный токен "${t.value}"`, t.line);
      throw new Error(`Неожиданный токен "${t.value}" на строке ${t.line}`);
    }
  }

  /**
   * Парсит statements во временный буфер и возвращает массив строк.
   * Используется для вложенных блоков (тела if, циклов, try/catch),
   * когда нужно изолировать сгенерированный код текущего блока от
   * внешнего контекста.
   */
  private parseStatementsCapture(terminators: Set<string>): string[] {
    const savedLines = this.lines;
    const savedMap = this.lineMap;
    this.lines = [];
    this.lineMap = [];
    this.parseStatements(terminators);
    const result = this.lines;
    this.lines = savedLines;
    this.lineMap = savedMap;
    return result;
  }

  // ====================================================================
  //  Public entry points
  // ====================================================================

  /**
   * Компилирует полную программу.
   *   1. collectFunctions() — первый проход
   *   2. parseStatements() — второй проход, генерация JS
   * Возвращает JS-код и карту строк (lineMap) для сообщений об ошибках.
   */
  compileProgram(): { jsCode: string; lineMap: number[] } {
    this.collectFunctions();
    this.parseStatements(new Set());
    return { jsCode: this.lines.join("\n"), lineMap: this.lineMap };
  }

  /**
   * Компилирует одно выражение (для Вычислить).
   * Устанавливает mode = "expression", который:
   *   - Разрешает вызов неизвестных функций (через контекст)
   *   - Проверяет, что ввод содержит только одно выражение (до EOF)
   *   - Генерирует return (выражение) — для немедленного вычисления
   * Важно: в этом режиме нет доступа к __dsl_db__ и __dsl_Query__.
   */
  compileExpr(): { jsCode: string } {
    this.mode = "expression";
    const jsCode = this.parseExpression(0);
    if (this.peek().type !== "EOF") {
      this.diagError("EXPRESSION_ONLY", "Вычислить() принимает только выражение");
      throw new Error("Вычислить() принимает только выражение");
    }
    return { jsCode: `return (${jsCode});` };
  }

  /**
   * Компилирует фрагмент кода (для Выполнить).
   * Устанавливает mode = "fragment", который:
   *   - Запрещает объявления: Процедура, Функция, Перем
   *   - Генерирует statements без return-обёртки
   *   - Выполняется в общем контексте с родительским кодом
   */
  compileFragment(): { jsCode: string } {
    this.mode = "fragment";
    // Проверяем, что нет запрещённых объявлений
    for (const tok of this.tokens) {
      if (tok.type === "KEYWORD" && Compiler.FORBIDDEN_IN_FRAGMENT.has(tok.value)) {
        this.diagError("FRAGMENT_FORBIDDEN", `Внутри Выполнить() нельзя использовать "${tok.value}"`, tok.line);
        throw new Error(`Внутри Выполнить() нельзя использовать "${tok.value}" (строка ${tok.line})`);
      }
    }
    this.parseStatements(new Set());
    return { jsCode: this.lines.join("\n") };
  }
}

// ======================================================================
//  Public API — three entry points
// ======================================================================

export type CompileOptions = {
  diagnostics?: DiagnosticsCollector;
};

/**
 * Компилирует программу.
 * Вызывается из ServerRuntime.execute().
 */
export function compile(code: string, capabilities: RuntimeCapabilities, options?: CompileOptions): { jsCode: string; lineMap: number[] } {
  const compiler = new Compiler(code, capabilities, options?.diagnostics);
  return compiler.compileProgram();
}

/**
 * Компилирует выражение.
 * Вызывается из ServerRuntime.createEvalFn() для Вычислить().
 */
export function compileExpression(code: string, capabilities: RuntimeCapabilities, options?: CompileOptions): { jsCode: string } {
  const compiler = new Compiler(String(code), capabilities, options?.diagnostics);
  return compiler.compileExpr();
}

/**
 * Компилирует фрагмент (для Выполнить).
 * Вызывается из ServerRuntime.createExecFn().
 */
export function compileFragment(code: string, capabilities: RuntimeCapabilities, options?: CompileOptions): { jsCode: string } {
  const compiler = new Compiler(String(code), capabilities, options?.diagnostics);
  return compiler.compileFragment();
}
