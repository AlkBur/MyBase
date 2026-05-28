// ======================================================================
//  AST Node types — промежуточное представление DSL
//
//  Этот файл определяет типы узлов абстрактного синтаксического дерева.
//  Текущий компилятор (compile.ts) использует прямую генерацию JS-кода
//  без построения AST (однопроходная трансляция через parseExpression).
//  AST-типы зарезервированы для будущего использования:
//    - Client-интерпретатор (обход AST без eval/new Function)
//    - LSP-сервер (структурный анализ кода)
//    - Линтер / форматтер
//    - Source maps (привязка JS ← DSL)
//
//  Каждый узел хранит type (дискриминант) и специфичные поля.
//  Это union-тип Node для Pattern Matching или switch/case.
//
//  Соглашение: все идентификаторы хранятся как есть (original case),
//  регистронезависимость обеспечивается на уровне runtime.
// ======================================================================

export type Node =
  | Program
  | FunctionDeclaration
  | ProcedureDeclaration
  | Assignment
  | IfStatement
  | CallExpression
  | BinaryExpression
  | UnaryExpression
  | ReturnStatement
  | NewExpression
  | LoopStatement
  | WhileStatement
  | Identifier
  | Literal;

/** Корневой узел — вся программа */
export interface Program {
  type: "Program";
  body: Node[];
}

/** Объявление функции (возвращает значение) */
export interface FunctionDeclaration {
  type: "FunctionDeclaration";
  name: string;
  params: string[];
  body: Node[];
}

/** Объявление процедуры (не возвращает значение) */
export interface ProcedureDeclaration {
  type: "ProcedureDeclaration";
  name: string;
  params: string[];
  body: Node[];
}

/** Присваивание: target = value */
export interface Assignment {
  type: "Assignment";
  target: Identifier | MemberExpression;
  value: Node;
}

/** Обращение к свойству: object.property */
export interface MemberExpression {
  type: "MemberExpression";
  object: Node;
  property: string;
}

/** Условный оператор Если…Тогда…Иначе…КонецЕсли */
export interface IfStatement {
  type: "IfStatement";
  condition: Node;
  consequent: Node[];
  alternate: (Node[] | ElseIfClause)[];
}

/** Ветка ИначеЕсли */
export interface ElseIfClause {
  type: "ElseIfClause";
  condition: Node;
  body: Node[];
}

/** Вызов функции или метода */
export interface CallExpression {
  type: "CallExpression";
  callee: string;
  args: Node[];
}

/** Бинарное выражение: a + b, a > b, a И b */
export interface BinaryExpression {
  type: "BinaryExpression";
  operator: string;
  left: Node;
  right: Node;
}

/** Унарное выражение: НЕ a */
export interface UnaryExpression {
  type: "UnaryExpression";
  operator: string;
  argument: Node;
}

/** Оператор Возврат */
export interface ReturnStatement {
  type: "ReturnStatement";
  argument: Node;
}

/** Конструктор: Новый Запрос, Новый Массив */
export interface NewExpression {
  type: "NewExpression";
  className: string;
}

/** Цикл Для: Для i = 1 По 10 Цикл … КонецЦикла */
export interface LoopStatement {
  type: "LoopStatement";
  variable: string;
  start: Node;
  end: Node;
  step: Node;
  body: Node[];
}

/** Цикл Пока: Пока условие Цикл … КонецЦикла */
export interface WhileStatement {
  type: "WhileStatement";
  condition: Node;
  body: Node[];
}

/** Идентификатор (имя переменной) */
export interface Identifier {
  type: "Identifier";
  name: string;
}

/** Литерал: число, строка, булево */
export interface Literal {
  type: "Literal";
  value: string | number | boolean;
}
