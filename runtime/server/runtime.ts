// ======================================================================
//  ServerRuntime — JIT-компиляция через new Function()
//
//  Архитектура:
//    1. Компиляция: код .os → JS через compile() / compileExpression() / compileFragment()
//    2. Sandbox: new Function() с контролируемым набором параметров
//    3. Контекст: CaseInsensitiveMap для __variables__ и __functions__
//    4. Eval (Вычислить): отдельная песочница, только выражения
//    5. Exec (Выполнить): фрагмент в общем контексте
//
//  Поток выполнения:
//    execute(code) →
//      compile(code, capabilities) → { jsCode, lineMap } →
//      buildSandboxFn(jsCode) → new Function(…) →
//      fn(context, db, DSLQuery, …builtins, evalFn, execFn, DSRuntimeError) →
//      результат или ошибка
//
//  Песочница (sandbox):
//    Все builtin-функции передаются как аргументы new Function() —
//    это даёт контролируемый доступ: каждая функция явно разрешена.
//    Нет globalThis, нет require, нет import — только то, что передано.
//
//  Контекст (CaseInsensitiveMap):
//    Замена Proxy — хранит данные в Object.create(null) с lowercase-ключами.
//    Не ломает оптимизации V8 (hidden classes), сериализуем, прост в отладке.
//
//  Recursion guard:
//    Общий счётчик __execDepth__ в context — защита от ping-pong рекурсии
//    между Вычислить() и Выполнить(). Hard limit: execDepthHard = 500.
// ======================================================================

import { Database } from "bun:sqlite";
import { compile, compileExpression, compileFragment } from "../../compiler/compile";
import { createBuiltins, BuiltinFactories, formatOutput } from "../shared/builtins";
import {
  DSRuntime, RuntimeCapabilities, RuntimeError,
  ExecuteRequest, ExecutionResult, OutputEvent,
  RUNTIME_VERSION,
} from "../shared/types";
import { DSRuntimeError } from "../shared/errors";
import { serverCapabilities } from "./capabilities";

/** Текст ошибки превышения глубины рекурсии Вычислить()/Выполнить() */
const EXEC_DEPTH_ERROR =
  "Превышена допустимая глубина вложенного Выполнить()/Вычислить()";

// ======================================================================
//  CaseInsensitiveMap — регистронезависимое хранилище
//
//  Почему не Proxy:
//    - Proxy ломает hidden class оптимизации V8
//    - Proxy сложно сериализовать
//    - Proxy тяжело дебажить (стеки вызовов)
//    - CaseInsensitiveMap явный, простой и быстрый
//
//  Хранит значения в Object.create(null) (без прототипа) с ключами,
//  приведёнными к lowercase. Методы get/set/delete — единственный способ
//  доступа, никаких утечек внутреннего состояния.
// ======================================================================

class CaseInsensitiveMap {
  private data = Object.create(null);

  get(name: string): unknown {
    return this.data[name.toLowerCase()];
  }

  set(name: string, value: unknown): void {
    this.data[name.toLowerCase()] = value;
  }

  delete(name: string): void {
    delete this.data[name.toLowerCase()];
  }
}

// ======================================================================
//  DSLQuery — обёртка над SQLite для 1C-стиля запросов
//
//  Соответствует синтаксису:
//    Запрос = Новый Запрос;
//    Запрос.Текст = "SELECT * FROM table WHERE id = &ID";
//    Запрос.УстановитьПараметр("ID", 123);
//    Результат = Запрос.Выполнить();
//
//  Параметры: &ИмяПараметра в SQL заменяются на ?,
//  значения подставляются через bind.
// ======================================================================

class DSLQuery {
  private db: Database;
  Текст = "";
  private params: Record<string, any> = {};

  constructor(db: Database) {
    this.db = db;
  }

  УстановитьПараметр(имя: string, значение: any): void {
    this.params[имя] = значение;
  }

  Выполнить(): any[] {
    let sql = this.Текст;
    const values: any[] = [];
    // Заменяем &Имя на ? и собираем значения для bind
    sql = sql.replace(/&([\p{L}\w]+)/gu, (_: string, name: string) => {
      values.push(this.params[name]);
      return "?";
    });
    const stmt = this.db.query(sql);
    const results = stmt.all(...values) as any[];
    // 1C-совместимость: результат имеет метод Количество()
    (results as any).Количество = function () { return this.length; };
    return results;
  }
}

// ======================================================================
//  BUILTIN_KEYS — единый источник истины для sandbox + eval
//
//  Это массив ключей из BuiltinFactories, которые передаются как
//  параметры в new Function(). Используется также для передачи
//  значений через builtinValues().
//
//  Все builtins передаются в одном порядке:
//    1. В sandbox fn:     ...BUILTIN_KEYS
//    2. В eval fn:        ...BUILTIN_KEYS
//    3. В builtinValues:  BUILTIN_KEYS.map(k => builtins[k])
//
//  Это гарантирует, что первые N аргументов функции соответствуют
//  первым N значениям — исключает рассогласование порядка.
// ======================================================================

