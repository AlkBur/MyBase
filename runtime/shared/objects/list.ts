/**
 * СписокЗначений — динамический список элементов с метаданными.
 *
 * Каждый элемент (ЭлементСпискаЗначений) содержит:
 *   - Значение — произвольное значение
 *   - Представление — строковое представление (default "")
 *   - Пометка — флаг отметки (default Ложь)
 *   - Картинка — произвольный объект (default Неопределено)
 *
 * Доступ к элементам:
 *   - По индексу: Список[0] -> элемент (read-only, запись запрещена)
 *   - Метод Получить(Индекс)
 *   - Итерация: Для Каждого Элемент Из Список Цикл
 *
 * Отличия от 1С:
 *   - 0-based индексы (1С — 1-based для Получить)
 *   - Удалить по элементу использует identity (===), не значение
 *   - toString() элемента возвращает String(Значение), не Представление
 */

import { defineMethod, defineDSLType } from "./helpers";

/**
 * Создаёт новый элемент списка значений.
 * @param owner — список-владелец
 * @param value — значение элемента
 * @param presentation — строковое представление (default "")
 * @param mark — флаг отметки (default false)
 * @param picture — картинка (default undefined)
 */
export function createValueListItem(
  owner: any,
  value: any,
  presentation: string = "",
  mark: boolean = false,
  picture: any = undefined
): any {
  const obj = Object.create(null);
  defineDSLType(obj, "ValueListItem");

  // __owner__ — ссылка на список-владелец, internal-only.
  Object.defineProperty(obj, "__owner__", {
    value: owner,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  const _value = { current: value };
  const _presentation = { current: presentation ?? "" };
  const _mark = { current: mark ?? false };
  const _picture = { current: picture };

  Object.defineProperty(obj, "Значение", {
    get: () => _value.current,
    set: (v) => { _value.current = v; },
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(obj, "Представление", {
    get: () => _presentation.current,
    set: (v) => { _presentation.current = v ?? ""; },
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(obj, "Пометка", {
    get: () => _mark.current,
    set: (v) => { _mark.current = !!v; },
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(obj, "Картинка", {
    get: () => _picture.current,
    set: (v) => { _picture.current = v; },
    enumerable: false,
    configurable: false,
  });

  Object.defineProperty(obj, "toString", {
    value: () => String(_value.current),
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return obj;
}

/**
 * Создаёт новый список значений.
 */
export function createValueList(): any {
  const items: any[] = [];

  const obj = Object.create(null);
  defineDSLType(obj, "ValueList");

  Object.defineProperty(obj, "__items__", {
    value: items,
    enumerable: false,
    writable: false,
    configurable: false,
  });

  defineMethod(obj, "Количество", () => items.length);

  defineMethod(obj, "Получить", (index: any) => {
    const idx = Number(index);
    if (idx < 0 || idx >= items.length || !Number.isInteger(idx)) {
      throw new Error("Значение индекса выходит за пределы диапазона");
    }
    return items[idx];
  });

  defineMethod(obj, "Добавить", (value: any, presentation?: string, mark?: boolean, picture?: any) => {
    const item = createValueListItem(obj, value, presentation, mark, picture);
    items.push(item);
    return item;
  });

  defineMethod(obj, "Вставить", (index: any, value: any, presentation?: string, mark?: boolean, picture?: any) => {
    const idx = Number(index);
    if (idx < 0 || idx > items.length || !Number.isInteger(idx)) {
      throw new Error("Значение индекса выходит за пределы диапазона");
    }
    const item = createValueListItem(obj, value, presentation, mark, picture);
    items.splice(idx, 0, item);
    return item;
  });

  defineMethod(obj, "Удалить", (itemOrIndex: any) => {
    if (typeof itemOrIndex === "number" || (typeof itemOrIndex === "string" && /^\d+$/.test(itemOrIndex))) {
      const idx = Number(itemOrIndex);
      if (idx < 0 || idx >= items.length || !Number.isInteger(idx)) {
        throw new Error("Значение индекса выходит за пределы диапазона");
      }
      items.splice(idx, 1);
      return;
    }
    if (itemOrIndex != null && typeof itemOrIndex === "object" && itemOrIndex.__dsl_type__ === "ValueListItem") {
      const idx = items.indexOf(itemOrIndex);
      if (idx === -1) {
        throw new Error("Элемент не принадлежит списку значений");
      }
      items.splice(idx, 1);
      return;
    }
    throw new Error("Неверный тип аргумента");
  });

  defineMethod(obj, "Индекс", (item: any) => {
    return items.indexOf(item);
  });

  defineMethod(obj, "Сдвинуть", (itemOrIndex: any, offset: any) => {
    let idx: number;
    if (typeof itemOrIndex === "number") {
      idx = itemOrIndex;
    } else if (typeof itemOrIndex === "string" && /^-?\d+$/.test(itemOrIndex)) {
      idx = Number(itemOrIndex);
    } else if (itemOrIndex != null && typeof itemOrIndex === "object" && itemOrIndex.__dsl_type__ === "ValueListItem") {
      idx = items.indexOf(itemOrIndex);
      if (idx === -1) {
        throw new Error("Элемент не принадлежит списку значений");
      }
    } else {
      throw new Error("Неверный тип аргумента");
    }
    if (idx < 0 || idx >= items.length || !Number.isInteger(idx)) {
      throw new Error("Значение индекса выходит за пределы диапазона");
    }
    let shift: number;
    if (typeof offset === "number") {
      shift = offset;
    } else if (typeof offset === "string" && /^-?\d+$/.test(offset)) {
      shift = Number(offset);
    } else {
      throw new Error("Неверный тип аргумента");
    }
    const newIdx = idx + shift;
    if (newIdx < 0 || newIdx >= items.length) {
      throw new Error("Неверное значение аргумента номер 2");
    }
    const [item] = items.splice(idx, 1);
    items.splice(newIdx, 0, item);
  });

  defineMethod(obj, "СортироватьПоЗначению", (direction?: any) => {
    const desc = direction !== undefined && String(direction) === "Убыв";
    items.sort((a: any, b: any) => {
      const va = a.Значение;
      const vb = b.Значение;
      if (va < vb) return desc ? 1 : -1;
      if (va > vb) return desc ? -1 : 1;
      return 0;
    });
  });

  defineMethod(obj, "СортироватьПоПредставлению", (direction?: any) => {
    const desc = direction !== undefined && String(direction) === "Убыв";
    items.sort((a: any, b: any) => {
      const va = String(a.Представление);
      const vb = String(b.Представление);
      if (va < vb) return desc ? 1 : -1;
      if (va > vb) return desc ? -1 : 1;
      return 0;
    });
  });

  defineMethod(obj, "НайтиПоЗначению", (value: any) => {
    for (const item of items) {
      if (item.Значение === value) {
        return item;
      }
    }
    return undefined;
  });

  defineMethod(obj, "Очистить", () => {
    items.length = 0;
  });

  Object.defineProperty(obj, "toString", {
    value: () => "Список значений",
    enumerable: false,
    writable: false,
    configurable: false,
  });

  Object.defineProperty(obj, Symbol.iterator, {
    value: function* () { yield* items; },
    enumerable: false,
    writable: false,
    configurable: false,
  });

  return obj;
}
