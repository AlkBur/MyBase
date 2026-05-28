// ======================================================================
//  DSRuntimeError — кастомная ошибка DSL
//
//  Зачем нужен отдельный класс вместо обычного Error:
//    1. Branded symbol — устойчив к множественным копиям модуля при
//       bundling (не ломается instanceof)
//    2. Хранит line и column из исходного кода .os — для точного
//       указания места ошибки
//    3. Статический метод is() — надёжная проверка, работает даже
//       если экземпляр создан в другой области видимости (iframe, worker)
//
//  Используется:
//    - В компиляторе для генерации throw new __dsl_RuntimeError__(...)
//    - В runtime для catch(error) и определения DSL-ошибки
//    - В execute() для извлечения line из ошибки
//
//  Важно: DSRuntimeError !== TypeError/ReferenceError.
//  Все внутренние JS-ошибки (undefined, not a function) не имеют line.
//  Только ВызватьИсключение даёт точную строку в .os.
// ======================================================================

/** Branded symbol — невидим для сериализации JSON, стабилен при bundling */
const DS_RUNTIME_ERROR = Symbol("DS_RUNTIME_ERROR");

export class DSRuntimeError extends Error {
  /** Brand marker — проверяется в DSRuntimeError.is() */
  [DS_RUNTIME_ERROR] = true;
  /** Строка в исходном .os-файле, где произошёл ВызватьИсключение */
  readonly line?: number;
  readonly column?: number;

  constructor(message: string, line?: number, column?: number) {
    super(message);
    this.name = "DSRuntimeError";
    this.line = line;
    this.column = column;
  }

  /**
   * Проверяет, является ли переданное значение DSRuntimeError.
   * Использует branded symbol, а не instanceof — это надёжнее
   * при работе с несколькими экземплярами класса (bundling, workers).
   */
  static is(err: unknown): err is DSRuntimeError {
    return err != null && typeof err === "object" && (err as any)[DS_RUNTIME_ERROR] === true;
  }
}