const BUILTIN_KEYS: (keyof BuiltinFactories)[] = [
  "__dsl_log__",
  "__dsl_currentDate__",
  "__dsl_format__",
  "__dsl_strStartsWith__",
  "__dsl_strEndsWith__",
  "__dsl_strSplit__",
  "__dsl_strConcat__",
  "__dsl_strCompare__",
  "__dsl_strFind__",
  "__dsl_strMid__",
  "__dsl_strTemplate__",
  "__dsl_nstr__",
  "__dsl_newArray__",
  "__dsl_newStructure__",
  "__dsl_newValueTable__",
  "__dsl_newTypeDescription__",
  "__dsl_string__",
  "__dsl_strGetLine__",
  "__dsl_index__",
  "__dsl_errorInfo__",
];

/** Преобразует объект builtins в массив значений в порядке BUILTIN_KEYS */
function builtinValues(builtins: BuiltinFactories): any[] {
  return BUILTIN_KEYS.map((k) => (builtins as any)[k]);
}

// ======================================================================
//  Кэш скомпилированных функций
// ======================================================================

interface CacheEntry {
  fn: Function;
  lineMap: number[];
}

// ======================================================================
//  ServerRuntime
// ======================================================================

export class ServerRuntime implements DSRuntime {
  name = "server";
  capabilities: RuntimeCapabilities;
  private db: Database;
  /** Кэш: ключ = `${RUNTIME_VERSION}|${caps.name}|${code}` */
  private jsCache = new Map<string, CacheEntry>();
  /** Максимальная глубина рекурсии (общий hard limit для Вычислить и Выполнить) */
  private readonly execDepthHard = 500;

  /** Singleton: evalFn (Вычислить) — создаётся один раз при первом execute() */
  private evalFn: ((expr: string, ctx: any) => any) | null = null;
  /** Singleton: execFn (Выполнить) — создаётся один раз при первом execute() */
  private execFn: ((code: string, ctx: any) => any) | null = null;

  constructor(db: Database, capabilities: RuntimeCapabilities = serverCapabilities) {
    this.db = db;
    this.capabilities = capabilities;
  }

  // ====================================================================
  //  execute() — основная точка входа
  //
  //  1. Компилирует код в JS (с кэшированием)
  //  2. Создаёт контекст (variables, functions, execDepth)
  //  3. Создаёт builtins
  //  4. Инициализирует singleton evalFn + execFn (лениво)
  //  5. Выполняет скомпилированную функцию в песочнице
  //  6. Возвращает ExecutionResult
  //
  //  Ошибки:
  //    - DSRuntimeError → line из .os-файла
  //    - TypeError/ReferenceError → line = undefined
  //    - Compile error → success false, message из throw
  // ====================================================================

  execute(request: ExecuteRequest): ExecutionResult {
    const output: OutputEvent[] = [];
    const builtins = createBuiltins(output);
    let compileTime = 0;
    let executeTime = 0;

    // Ленивая инициализация singleton evalFn + execFn
    if (!this.evalFn) {
      this.evalFn = this.createEvalFn(builtins);
      this.execFn = this.createExecFn(builtins);
    }

    try {
      // ---- Компиляция ----
      const tCompile = performance.now();
      // Ключ кэша включает runtime version и capabilities name,
      // чтобы разные версии или target-ы не пересекались
      const cacheKey = `${RUNTIME_VERSION}|${this.capabilities.name}|${request.code}`;
      let entry = this.jsCache.get(cacheKey);
      if (!entry) {
        const { jsCode, lineMap } = compile(request.code, this.capabilities);
        const fn = this.buildSandboxFn(jsCode);
        entry = { fn, lineMap };
        this.jsCache.set(cacheKey, entry);
      }
      compileTime = performance.now() - tCompile;

      // ---- Выполнение ----
      const tExec = performance.now();
      const context = this.createContext();
      const result = entry.fn(
        context,        // __variables__, __functions__, __execDepth__
        this.db,        // __dsl_db__
        DSLQuery,       // __dsl_Query__ (конструктор)
        ...builtinValues(builtins), // все builtins как отдельные аргументы
        this.evalFn,    // __dsl_eval__
        this.execFn,    // __dsl_exec__
        DSRuntimeError, // __dsl_RuntimeError__
        builtins.__dsl_index_set__, // __dsl_index_set__
      );
      executeTime = performance.now() - tExec;

      return {
        success: true,
        output,
        result: result !== undefined ? result : undefined,
        error: undefined,
        runtimeVersion: RUNTIME_VERSION,
        timing: {
          parse: 0,
          compile: Math.round(compileTime * 100) / 100,
          execute: Math.round(executeTime * 100) / 100,
        },
      };
    } catch (e: any) {
      executeTime = performance.now() - (performance.now() - executeTime);
      // Извлекаем line только если это DSRuntimeError
      const line = DSRuntimeError.is(e) ? e.line : undefined;
      const error: RuntimeError = { message: e.message, line };
      return {
        success: false,
        output,
        error,
        runtimeVersion: RUNTIME_VERSION,
      };
    }
  }

