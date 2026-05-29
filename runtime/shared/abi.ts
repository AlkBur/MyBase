/**
 * DSL Runtime ABI — формальный интерфейс между компилятором и runtime.
 *
 * Этот файл определяет ТОЛЬКО типы (interface + const assertions).
 * Без реализации, без семантики, без импорта runtime-модулей.
 *
 * ABI_VERSION: номер текущего ABI-контракта — часть ключа кэша компиляции.
 *
 * Зачем нужен формальный ABI:
 *   - Компилятор знает точный порядок sandbox-параметров
 *   - Runtime проверяет совместимость ABI при инициализации
 *   - Snapshot-тесты детектят случайный drift BUILTIN_KEYS
 *   - Упрощает migration между версиями
 *   - Документирует контракт для новых runtime backend'ов
 *
 * Как использовать:
 *   import { ABI_VERSION, ABI_CONSTANTS } from "./abi";
 *   if (BUILTIN_KEYS.length !== ABI_CONSTANTS.builtinKeys.length) ...
 */
export const ABI_VERSION = "1.3.3";

/**
 * ABI контракт v1.3.3.
 * Отражает состояние runtime до Unified Member Dispatch migration (v1.4).
 * Все поля readonly — контракт не должен мутироваться в runtime.
 */
export interface DSLRuntimeABI_v1_3_3 {
  /** Версия ABI (совпадает с RUNTIME_VERSION) */
  readonly version: string;

  /**
   * Порядок BUILTIN_KEYS — критичен.
   * Должен совпадать между sandbox fn, eval fn и builtinValues().
   */
  readonly builtinKeys: readonly string[];

  /**
   * Порядок параметров основной sandbox-функции (ServerRuntime).
   * new Function(context, __dsl_db__, __dsl_Query__, ...BUILTIN_KEYS, __dsl_eval__, __dsl_exec__, __dsl_RuntimeError__, __dsl_index_set__, jsCode)
   */
  readonly sandboxParamOrderFull: readonly string[];

  /**
   * Порядок параметров eval-функции (Вычислить).
   * new Function(context, ...BUILTIN_KEYS, __dsl_eval__, jsCode)
   * Без __dsl_db__, __dsl_Query__, __dsl_exec__, __dsl_index_set__.
   */
  readonly sandboxParamOrderEval: readonly string[];

  /**
   * Все известные DSL-типы (__dsl_type__ значения).
   * Ключ: каноническое имя, значение: значение __dsl_type__.
   */
  readonly dslObjectTypes: Readonly<Record<string, string>>;

  /**
   * Режимы компиляции.
   */
  readonly compileModes: Readonly<Record<string, string>>;
}

/**
 * Значения ABI для v1.3.3 (frozen snapshot).
 * Может использоваться для runtime-проверок совместимости.
 */
export const ABI_CONSTANTS: DSLRuntimeABI_v1_3_3 = Object.freeze({
  version: "1.3.3",

  builtinKeys: [
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
    "__dsl_newFixedArray__",
    "__dsl_newStructure__",
    "__dsl_newValueTable__",
    "__dsl_newTypeDescription__",
    "__dsl_newMap__",
    "__dsl_newFixedMap__",
    "__dsl_newUUID__",
    "__dsl_newValueList__",
    "__dsl_newPicture__",
    "__dsl_type__",
    "__dsl_typeOf__",
    "__dsl_add__",
    "__dsl_string__",
    "__dsl_strGetLine__",
    "__dsl_index__",
    "__dsl_errorInfo__",
    "__dsl_strIsEmpty__",
    "__dsl_trim__",
    "__dsl_charCode__",
    "__dsl_number__",
    "__dsl_currentUniversalDateInMillis__",
    "__dsl_newStringQualifiers__",
    "__dsl_member_get__",
  ],

  sandboxParamOrderFull: [
    "context",
    "__dsl_db__",
    "__dsl_Query__",
    // 33 BUILTIN_KEYS
    "context", // placeholder — expanded at runtime
    "__dsl_eval__",
    "__dsl_exec__",
    "__dsl_RuntimeError__",
    "__dsl_index_set__",
  ],

  sandboxParamOrderEval: [
    "context",
    // 33 BUILTIN_KEYS (без __dsl_index_set__)
    "__dsl_eval__",
  ],

  dslObjectTypes: {
    ValueTable: "ValueTable",
    ValueTableRow: "ValueTableRow",
    ValueTableColumns: "ValueTableColumns",
    ValueTableIndexes: "ValueTableIndexes",
    ValueTableIndex: "ValueTableIndex",
    Структура: "Структура",
    Map: "Map",
    FixedMap: "FixedMap",
    FixedArray: "FixedArray",
    UniqueIdentifier: "UniqueIdentifier",
    Type: "Type",
    TypeDescription: "TypeDescription",
    StringQualifiers: "StringQualifiers",
    ValueList: "ValueList",
    ValueListItem: "ValueListItem",
    Picture: "Picture",
  },

  compileModes: {
    program: "Full sandbox: DB + Query + all builtins; declarations allowed (Процедура, Функция, Перем, Возврат)",
    expression: "Limited sandbox: no DB, no Query; no statements; return-wrapped; recursion guard (execDepthHard=500)",
    fragment: "Full sandbox: DB + Query; NO declarations; shared context with parent; recursion guard (execDepthHard=500)",
  },
}) as const;