  // ---- context ----

  /**
   * Создаёт контекст выполнения.
   * Содержит:
   *   - __variables__ — переменные
   *   - __functions__ — пользовательские функции
   *   - __execDepth__ — общий счётчик рекурсии (Вычислить + Выполнить)
   *
   * Разделение __variables__ и __functions__ нужно, чтобы переменные
   * и функции не конфликтовали по именам.
   */
  private createContext(): Record<string, any> {
    return {
      __variables__: new CaseInsensitiveMap(),
      __functions__: new CaseInsensitiveMap(),
      __execDepth__: 0,
    };
  }

  // ---- eval (Вычислить) ----

  /**
   * Создаёт функцию для выполнения Вычислить(выражение).
   * Singleton — создаётся один раз в первом execute().
   *
   * Песочница eval:
   *   - Использует compileExpression() (mode = expression)
   *   - Передаёт полный context совместно с __execDepth__
   *   - Нет __dsl_db__ и __dsl_Query__ (выражения не делают запросы)
   *   - Builtins те же, что и в основной песочнице
   *   - Кэш: expr|rv=VERSION|expr
   *
   * Shared recursion guard:
   *   - Использует context.__execDepth__ вместо локального счётчика
   *   - Лимит execDepthHard = 500
   */
  private createEvalFn(builtins: BuiltinFactories): (expr: string, fullCtx: any) => any {
    const cache = new Map<string, Function>();
    // evalFn — named const, ссылается сама на себя (самореференция для вложенных Вычислить)
    const evalFn = (expr: string, fullCtx: any) => {
      if (++fullCtx.__execDepth__ > this.execDepthHard) {
        throw new DSRuntimeError(EXEC_DEPTH_ERROR);
      }
      try {
        const key = `expr|rv=${RUNTIME_VERSION}|${expr}`;
        let fn = cache.get(key);
        if (!fn) {
          const { jsCode } = compileExpression(expr, this.capabilities);
          fn = new Function("context", ...BUILTIN_KEYS, "__dsl_eval__", jsCode);
          cache.set(key, fn);
        }
        return fn(fullCtx, ...builtinValues(builtins), evalFn);
      } finally {
        fullCtx.__execDepth__--;
      }
    };
    return evalFn;
  }

  // ---- exec (Выполнить) ----

  /**
   * Создаёт функцию для выполнения Выполнить(код).
   * Singleton — создаётся один раз в первом execute().
   *
   * Песочница exec:
   *   - Использует compileFragment() (mode = fragment)
   *   - Компилируется через compileProgram() без return-обёртки
   *   - Передаёт полный context (общий __variables__/__functions__)
   *   - Полный sandbox (с __dsl_db__, __dsl_Query__)
   *   - Кэш: fragment|rv=VERSION|caps=NAME|code
   *   - Shared recursion guard с Вычислить
   *   - Не возвращает значение (undefined)
   */
  private createExecFn(builtins: BuiltinFactories): (code: string, fullCtx: any) => void {
    const cache = new Map<string, CacheEntry>();

    return (code: string, fullCtx: any) => {
      if (++fullCtx.__execDepth__ > this.execDepthHard) {
        throw new DSRuntimeError(EXEC_DEPTH_ERROR);
      }
      try {
        const key = `fragment|rv=${RUNTIME_VERSION}|caps=${this.capabilities.name}|${code}`;
        let entry = cache.get(key);
        if (!entry) {
          const { jsCode } = compileFragment(code, this.capabilities);
          // Fragment sandbox: полный, как и основная программа
          const fn = this.buildSandboxFn(jsCode);
          entry = { fn, lineMap: [] };
          cache.set(key, entry);
        }
        // Передаём полный контекст — тот же __variables__/__functions__
        entry.fn(
          fullCtx,
          this.db,
          DSLQuery,
          ...builtinValues(builtins),
          this.evalFn,
          this.execFn,
          DSRuntimeError,
          builtins.__dsl_index_set__,
        );
      } finally {
        fullCtx.__execDepth__--;
      }
    };
  }

  // ---- sandbox ----

  /**
   * Строит sandbox-функцию из JS-кода.
   * Параметры функции — это всё, что доступно внутри DSL:
   *   - context (переменные, функции, execDepth)
   *   - __dsl_db__ (SQLite)
   *   - __dsl_Query__ (конструктор запросов)
   *   - ...BUILTIN_KEYS (каждая builtin отдельным параметром)
   *   - __dsl_eval__ (функция Вычислить)
   *   - __dsl_exec__ (функция Выполнить)
   *   - __dsl_RuntimeError__ (конструктор ошибок)
   *
   * Все builtin-имена начинаются с __dsl_ чтобы не конфликтовать
   * с возможными переменными пользователя.
   */
  private buildSandboxFn(jsCode: string): Function {
    return new Function(
      "context", "__dsl_db__", "__dsl_Query__",
      ...BUILTIN_KEYS,
      "__dsl_eval__",
      "__dsl_exec__",
      "__dsl_RuntimeError__",
      "__dsl_index_set__",
      jsCode,
    );
  }
}
