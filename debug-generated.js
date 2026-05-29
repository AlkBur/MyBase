context.__variables__.set("НомерТеста", 0);
ТестДолжен_СоздатьТаблицуЗначений();
ТестДолжен_СоздатьУдалитьКолонки();
ТестДолжен_СоздатьУдалитьСтроки();
ТестДолжен_ПереместитьСтроки();
ТестДолжен_ОтработатьСДанными();
ТестДолжен_ВыгрузитьКолонкуВМассив();
ТестДолжен_НайтиСтрокуВТаблице();
ТестДолжен_НайтиНесколькоСтрокВТаблице();
ТестДолжен_СкопироватьТаблицуПолностью();
ТестДолжен_СкопироватьТаблицуПоМассивуСтрок();
ТестДолжен_ПроверитьИсключениеПриКопированииТаблицыПоМассивуСтрок();
ТестДолжен_СкопироватьТаблицуНесколькоКолонок();
ТестДолжен_СкопироватьТаблицуПоОтбору();
ТестДолжен_ПроверитьСверткуБезУказанияКолонок();
ТестДолжен_ЗагрузитьКолонку();
ТестДолжен_ПроверитьТипизациюКолонки();
ТестДолжен_ПроверитьСверткуБольшойТаблицы();
ТестДолжен_ПроверитьСверткуБольшойТаблицы2();
ТестДолжен_ПроверитьСверткуПоДвумКолонкам();
ТестДолжен_ПроверитьСверткуПоДвумКолонкамСРазнымиТипами();
ТестДолжен_ПроверитьСверткуПоКолонкамСуммированияСРазнымиТипами();
ТестДолжен_ПроверитьСверткуПоОднойКолонкеСРазнымиТипами();
ТестДолжен_ПроверитьСортировку_Чисел();
ТестДолжен_ПроверитьСортировку_Булевых();
ТестДолжен_ПроверитьСортировку_Дат();
ТестДолжен_ПроверитьСортировку_Строк();
ТестДолжен_ПроверитьСортировку_СтрокРазныхАлфавитов();
ТестДолжен_ПроверитьСортировкуНеупорядочиваемыхТипов();
ТестДолжен_ПроверитьСортировкуРазныхТипов();
ТестДолжен_ПроверитьСортировкуПоПредставлению();
ТестДолжен_ПроверитьВставкуВнеРазмераТаблицы();
ТестДолжен_ПроверитьИсключениеПриЗагрузкеКолонки();
ТестДолжен_ПроверитьИсключениеПриНеверномПараметреСортировки();
ТестДолжен_ПроверитьСортировкуСЛишнимиПробеламиВПараметрах();
ТестДолжен_Проверить_ЗаполнитьЗначения_СПустымСпискомКолонок();
ТестДолжен_Проверить_Найти_СПустымСпискомКолонок();
ТестДолжен_Проверить_СкопироватьКолонки_СПустымСпискомКолонок();
ТестДолжен_Проверить_Скопировать_СПустымСпискомКолонок();
ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_Строка();
ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаЧисло();
ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаДата();
ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаБезЧисел();
ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаЧислоБезЧисел();
ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаДатаБезЧисел();
ТестДолжен_ПроверитьИтогПоКолонкеБезОписанияТипов_БезЧисел();
ТестДолжен_ПроверитьИсключениеПриНеверномИмениКолонкиВОтборе();
ТестДолжен_ПроверитьЗапятуюВИменахКолонок_БезПустых();
ТестДолжен_ПроверитьЗапятуюВИменахКолонок_СПустыми();
ТестДолжен_ПроверитьИсключениеДляИндекса();
ТестДолжен_ВызватьИсключениеПриДобавленииКолонкиСНевернымИменем();
ТестДолжен_ВызватьИсключениеПриВставкеКолонкиСНевернымИменем();
ТестДолжен_ВызватьИсключениеНаПоискеИндексаКолонкиСНевернымПримитивнымТипом();
ТестДолжен_ВызватьИсключениеНаПоискеИндексаКолонкиСНевернымОбъектнымТипом();
ТестДолжен_ПроверитьИсключениеПолученияКолонкиСНевернымНомером();
ТестДолжен_НайтиИспользуетИндекс();
ТестДолжен_НайтиВозвращаетНеопределеноЕслиНетСовпадений();
ТестДолжен_НайтиПоНесколькимКолонкам();
ТестДолжен_НайтиПоНесколькимКолонкамСЧастичнымИндексом();
ТестДолжен_НайтиСИндексомБыстрееЧемБезИндекса();
function ТестДолжен_СоздатьТаблицуЗначений() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.set("КоличествоДобавляемыхКолонокСтрок", 5);
context.__variables__.set("Инд", 1);
while (context.__variables__.get("Инд") <= context.__variables__.get("КоличествоДобавляемыхКолонокСтрок")) {
context.__variables__.get("Т").Колонки.Добавить(__dsl_add__("К", context.__variables__.get("Инд")));
context.__variables__.get("Т").Добавить();
  context.__variables__.set("Инд", context.__variables__.get("Инд") + 1);
}
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Количество(), context.__variables__.get("КоличествоДобавляемыхКолонокСтрок"));
ПроверитьРавенство(context.__variables__.get("Т").Количество(), context.__variables__.get("КоличествоДобавляемыхКолонокСтрок"));
}
context.__functions__.set("ТестДолжен_СоздатьТаблицуЗначений", ТестДолжен_СоздатьТаблицуЗначений);
function ТестДолжен_СоздатьУдалитьКолонки() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.set("К1", context.__variables__.get("Т").Колонки.Добавить("К1"));
context.__variables__.set("К2", context.__variables__.get("Т").Колонки.Добавить("К2"));
context.__variables__.set("К3", context.__variables__.get("Т").Колонки.Добавить("К3"));
context.__variables__.set("К4", context.__variables__.get("Т").Колонки.Добавить("К4"));
context.__variables__.set("К5", context.__variables__.get("Т").Колонки.Добавить("К5"));
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Количество(), 5);
context.__variables__.get("Т").Колонки.Удалить(context.__variables__.get("К3"));
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Количество(), 4);
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Найти("К3"), undefined);
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Найти("К2"), context.__variables__.get("К2"));
context.__variables__.set("Строка1", context.__variables__.get("Т").Добавить());
context.__variables__.set("Строка2", context.__variables__.get("Т").Добавить());
context.__variables__.set("К6", context.__variables__.get("Т").Колонки.Добавить("К6"));
context.__lastException__ = null;
try {
__dsl_index_set__(context.__variables__.get("Строка1"), "К6", 123);
ПроверитьРавенство(__dsl_index__(context.__variables__.get("Строка1"), "К6"), 123);
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
ПроверитьИстину(false, "Колонка К6 не доступна!");
}
context.__variables__.get("Т").Колонки.Удалить(0);
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Количество(), 4);
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Найти("К1"), undefined);
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Найти("К2"), context.__variables__.get("К2"));
context.__variables__.get("Т").Колонки.Удалить("К4");
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Количество(), 3);
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Найти("К4"), undefined);
ПроверитьРавенство(context.__variables__.get("Т").Колонки.Найти("К2"), context.__variables__.get("К2"));
context.__lastException__ = null;
try {
context.__variables__.set("Значение", __dsl_index__(context.__variables__.get("Строка1"), "К1"));
ПроверитьИстину(false, "Доступна удалённая колонка!");
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
}
}
context.__functions__.set("ТестДолжен_СоздатьУдалитьКолонки", ТестДолжен_СоздатьУдалитьКолонки);
function ТестДолжен_СоздатьУдалитьСтроки() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.set("К1", context.__variables__.get("Т").Колонки.Добавить("К1"));
context.__variables__.set("К2", context.__variables__.get("Т").Колонки.Добавить("К2"));
context.__variables__.set("К3", context.__variables__.get("Т").Колонки.Добавить("К3"));
context.__variables__.set("К4", context.__variables__.get("Т").Колонки.Добавить("К4"));
context.__variables__.set("К5", context.__variables__.get("Т").Колонки.Добавить("К5"));
context.__variables__.set("С1", context.__variables__.get("Т").Добавить());
context.__variables__.set("С2", context.__variables__.get("Т").Добавить());
context.__variables__.set("С2_5", context.__variables__.get("Т").Добавить());
context.__variables__.set("С2_6", context.__variables__.get("Т").Добавить());
context.__variables__.set("С3", context.__variables__.get("Т").Добавить());
context.__variables__.set("С4", context.__variables__.get("Т").Добавить());
context.__variables__.get("Т").Удалить(context.__variables__.get("С2_5"));
context.__variables__.get("Т").Удалить(2);
ПроверитьРавенство(context.__variables__.get("Т").Количество(), 4);
ПроверитьРавенство(context.__variables__.get("Т").Получить(0), context.__variables__.get("С1"));
ПроверитьРавенство(context.__variables__.get("Т").Получить(1), context.__variables__.get("С2"));
ПроверитьРавенство(context.__variables__.get("Т").Получить(2), context.__variables__.get("С3"));
ПроверитьРавенство(context.__variables__.get("Т").Получить(3), context.__variables__.get("С4"));
ПроверитьРавенство(__dsl_index__(context.__variables__.get("Т"), 0), context.__variables__.get("С1"));
ПроверитьРавенство(__dsl_index__(context.__variables__.get("Т"), 1), context.__variables__.get("С2"));
ПроверитьРавенство(__dsl_index__(context.__variables__.get("Т"), 2), context.__variables__.get("С3"));
ПроверитьРавенство(__dsl_index__(context.__variables__.get("Т"), 3), context.__variables__.get("С4"));
ПроверитьРавенство(context.__variables__.get("Т").Индекс(context.__variables__.get("С1")), 0);
ПроверитьРавенство(context.__variables__.get("Т").Индекс(context.__variables__.get("С2")), 1);
ПроверитьРавенство(context.__variables__.get("Т").Индекс(context.__variables__.get("С3")), 2);
ПроверитьРавенство(context.__variables__.get("Т").Индекс(context.__variables__.get("С4")), 3);
context.__variables__.set("Обошли", __dsl_newMap__());
const __iterable__1 = context.__variables__.get("Т");
if (!__iterable__1 || typeof __iterable__1[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 205 + ")");
}
const __prev__1 = context.__variables__.get("мСтрокаТаблицы");
try {
  for (const __item__1 of __iterable__1) {
    context.__variables__.set("мСтрокаТаблицы", __item__1);
context.__variables__.get("Обошли").Вставить(context.__variables__.get("мСтрокаТаблицы"), true);
  }
} finally {
  if (__prev__1 === undefined) {
    context.__variables__.delete("мСтрокаТаблицы");
  } else {
    context.__variables__.set("мСтрокаТаблицы", __prev__1);
  }
}
ПроверитьИстину(context.__variables__.get("Обошли").Получить(context.__variables__.get("С1")), "Обход бегунком");
ПроверитьИстину(context.__variables__.get("Обошли").Получить(context.__variables__.get("С2")), "Обход бегунком");
ПроверитьИстину(context.__variables__.get("Обошли").Получить(context.__variables__.get("С3")), "Обход бегунком");
ПроверитьИстину(context.__variables__.get("Обошли").Получить(context.__variables__.get("С4")), "Обход бегунком");
}
context.__functions__.set("ТестДолжен_СоздатьУдалитьСтроки", ТестДолжен_СоздатьУдалитьСтроки);
function ПроверитьПорядок(Т, П1, П2, П3, П4, П5) {
  context.__variables__.set("Т", Т);
  context.__variables__.set("П1", П1);
  context.__variables__.set("П2", П2);
  context.__variables__.set("П3", П3);
  context.__variables__.set("П4", П4);
  context.__variables__.set("П5", П5);
context.__variables__.set("Массив", __dsl_newArray__());
context.__variables__.get("Массив").Добавить(context.__variables__.get("П1"));
context.__variables__.get("Массив").Добавить(context.__variables__.get("П2"));
context.__variables__.get("Массив").Добавить(context.__variables__.get("П3"));
context.__variables__.get("Массив").Добавить(context.__variables__.get("П4"));
context.__variables__.get("Массив").Добавить(context.__variables__.get("П5"));
context.__variables__.set("Инд", 0);
while (context.__variables__.get("Инд") <= 4) {
if (__dsl_index__(context.__variables__.get("Т"), context.__variables__.get("Инд")).Порядок !== __dsl_index__(context.__variables__.get("Массив"), context.__variables__.get("Инд"))) {
return false;
}
  context.__variables__.set("Инд", context.__variables__.get("Инд") + 1);
}
return true;
}
context.__functions__.set("ПроверитьПорядок", ПроверитьПорядок);
function ТестДолжен_ПереместитьСтроки() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.get("Т").Колонки.Добавить("Порядок");
context.__variables__.set("Инд", 1);
while (context.__variables__.get("Инд") <= 5) {
context.__variables__.get("Т").Добавить().Порядок = context.__variables__.get("Инд");
  context.__variables__.set("Инд", context.__variables__.get("Инд") + 1);
}
context.__variables__.set("С1", __dsl_index__(context.__variables__.get("Т"), 0));
context.__variables__.set("С2", __dsl_index__(context.__variables__.get("Т"), 1));
context.__variables__.set("С3", __dsl_index__(context.__variables__.get("Т"), 2));
context.__variables__.set("С4", __dsl_index__(context.__variables__.get("Т"), 3));
context.__variables__.set("С5", __dsl_index__(context.__variables__.get("Т"), 4));
context.__variables__.get("Т").Сдвинуть(context.__variables__.get("С2"), -(1));
ПроверитьПорядок(context.__variables__.get("Т"), 2, 1, 3, 4, 5);
context.__variables__.get("Т").Сдвинуть(context.__variables__.get("С1"), 2);
ПроверитьПорядок(context.__variables__.get("Т"), 2, 3, 4, 1, 5);
context.__variables__.get("Т").Сдвинуть(3, -(2));
ПроверитьПорядок(context.__variables__.get("Т"), 2, 1, 3, 4, 5);
context.__variables__.get("Т").Сдвинуть(1, 2);
ПроверитьПорядок(context.__variables__.get("Т"), 2, 3, 4, 1, 5);
context.__variables__.get("Т").Сдвинуть("2", 2);
ПроверитьПорядок(context.__variables__.get("Т"), 2, 3, 1, 5, 4);
context.__variables__.get("Т").Сдвинуть("1", "2");
ПроверитьПорядок(context.__variables__.get("Т"), 2, 1, 5, 3, 4);
context.__variables__.get("Т").Сдвинуть(0, 4);
ПроверитьПорядок(context.__variables__.get("Т"), 1, 5, 3, 4, 2);
context.__variables__.get("Т").Сдвинуть(4, -(4));
ПроверитьПорядок(context.__variables__.get("Т"), 2, 1, 5, 3, 4);
context.__variables__.set("Ошибка", "Сдвиг за пределы вниз");
context.__lastException__ = null;
try {
context.__variables__.get("Т").Сдвинуть(0, 5);
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
context.__variables__.set("Ошибка", __dsl_errorInfo__(context).Описание);
}
ПроверитьРавенство(context.__variables__.get("Ошибка"), "Неправильное смещение внутри коллекции");
context.__variables__.set("Ошибка", "Сдвиг за пределы вверх");
context.__lastException__ = null;
try {
context.__variables__.get("Т").Сдвинуть(1, -(3));
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
context.__variables__.set("Ошибка", __dsl_errorInfo__(context).Описание);
}
ПроверитьРавенство(context.__variables__.get("Ошибка"), "Неправильное смещение внутри коллекции");
context.__variables__.set("Ошибка", "Сдвиг с неверным индексом");
context.__lastException__ = null;
try {
context.__variables__.get("Т").Сдвинуть(10, 2);
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
context.__variables__.set("Ошибка", __dsl_errorInfo__(context).Описание);
}
ПроверитьРавенство(context.__variables__.get("Ошибка"), "Значение индекса выходит за пределы диапазона");
context.__variables__.set("Ошибка", "Сдвиг несуществующего элемента");
context.__variables__.set("ДругаяТЗ", __dsl_newValueTable__());
context.__variables__.get("ДругаяТЗ").Колонки.Добавить("Индекс");
context.__variables__.get("ДругаяТЗ").Добавить().Индекс = 1;
context.__lastException__ = null;
try {
context.__variables__.get("Т").Сдвинуть(__dsl_index__(context.__variables__.get("ДругаяТЗ"), 0), 2);
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
context.__variables__.set("Ошибка", __dsl_errorInfo__(context).Описание);
}
ПроверитьРавенство(context.__variables__.get("Ошибка"), "Строка не принадлежит таблице значений");
context.__variables__.set("Ошибка", "Сдвиг с неверным типом параметра");
context.__lastException__ = null;
try {
context.__variables__.get("Т").Сдвинуть("ё", 2);
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
context.__variables__.set("Ошибка", __dsl_errorInfo__(context).Описание);
}
ПроверитьРавенство(context.__variables__.get("Ошибка"), "Неверный тип аргумента");
}
context.__functions__.set("ТестДолжен_ПереместитьСтроки", ТестДолжен_ПереместитьСтроки);
function ТестДолжен_ОтработатьСДанными() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.get("Т").Колонки.Добавить("Количество");
context.__variables__.get("Т").Колонки.Добавить("Цена");
context.__variables__.get("Т").Колонки.Добавить("Сумма");
context.__variables__.set("Инд", 1);
while (context.__variables__.get("Инд") <= 5) {
context.__variables__.set("НоваяСтрока", context.__variables__.get("Т").Добавить());
context.__variables__.get("НоваяСтрока").Количество = context.__variables__.get("Инд");
  context.__variables__.set("Инд", context.__variables__.get("Инд") + 1);
}
context.__variables__.set("Цены", __dsl_newArray__());
context.__variables__.get("Цены").Добавить(100);
context.__variables__.get("Цены").Добавить(50);
context.__variables__.get("Цены").Добавить(30);
context.__variables__.get("Цены").Добавить(32.3);
context.__variables__.get("Цены").Добавить(16);
context.__variables__.get("Т").ЗагрузитьКолонку(context.__variables__.get("Цены"), "Цена");
context.__variables__.set("мСумма", 0);
const __iterable__2 = context.__variables__.get("Т");
if (!__iterable__2 || typeof __iterable__2[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 359 + ")");
}
const __prev__2 = context.__variables__.get("мСтрока");
try {
  for (const __item__2 of __iterable__2) {
    context.__variables__.set("мСтрока", __item__2);
context.__variables__.get("мСтрока").Сумма = context.__variables__.get("мСтрока").Количество * context.__variables__.get("мСтрока").Цена;
context.__variables__.set("мСумма", __dsl_add__(context.__variables__.get("мСумма"), context.__variables__.get("мСтрока").Сумма));
  }
} finally {
  if (__prev__2 === undefined) {
    context.__variables__.delete("мСтрока");
  } else {
    context.__variables__.set("мСтрока", __prev__2);
  }
}
context.__variables__.set("КолонкаСумма", context.__variables__.get("Т").Колонки.Сумма);
ПроверитьРавенство(context.__variables__.get("Т").Итог("Сумма"), context.__variables__.get("мСумма"));
ПроверитьРавенство(context.__variables__.get("Т").Итог(2), context.__variables__.get("мСумма"));
ПроверитьРавенство(context.__variables__.get("Т").Итог(context.__variables__.get("КолонкаСумма")), context.__variables__.get("мСумма"));
context.__variables__.get("Т").Свернуть("", "Сумма");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("Т"), 0).Сумма, context.__variables__.get("мСумма"));
}
context.__functions__.set("ТестДолжен_ОтработатьСДанными", ТестДолжен_ОтработатьСДанными);
function ТестДолжен_ВыгрузитьКолонкуВМассив() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.get("Т").Колонки.Добавить("Ключ");
context.__variables__.get("Т").Колонки.Добавить("Значение");
context.__variables__.set("ЭталонКлючей", __dsl_newArray__());
context.__variables__.set("ЭталонЗначений", __dsl_newArray__());
context.__variables__.set("Сч", 1);
while (context.__variables__.get("Сч") <= 5) {
context.__variables__.set("С", context.__variables__.get("Т").Добавить());
context.__variables__.get("С").Ключ = __dsl_add__("Ключ", __dsl_string__(context.__variables__.get("Сч")));
context.__variables__.get("С").Значение = context.__variables__.get("Сч");
context.__variables__.get("ЭталонКлючей").Добавить(context.__variables__.get("С").Ключ);
context.__variables__.get("ЭталонЗначений").Добавить(context.__variables__.get("С").Значение);
  context.__variables__.set("Сч", context.__variables__.get("Сч") + 1);
}
ПроверитьИстину(МассивыИдентичны(context.__variables__.get("Т").ВыгрузитьКолонку("Ключ"), context.__variables__.get("ЭталонКлючей")), "Массивы ключей должны совпадать");
ПроверитьИстину(МассивыИдентичны(context.__variables__.get("Т").ВыгрузитьКолонку("Значение"), context.__variables__.get("ЭталонЗначений")), "Массивы значений должны совпадать");
ПроверитьИстину(МассивыИдентичны(context.__variables__.get("Т").ВыгрузитьКолонку(0), context.__variables__.get("ЭталонКлючей")), "Массивы ключей должны совпадать");
ПроверитьИстину(МассивыИдентичны(context.__variables__.get("Т").ВыгрузитьКолонку(1), context.__variables__.get("ЭталонЗначений")), "Массивы значений должны совпадать");
ПроверитьИстину(МассивыИдентичны(context.__variables__.get("Т").ВыгрузитьКолонку(context.__variables__.get("Т").Колонки.Ключ), context.__variables__.get("ЭталонКлючей")), "Массивы ключей должны совпадать");
ПроверитьИстину(МассивыИдентичны(context.__variables__.get("Т").ВыгрузитьКолонку(context.__variables__.get("Т").Колонки.Значение), context.__variables__.get("ЭталонЗначений")), "Массивы значений должны совпадать");
}
context.__functions__.set("ТестДолжен_ВыгрузитьКолонкуВМассив", ТестДолжен_ВыгрузитьКолонкуВМассив);
function МассивыИдентичны(Проверяемый, Эталон) {
  context.__variables__.set("Проверяемый", Проверяемый);
  context.__variables__.set("Эталон", Эталон);
if (context.__variables__.get("Проверяемый").Количество() !== context.__variables__.get("Эталон").Количество()) {
return false;
}
context.__variables__.set("Сч", 0);
while (context.__variables__.get("Сч") <= context.__variables__.get("Проверяемый").Количество() - 1) {
if (__dsl_index__(context.__variables__.get("Проверяемый"), context.__variables__.get("Сч")) !== __dsl_index__(context.__variables__.get("Эталон"), context.__variables__.get("Сч"))) {
return false;
}
  context.__variables__.set("Сч", context.__variables__.get("Сч") + 1);
}
return true;
}
context.__functions__.set("МассивыИдентичны", МассивыИдентичны);
function ТестДолжен_НайтиСтрокуВТаблице() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.get("Т").Колонки.Добавить("Ключ");
context.__variables__.get("Т").Колонки.Добавить("Значение");
context.__variables__.set("Сч", 1);
while (context.__variables__.get("Сч") <= 5) {
context.__variables__.set("С", context.__variables__.get("Т").Добавить());
context.__variables__.get("С").Ключ = __dsl_add__("Ключ", __dsl_string__(context.__variables__.get("Сч")));
context.__variables__.get("С").Значение = context.__variables__.get("Сч");
  context.__variables__.set("Сч", context.__variables__.get("Сч") + 1);
}
context.__variables__.set("ИскомаяСтрока", context.__variables__.get("Т").Найти("Ключ2", "Ключ"));
ПроверитьЛожь(context.__variables__.get("ИскомаяСтрока") === undefined, "Строка должна быть найдена");
ПроверитьРавенство(context.__variables__.get("ИскомаяСтрока").Значение, 2);
}
context.__functions__.set("ТестДолжен_НайтиСтрокуВТаблице", ТестДолжен_НайтиСтрокуВТаблице);
function ТестДолжен_НайтиНесколькоСтрокВТаблице() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.get("Т").Колонки.Добавить("Ключ");
context.__variables__.get("Т").Колонки.Добавить("Значение");
context.__variables__.set("Сч", 1);
while (context.__variables__.get("Сч") <= 8) {
context.__variables__.set("С", context.__variables__.get("Т").Добавить());
if (context.__variables__.get("Сч") % 2) {
context.__variables__.get("С").Ключ = "Истина";
context.__variables__.get("С").Значение = true;
}
else {
context.__variables__.get("С").Ключ = "Ложь";
context.__variables__.get("С").Значение = false;
}
  context.__variables__.set("Сч", context.__variables__.get("Сч") + 1);
}
context.__variables__.set("КлючиПоиска", __dsl_newStructure__("Ключ,Значение", "Истина", true));
context.__variables__.set("НайденныеСтроки", context.__variables__.get("Т").НайтиСтроки(context.__variables__.get("КлючиПоиска")));
ПроверитьРавенство(context.__variables__.get("НайденныеСтроки").Количество(), 4, "Количество строк должно совпадать с эталоном");
const __iterable__3 = context.__variables__.get("НайденныеСтроки");
if (!__iterable__3 || typeof __iterable__3[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 471 + ")");
}
const __prev__3 = context.__variables__.get("Стр");
try {
  for (const __item__3 of __iterable__3) {
    context.__variables__.set("Стр", __item__3);
ПроверитьРавенство(context.__variables__.get("Стр").Ключ, "Истина");
ПроверитьРавенство(context.__variables__.get("Стр").Значение, true);
  }
} finally {
  if (__prev__3 === undefined) {
    context.__variables__.delete("Стр");
  } else {
    context.__variables__.set("Стр", __prev__3);
  }
}
}
context.__functions__.set("ТестДолжен_НайтиНесколькоСтрокВТаблице", ТестДолжен_НайтиНесколькоСтрокВТаблице);
function СоздатьТаблицуСДанными() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.get("Т").Колонки.Добавить("Ключ");
context.__variables__.get("Т").Колонки.Добавить("Значение");
context.__variables__.get("Т").Колонки.Добавить("К3");
context.__variables__.set("Сч", 1);
while (context.__variables__.get("Сч") <= 5) {
context.__variables__.set("С", context.__variables__.get("Т").Добавить());
context.__variables__.get("С").Ключ = __dsl_add__("Ключ", __dsl_string__(context.__variables__.get("Сч")));
context.__variables__.get("С").Значение = context.__variables__.get("Сч");
context.__variables__.get("С").К3 = __dsl_add__("К3-", context.__variables__.get("Сч"));
  context.__variables__.set("Сч", context.__variables__.get("Сч") + 1);
}
return context.__variables__.get("Т");
}
context.__functions__.set("СоздатьТаблицуСДанными", СоздатьТаблицуСДанными);
function ТестДолжен_СкопироватьТаблицуПолностью() {
context.__variables__.set("Т", СоздатьТаблицуСДанными());
context.__variables__.set("Т2", context.__variables__.get("Т").Скопировать());
ПроверитьНеравенство(context.__variables__.get("Т"), context.__variables__.get("Т2"));
ПроверитьРавенство(context.__variables__.get("Т").Количество(), context.__variables__.get("Т2").Количество());
context.__variables__.set("Сч", 0);
while (context.__variables__.get("Сч") <= context.__variables__.get("Т").Количество() - 1) {
context.__variables__.set("С1", __dsl_index__(context.__variables__.get("Т"), context.__variables__.get("сч")));
context.__variables__.set("С2", __dsl_index__(context.__variables__.get("Т2"), context.__variables__.get("сч")));
ПроверитьРавенство(context.__variables__.get("С1").Ключ, context.__variables__.get("С2").Ключ, __dsl_add__("Равенство Ключей в строке ", context.__variables__.get("Сч")));
ПроверитьРавенство(context.__variables__.get("С1").Значение, context.__variables__.get("С2").Значение, __dsl_add__("Равенство Значений в строке ", context.__variables__.get("Сч")));
ПроверитьРавенство(context.__variables__.get("С1").К3, context.__variables__.get("С2").К3, __dsl_add__("Равенство КЗ в строке ", context.__variables__.get("Сч")));
ПроверитьНеравенство(context.__variables__.get("С1"), context.__variables__.get("С2"));
  context.__variables__.set("Сч", context.__variables__.get("Сч") + 1);
}
}
context.__functions__.set("ТестДолжен_СкопироватьТаблицуПолностью", ТестДолжен_СкопироватьТаблицуПолностью);
function ТестДолжен_СкопироватьТаблицуПоМассивуСтрок() {
context.__variables__.set("Т", СоздатьТаблицуСДанными());
context.__variables__.set("МассивСтрок", __dsl_newArray__());
context.__variables__.get("МассивСтрок").Добавить(__dsl_index__(context.__variables__.get("Т"), 0));
context.__variables__.get("МассивСтрок").Добавить(__dsl_index__(context.__variables__.get("Т"), 2));
context.__variables__.set("Т2", context.__variables__.get("Т").Скопировать(context.__variables__.get("МассивСтрок")));
ПроверитьНеравенство(context.__variables__.get("Т"), context.__variables__.get("Т2"));
ПроверитьРавенство(2, context.__variables__.get("Т2").Количество());
context.__variables__.set("Сч", 0);
while (context.__variables__.get("Сч") <= context.__variables__.get("Т2").Количество() - 1) {
context.__variables__.set("С1", __dsl_index__(context.__variables__.get("МассивСтрок"), context.__variables__.get("сч")));
context.__variables__.set("С2", __dsl_index__(context.__variables__.get("Т2"), context.__variables__.get("сч")));
ПроверитьРавенство(context.__variables__.get("С1").Ключ, context.__variables__.get("С2").Ключ, __dsl_add__("Равенство Ключей в строке ", context.__variables__.get("Сч")));
ПроверитьРавенство(context.__variables__.get("С1").Значение, context.__variables__.get("С2").Значение, __dsl_add__("Равенство Значений в строке ", context.__variables__.get("Сч")));
ПроверитьРавенство(context.__variables__.get("С1").К3, context.__variables__.get("С2").К3, __dsl_add__("Равенство КЗ в строке ", context.__variables__.get("Сч")));
ПроверитьНеравенство(context.__variables__.get("С1"), context.__variables__.get("С2"));
  context.__variables__.set("Сч", context.__variables__.get("Сч") + 1);
}
}
context.__functions__.set("ТестДолжен_СкопироватьТаблицуПоМассивуСтрок", ТестДолжен_СкопироватьТаблицуПоМассивуСтрок);
function ТестДолжен_СкопироватьТаблицуНесколькоКолонок() {
context.__variables__.set("Т", СоздатьТаблицуСДанными());
context.__variables__.set("МассивСтрок", __dsl_newArray__());
context.__variables__.get("МассивСтрок").Добавить(__dsl_index__(context.__variables__.get("Т"), 0));
context.__variables__.get("МассивСтрок").Добавить(__dsl_index__(context.__variables__.get("Т"), 2));
context.__variables__.set("Т2", context.__variables__.get("Т").Скопировать(context.__variables__.get("МассивСтрок"), "Ключ, Значение"));
ПроверитьНеравенство(context.__variables__.get("Т"), context.__variables__.get("Т2"));
ПроверитьРавенство(2, context.__variables__.get("Т2").Количество());
ПроверитьРавенство(2, context.__variables__.get("Т2").Колонки.Количество());
context.__variables__.set("Сч", 0);
while (context.__variables__.get("Сч") <= context.__variables__.get("Т2").Количество() - 1) {
context.__variables__.set("С1", __dsl_index__(context.__variables__.get("МассивСтрок"), context.__variables__.get("сч")));
context.__variables__.set("С2", __dsl_index__(context.__variables__.get("Т2"), context.__variables__.get("сч")));
ПроверитьРавенство(context.__variables__.get("С1").Ключ, context.__variables__.get("С2").Ключ, __dsl_add__("Равенство Ключей в строке ", context.__variables__.get("Сч")));
ПроверитьРавенство(context.__variables__.get("С1").Значение, context.__variables__.get("С2").Значение, __dsl_add__("Равенство Значений в строке ", context.__variables__.get("Сч")));
ПроверитьНеравенство(context.__variables__.get("С1"), context.__variables__.get("С2"));
  context.__variables__.set("Сч", context.__variables__.get("Сч") + 1);
}
}
context.__functions__.set("ТестДолжен_СкопироватьТаблицуНесколькоКолонок", ТестДолжен_СкопироватьТаблицуНесколькоКолонок);
function ТестДолжен_СкопироватьТаблицуПоОтбору() {
context.__variables__.set("Т", СоздатьТаблицуСДанными());
context.__variables__.get("Т").Добавить().Значение = 4;
context.__variables__.set("Отбор", __dsl_newStructure__("Значение", 4));
context.__variables__.set("Т2", context.__variables__.get("Т").Скопировать(context.__variables__.get("Отбор"), "Ключ"));
ПроверитьНеравенство(context.__variables__.get("Т"), context.__variables__.get("Т2"));
ПроверитьРавенство(2, context.__variables__.get("Т2").Количество());
ПроверитьРавенство(1, context.__variables__.get("Т2").Колонки.Количество());
ПроверитьРавенство("Ключ4", __dsl_index__(context.__variables__.get("Т2"), 0).Ключ);
ПроверитьРавенство(undefined, __dsl_index__(context.__variables__.get("Т2"), 1).Ключ);
}
context.__functions__.set("ТестДолжен_СкопироватьТаблицуПоОтбору", ТестДолжен_СкопироватьТаблицуПоОтбору);
function ТестДолжен_ПроверитьИсключениеПриКопированииТаблицыПоМассивуСтрок() {
context.__variables__.set("Т", СоздатьТаблицуСДанными());
context.__variables__.set("Т0", __dsl_newValueTable__());
context.__variables__.get("Т0").Колонки.Добавить("Тест");
context.__variables__.get("Т0").Добавить().Тест = 1;
context.__variables__.set("МассивСтрок", __dsl_newArray__());
context.__variables__.get("МассивСтрок").Добавить(__dsl_index__(context.__variables__.get("Т0"), 0));
context.__lastException__ = null;
try {
context.__variables__.set("Т2", context.__variables__.get("Т").Скопировать(context.__variables__.get("МассивСтрок")));
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
return;
}
throw new __dsl_RuntimeError__("Ожидали исключение, но его не было", 597);
}
context.__functions__.set("ТестДолжен_ПроверитьИсключениеПриКопированииТаблицыПоМассивуСтрок", ТестДолжен_ПроверитьИсключениеПриКопированииТаблицыПоМассивуСтрок);
function ТестДолжен_ПроверитьСверткуБезУказанияКолонок() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.get("Т").Колонки.Добавить("Колонка1");
context.__variables__.get("Т").Добавить().Колонка1 = "Значение1";
context.__variables__.get("Т").Добавить().Колонка1 = "Значение2";
context.__variables__.get("Т").Добавить().Колонка1 = "Значение1";
context.__variables__.get("Т").Добавить().Колонка1 = "Значение2";
context.__variables__.get("Т").Свернуть("Колонка1");
context.__variables__.get("Т").Сортировать("Колонка1");
ПроверитьРавенство(context.__variables__.get("Т").Количество(), 2, "После свёртки должно остаться 2 строки");
ПроверитьРавенство(context.__variables__.get("Т").Получить(0).Колонка1, "Значение1", "Свёртка по значениям");
ПроверитьРавенство(context.__variables__.get("Т").Получить(1).Колонка1, "Значение2", "Свёртка по значениям");
}
context.__functions__.set("ТестДолжен_ПроверитьСверткуБезУказанияКолонок", ТестДолжен_ПроверитьСверткуБезУказанияКолонок);
function ТестДолжен_ЗагрузитьКолонку() {
context.__variables__.set("Т", __dsl_newValueTable__());
context.__variables__.get("Т").Колонки.Добавить("Количество1");
context.__variables__.get("Т").Колонки.Добавить("Количество2");
context.__variables__.get("Т").Колонки.Добавить("Количество3");
context.__variables__.set("Инд", 1);
while (context.__variables__.get("Инд") <= 5) {
context.__variables__.set("НоваяСтрока", context.__variables__.get("Т").Добавить());
  context.__variables__.set("Инд", context.__variables__.get("Инд") + 1);
}
context.__variables__.set("Количество", __dsl_newArray__());
context.__variables__.get("Количество").Добавить(1);
context.__variables__.get("Количество").Добавить(2);
context.__variables__.get("Количество").Добавить(3);
context.__variables__.get("Количество").Добавить(4);
context.__variables__.get("Количество").Добавить(5);
context.__variables__.get("Т").ЗагрузитьКолонку(context.__variables__.get("Количество"), "Количество1");
context.__variables__.get("Т").ЗагрузитьКолонку(context.__variables__.get("Количество"), 1);
context.__variables__.get("Т").ЗагрузитьКолонку(context.__variables__.get("Количество"), context.__variables__.get("Т").Колонки.Количество3);
ПроверитьРавенство(context.__variables__.get("Т").Итог("Количество1"), 15);
ПроверитьРавенство(context.__variables__.get("Т").Итог("Количество2"), 15);
ПроверитьРавенство(context.__variables__.get("Т").Итог("Количество3"), 15);
}
context.__functions__.set("ТестДолжен_ЗагрузитьКолонку", ТестДолжен_ЗагрузитьКолонку);
function ТестДолжен_ПроверитьТипизациюКолонки() {
context.__variables__.set("Таблица", __dsl_newValueTable__());
context.__variables__.get("Таблица").Колонки.Добавить("Колонка1", __dsl_newTypeDescription__("Строка", undefined, __dsl_newStringQualifiers__(10)));
context.__variables__.set("СтрокаТаблицы", context.__variables__.get("Таблица").Добавить());
context.__variables__.get("СтрокаТаблицы").Колонка1 = 1;
ПроверитьРавенство(context.__variables__.get("СтрокаТаблицы").Колонка1, "1");
context.__variables__.get("СтрокаТаблицы").Колонка1 = undefined;
ПроверитьРавенство(context.__variables__.get("СтрокаТаблицы").Колонка1, "", "Неопределено - Пустая строка");
context.__variables__.get("Таблица").Колонки.Добавить("Колонка2", __dsl_newTypeDescription__("Строка,Число"));
context.__variables__.get("СтрокаТаблицы").Колонка2 = 1;
ПроверитьРавенство(context.__variables__.get("СтрокаТаблицы").Колонка2, 1);
context.__variables__.get("СтрокаТаблицы").Колонка2 = "ъ";
ПроверитьРавенство(context.__variables__.get("СтрокаТаблицы").Колонка2, "ъ");
context.__variables__.get("СтрокаТаблицы").Колонка2 = undefined;
ПроверитьРавенство(context.__variables__.get("СтрокаТаблицы").Колонка2, undefined);
}
context.__functions__.set("ТестДолжен_ПроверитьТипизациюКолонки", ТестДолжен_ПроверитьТипизациюКолонки);
function ТестовыеДанные() {
return __dsl_add__(__dsl_add__(__dsl_add__(__dsl_add__(__dsl_add__(__dsl_add__(__dsl_add__("135,29,91,60,30,120,61,31,92,121,130,131,133,8,9,10,11,134,13,14,15,16,5,", "62,32,132,7,8,63,10,11,64,33,93,122,5,6,7,8,12,65,34,94,123,5,6,7,8,13,66,35,95,4,5,"), "6,7,8,14,96,67,36,4,5,15,68,37,97,4,5,6,9,17,124,69,38,98,4,5,6,19,70,39,99,4,5,6,7,"), "20,71,40,100,4,5,6,21,72,41,22,23,73,42,24,74,43,101,25,75,102,44,4,5,6,26,114,128,"), "-1,45,103,76,46,4,77,47,104,4,5,6,7,8,9,10,11,12,13,14,15,16,5,78,48,6,7,8,79,10,11,"), "80,49,105,4,5,6,7,8,12,81,50,106,4,5,6,7,8,13,82,51,107,4,5,6,7,8,14,108,83,52,4,5,"), "15,84,53,109,4,5,6,9,17,125,85,54,110,4,5,6,19,86,55,111,4,5,6,7,20,87,56,112,4,5,6,"), "21,88,57,22,23,89,58,24,90,59,113,25,1,3,2,4,5,6,26,115,129");
}
context.__functions__.set("ТестовыеДанные", ТестовыеДанные);
function ТестоваяТаблица() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Значение1");
context.__variables__.get("ТЗ").Колонки.Добавить("Значение2");
context.__variables__.get("ТЗ").Колонки.Добавить("Количество1");
context.__variables__.get("ТЗ").Колонки.Добавить("Количество2");
return context.__variables__.get("ТЗ");
}
context.__functions__.set("ТестоваяТаблица", ТестоваяТаблица);
function ТестДолжен_ПроверитьСверткуБольшойТаблицы() {
context.__variables__.set("Строка", ТестовыеДанные());
context.__variables__.set("ТЗ", ТестоваяТаблица());
const __iterable__4 = __dsl_strSplit__(context.__variables__.get("Строка"), ",");
if (!__iterable__4 || typeof __iterable__4[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 714 + ")");
}
const __prev__4 = context.__variables__.get("Элемент");
try {
  for (const __item__4 of __iterable__4) {
    context.__variables__.set("Элемент", __item__4);
context.__variables__.set("СтрТЗ", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("СтрТЗ").Значение1 = __dsl_trim__(context.__variables__.get("Элемент"));
context.__variables__.get("СтрТЗ").Количество1 = 1;
  }
} finally {
  if (__prev__4 === undefined) {
    context.__variables__.delete("Элемент");
  } else {
    context.__variables__.set("Элемент", __prev__4);
  }
}
context.__variables__.get("ТЗ").Свернуть("Значение1", "Количество1");
ПроверитьРавенство(context.__variables__.get("ТЗ").Количество(), 127, "Количество строк после свёртки");
ПроверитьРавенство(context.__variables__.get("ТЗ").Колонки.Количество(), 2, "Количество колонок после свёртки");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "53", 1);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "12", 3);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "4", 18);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "8", 10);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "6", 18);
}
context.__functions__.set("ТестДолжен_ПроверитьСверткуБольшойТаблицы", ТестДолжен_ПроверитьСверткуБольшойТаблицы);
function ТестДолжен_ПроверитьСверткуБольшойТаблицы2() {
context.__variables__.set("Строка", ТестовыеДанные());
context.__variables__.set("ТЗ", ТестоваяТаблица());
const __iterable__5 = __dsl_strSplit__(context.__variables__.get("Строка"), ",");
if (!__iterable__5 || typeof __iterable__5[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 738 + ")");
}
const __prev__5 = context.__variables__.get("Элемент");
try {
  for (const __item__5 of __iterable__5) {
    context.__variables__.set("Элемент", __item__5);
context.__variables__.set("СтрТЗ", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("СтрТЗ").Значение1 = __dsl_trim__(context.__variables__.get("Элемент"));
context.__variables__.get("СтрТЗ").Значение2 = __dsl_trim__(context.__variables__.get("Элемент"));
context.__variables__.get("СтрТЗ").Количество1 = 1;
  }
} finally {
  if (__prev__5 === undefined) {
    context.__variables__.delete("Элемент");
  } else {
    context.__variables__.set("Элемент", __prev__5);
  }
}
context.__variables__.set("ТЗ2", context.__variables__.get("ТЗ").Скопировать(undefined, "Значение1, Количество1"));
context.__variables__.get("ТЗ2").Свернуть("Значение1", "Количество1");
context.__variables__.get("ТЗ").Свернуть("Значение1, Значение2", "Количество1");
ПроверитьРавенство(context.__variables__.get("ТЗ").Количество(), 127, "Количество строк после свёртки");
ПроверитьРавенство(context.__variables__.get("ТЗ").Колонки.Количество(), 3, "Количество колонок после свёртки");
const __iterable__6 = context.__variables__.get("ТЗ");
if (!__iterable__6 || typeof __iterable__6[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 752 + ")");
}
const __prev__6 = context.__variables__.get("Стр");
try {
  for (const __item__6 of __iterable__6) {
    context.__variables__.set("Стр", __item__6);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ2"), context.__variables__.get("Стр").Значение1, context.__variables__.get("Стр").Количество1);
  }
} finally {
  if (__prev__6 === undefined) {
    context.__variables__.delete("Стр");
  } else {
    context.__variables__.set("Стр", __prev__6);
  }
}
}
context.__functions__.set("ТестДолжен_ПроверитьСверткуБольшойТаблицы2", ТестДолжен_ПроверитьСверткуБольшойТаблицы2);
function ТестДолжен_ПроверитьСверткуПоДвумКолонкам() {
context.__variables__.set("Строка", ТестовыеДанные());
context.__variables__.set("ТЗ", ТестоваяТаблица());
context.__variables__.set("Сч", 0);
const __iterable__7 = __dsl_strSplit__(context.__variables__.get("Строка"), ",");
if (!__iterable__7 || typeof __iterable__7[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 764 + ")");
}
const __prev__7 = context.__variables__.get("Элемент");
try {
  for (const __item__7 of __iterable__7) {
    context.__variables__.set("Элемент", __item__7);
context.__variables__.set("СтрТЗ", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("СтрТЗ").Значение1 = __dsl_trim__(context.__variables__.get("Элемент"));
context.__variables__.get("СтрТЗ").Значение2 = context.__variables__.get("Сч");
context.__variables__.get("СтрТЗ").Количество1 = 1;
context.__variables__.set("Сч", (__dsl_add__(context.__variables__.get("Сч"), 1)) % 3);
  }
} finally {
  if (__prev__7 === undefined) {
    context.__variables__.delete("Элемент");
  } else {
    context.__variables__.set("Элемент", __prev__7);
  }
}
context.__variables__.get("ТЗ").Свернуть("Значение1,Значение2", "Количество1");
ПроверитьРавенство(context.__variables__.get("ТЗ").Количество(), 159, "Количество строк после свёртки");
ПроверитьРавенство(context.__variables__.get("ТЗ").Колонки.Количество(), 3, "Количество колонок после свёртки");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "12", 2);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "4", 7);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "8", 2);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "6", 8);
}
context.__functions__.set("ТестДолжен_ПроверитьСверткуПоДвумКолонкам", ТестДолжен_ПроверитьСверткуПоДвумКолонкам);
function ТестДолжен_ПроверитьСверткуПоДвумКолонкамСРазнымиТипами() {
context.__variables__.set("Строка", ТестовыеДанные());
context.__variables__.set("ТЗ", ТестоваяТаблица());
context.__variables__.set("Сч", 0);
const __iterable__8 = __dsl_strSplit__(context.__variables__.get("Строка"), ",");
if (!__iterable__8 || typeof __iterable__8[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 790 + ")");
}
const __prev__8 = context.__variables__.get("Элемент");
try {
  for (const __item__8 of __iterable__8) {
    context.__variables__.set("Элемент", __item__8);
context.__variables__.set("СтрТЗ", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("СтрТЗ").Значение1 = __dsl_trim__(context.__variables__.get("Элемент"));
context.__variables__.get("СтрТЗ").Значение2 = (context.__variables__.get("Сч") === 0 ? context.__variables__.get("Элемент") : new Date(20200511, 0, 1, 0, 0, 0));
context.__variables__.get("СтрТЗ").Количество1 = 1;
context.__variables__.set("Сч", (__dsl_add__(context.__variables__.get("Сч"), 1)) % 2);
  }
} finally {
  if (__prev__8 === undefined) {
    context.__variables__.delete("Элемент");
  } else {
    context.__variables__.set("Элемент", __prev__8);
  }
}
context.__variables__.get("ТЗ").Свернуть("Значение1,Значение2", "Количество1");
ПроверитьРавенство(context.__variables__.get("ТЗ").Количество(), 149, "Количество строк после свёртки");
ПроверитьРавенство(context.__variables__.get("ТЗ").Колонки.Количество(), 3, "Количество колонок после свёртки");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "12", 1);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "4", 10);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "8", 5);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "6", 10);
}
context.__functions__.set("ТестДолжен_ПроверитьСверткуПоДвумКолонкамСРазнымиТипами", ТестДолжен_ПроверитьСверткуПоДвумКолонкамСРазнымиТипами);
function ТестДолжен_ПроверитьСверткуПоКолонкамСуммированияСРазнымиТипами() {
context.__variables__.set("Строка", ТестовыеДанные());
context.__variables__.set("ТЗ", ТестоваяТаблица());
context.__variables__.set("Сч", 0);
const __iterable__9 = __dsl_strSplit__(context.__variables__.get("Строка"), ",");
if (!__iterable__9 || typeof __iterable__9[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 816 + ")");
}
const __prev__9 = context.__variables__.get("Элемент");
try {
  for (const __item__9 of __iterable__9) {
    context.__variables__.set("Элемент", __item__9);
context.__variables__.set("СтрТЗ", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("СтрТЗ").Значение1 = __dsl_trim__(context.__variables__.get("Элемент"));
context.__variables__.get("СтрТЗ").Количество1 = 1;
context.__variables__.get("СтрТЗ").Количество2 = (context.__variables__.get("Сч") === 0 ? 1 : new Date(20200511, 0, 1, 0, 0, 0));
context.__variables__.set("Сч", (__dsl_add__(context.__variables__.get("Сч"), 1)) % 2);
  }
} finally {
  if (__prev__9 === undefined) {
    context.__variables__.delete("Элемент");
  } else {
    context.__variables__.set("Элемент", __prev__9);
  }
}
context.__variables__.get("ТЗ").Свернуть("Значение1", "Количество1,Количество2");
ПроверитьРавенство(context.__variables__.get("ТЗ").Количество(), 127, "Количество строк после свёртки");
ПроверитьРавенство(context.__variables__.get("ТЗ").Колонки.Количество(), 3, "Количество колонок после свёртки");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "12", 3, "Количество1");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "12", 2, "Количество2");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "4", 18, "Количество1");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "4", 10, "Количество2");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "8", 10, "Количество1");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "8", 5, "Количество2");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "6", 18, "Количество1");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "6", 10, "Количество2");
}
context.__functions__.set("ТестДолжен_ПроверитьСверткуПоКолонкамСуммированияСРазнымиТипами", ТестДолжен_ПроверитьСверткуПоКолонкамСуммированияСРазнымиТипами);
function ТестДолжен_ПроверитьСверткуПоОднойКолонкеСРазнымиТипами() {
context.__variables__.set("Строка", ТестовыеДанные());
context.__variables__.set("ТЗ", ТестоваяТаблица());
context.__variables__.set("Сч", 0);
const __iterable__10 = __dsl_strSplit__(context.__variables__.get("Строка"), ",");
if (!__iterable__10 || typeof __iterable__10[Symbol.iterator] !== 'function') {
  throw new Error("Значение не поддерживает итерацию (строка " + 846 + ")");
}
const __prev__10 = context.__variables__.get("Элемент");
try {
  for (const __item__10 of __iterable__10) {
    context.__variables__.set("Элемент", __item__10);
context.__variables__.set("СтрТЗ", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("СтрТЗ").Значение1 = (context.__variables__.get("Сч") === 0 ? __dsl_number__(context.__variables__.get("Элемент")) : __dsl_trim__(context.__variables__.get("Элемент")));
context.__variables__.get("СтрТЗ").Количество1 = 1;
context.__variables__.set("Сч", (__dsl_add__(context.__variables__.get("Сч"), 1)) % 2);
  }
} finally {
  if (__prev__10 === undefined) {
    context.__variables__.delete("Элемент");
  } else {
    context.__variables__.set("Элемент", __prev__10);
  }
}
context.__variables__.get("ТЗ").Свернуть("Значение1", "Количество1");
ПроверитьРавенство(context.__variables__.get("ТЗ").Количество(), 149, "Количество строк после свёртки");
ПроверитьРавенство(context.__variables__.get("ТЗ").Колонки.Количество(), 2, "Количество колонок после свёртки");
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "12", 1);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), 12, 2);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "4", 8);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), 4, 10);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "8", 5);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), 8, 5);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), "6", 8);
ПроверитьВТаблицеКоличествоДляЗначения1(context.__variables__.get("ТЗ"), 6, 10);
}
context.__functions__.set("ТестДолжен_ПроверитьСверткуПоОднойКолонкеСРазнымиТипами", ТестДолжен_ПроверитьСверткуПоОднойКолонкеСРазнымиТипами);
function ПроверитьВТаблицеКоличествоДляЗначения1(Таблица, Значение, Количество, КолонкаСуммы = "Количество1") {
  context.__variables__.set("Таблица", Таблица);
  context.__variables__.set("Значение", Значение);
  context.__variables__.set("Количество", Количество);
  context.__variables__.set("КолонкаСуммы", КолонкаСуммы);
context.__variables__.set("СтрТЗ2", context.__variables__.get("Таблица").Найти(context.__variables__.get("Значение"), "Значение1"));
ПроверитьРавенство(__dsl_index__(context.__variables__.get("СтрТЗ2"), context.__variables__.get("КолонкаСуммы")), context.__variables__.get("Количество"), __dsl_strTemplate__("Сумма колонки %1 для значения %2 типа %3", context.__variables__.get("КолонкаСуммы"), context.__variables__.get("Значение"), __dsl_typeOf__(context.__variables__.get("Значение"))));
}
context.__functions__.set("ПроверитьВТаблицеКоличествоДляЗначения1", ПроверитьВТаблицеКоличествоДляЗначения1);
function ТестДолжен_ПроверитьСортировку_Чисел() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = 5;
context.__variables__.get("ТЗ").Добавить().Тест = 10;
context.__variables__.get("ТЗ").Добавить().Тест = -(2);
context.__variables__.get("ТЗ").Сортировать("Тест");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 0).Тест, -(2), "ТЗ[0]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 1).Тест, 5, "ТЗ[1]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 2).Тест, 10, "ТЗ[2]");
}
context.__functions__.set("ТестДолжен_ПроверитьСортировку_Чисел", ТестДолжен_ПроверитьСортировку_Чисел);
function ТестДолжен_ПроверитьСортировку_Булевых() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = true;
context.__variables__.get("ТЗ").Добавить().Тест = false;
context.__variables__.get("ТЗ").Добавить().Тест = true;
context.__variables__.get("ТЗ").Сортировать("Тест");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 0).Тест, false, "ТЗ[0]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 1).Тест, true, "ТЗ[1]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 2).Тест, true, "ТЗ[2]");
}
context.__functions__.set("ТестДолжен_ПроверитьСортировку_Булевых", ТестДолжен_ПроверитьСортировку_Булевых);
function ТестДолжен_ПроверитьСортировку_Дат() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.set("Сегодня", __dsl_currentDate__());
context.__variables__.set("Пустая", new Date(1, 0, 1, 0, 0, 0));
context.__variables__.get("ТЗ").Добавить().Тест = context.__variables__.get("Сегодня");
context.__variables__.get("ТЗ").Добавить().Тест = __dsl_add__(context.__variables__.get("Сегодня"), 2);
context.__variables__.get("ТЗ").Добавить().Тест = context.__variables__.get("Сегодня") - 2;
context.__variables__.get("ТЗ").Добавить().Тест = context.__variables__.get("Пустая");
context.__variables__.get("ТЗ").Сортировать("Тест");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 0).Тест, context.__variables__.get("Пустая"), "ТЗ[0]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 1).Тест, context.__variables__.get("Сегодня") - 2, "ТЗ[1]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 2).Тест, context.__variables__.get("Сегодня"), "ТЗ[2]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 3).Тест, __dsl_add__(context.__variables__.get("Сегодня"), 2), "ТЗ[3]");
}
context.__functions__.set("ТестДолжен_ПроверитьСортировку_Дат", ТестДолжен_ПроверитьСортировку_Дат);
function ТестДолжен_ПроверитьСортировку_Строк() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = "Ели";
context.__variables__.get("ТЗ").Добавить().Тест = "ежи";
context.__variables__.get("ТЗ").Добавить().Тест = "Ёлки";
context.__variables__.get("ТЗ").Добавить().Тест = "ёжики";
context.__variables__.get("ТЗ").Сортировать("Тест");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 0).Тест, "ежи", "ТЗ[0]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 1).Тест, "ёжики", "ТЗ[1]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 2).Тест, "Ели", "ТЗ[2]");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 3).Тест, "Ёлки", "ТЗ[3]");
}
context.__functions__.set("ТестДолжен_ПроверитьСортировку_Строк", ТестДолжен_ПроверитьСортировку_Строк);
function ТестДолжен_ПроверитьСортировкуНеупорядочиваемыхТипов() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = undefined;
context.__variables__.get("ТЗ").Добавить().Тест = undefined;
context.__variables__.get("ТЗ").Сортировать("Тест");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 0).Тест, undefined);
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 1).Тест, undefined);
}
context.__functions__.set("ТестДолжен_ПроверитьСортировкуНеупорядочиваемыхТипов", ТестДолжен_ПроверитьСортировкуНеупорядочиваемыхТипов);
function ТестДолжен_ПроверитьСортировкуРазныхТипов() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = __dsl_type__("Строка");
context.__variables__.get("ТЗ").Добавить().Тест = "Стр2";
context.__variables__.get("ТЗ").Добавить().Тест = "СтрЪ";
context.__variables__.get("ТЗ").Добавить().Тест = __dsl_newStructure__();
context.__variables__.get("ТЗ").Добавить().Тест = __dsl_newArray__();
context.__variables__.get("ТЗ").Добавить().Тест = context.__variables__.get("null");
context.__variables__.get("ТЗ").Добавить().Тест = __dsl_type__("Булево");
context.__variables__.get("ТЗ").Добавить().Тест = __dsl_type__("Массив");
context.__variables__.get("ТЗ").Сортировать("Тест");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 0).Тест, null);
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 1).Тест, "Стр2");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 2).Тест, "СтрЪ");
ПроверитьРавенство(__dsl_typeOf__(__dsl_index__(context.__variables__.get("ТЗ"), 3).Тест), __dsl_type__("Массив"));
ПроверитьРавенство(__dsl_typeOf__(__dsl_index__(context.__variables__.get("ТЗ"), 4).Тест), __dsl_type__("Структура"));
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 5).Тест, __dsl_type__("Булево"));
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 6).Тест, __dsl_type__("Массив"));
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 7).Тест, __dsl_type__("Строка"));
}
context.__functions__.set("ТестДолжен_ПроверитьСортировкуРазныхТипов", ТестДолжен_ПроверитьСортировкуРазныхТипов);
function ТестДолжен_ПроверитьСортировкуПоПредставлению() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.set("ТекстКласса", "Процедура ОбработкаПолученияПредставления(Представление, СтандартнаяОбработка)\r\n\tСтандартнаяОбработка = Ложь;\r\n\tПредставление = \"Представление0\";\r\nКонецПроцедуры");
context.__variables__.set("КлассИзСтроки0", ЗагрузитьСценарийИзСтроки(context.__variables__.get("ТекстКласса")));
context.__variables__.set("ТекстКласса", "Процедура ОбработкаПолученияПредставления(Представление, СтандартнаяОбработка)\r\n\tСтандартнаяОбработка = Ложь;\r\n\tПредставление = \"Представление1\";\r\nКонецПроцедуры");
context.__variables__.set("КлассИзСтроки1", ЗагрузитьСценарийИзСтроки(context.__variables__.get("ТекстКласса")));
context.__variables__.set("ТекстКласса", "Процедура ОбработкаПолученияПредставления(Представление, СтандартнаяОбработка)\r\n\tСтандартнаяОбработка = Ложь;\r\n\tПредставление = \"Представление3\";\r\nКонецПроцедуры");
context.__variables__.set("КлассИзСтроки3", ЗагрузитьСценарийИзСтроки(context.__variables__.get("ТекстКласса")));
context.__variables__.get("ТЗ").Добавить().Тест = context.__variables__.get("КлассИзСтроки3");
context.__variables__.get("ТЗ").Добавить().Тест = "Представление2";
context.__variables__.get("ТЗ").Добавить().Тест = context.__variables__.get("КлассИзСтроки0");
context.__variables__.get("ТЗ").Добавить().Тест = context.__variables__.get("КлассИзСтроки1");
context.__variables__.get("ТЗ").Сортировать("Тест");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 0).Тест, "Представление2", "строка");
ПроверитьРавенство(__dsl_string__(__dsl_index__(context.__variables__.get("ТЗ"), 1).Тест), "Представление0", "сценарий 0");
ПроверитьРавенство(__dsl_string__(__dsl_index__(context.__variables__.get("ТЗ"), 2).Тест), "Представление1", "сценарий 1");
ПроверитьРавенство(__dsl_string__(__dsl_index__(context.__variables__.get("ТЗ"), 3).Тест), "Представление3", "сценарий 3");
}
context.__functions__.set("ТестДолжен_ПроверитьСортировкуПоПредставлению", ТестДолжен_ПроверитьСортировкуПоПредставлению);
function ТестДолжен_ПроверитьСортировку_СтрокРазныхАлфавитов() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = "Е";
context.__variables__.get("ТЗ").Добавить().Тест = "E";
context.__variables__.get("ТЗ").Добавить().Тест = "Ε";
context.__variables__.get("ТЗ").Добавить().Тест = "∃";
context.__variables__.get("ТЗ").Добавить().Тест = "Ｅ";
context.__variables__.get("ТЗ").Сортировать("Тест");
ПроверитьРавенство(__dsl_charCode__(__dsl_index__(context.__variables__.get("ТЗ"), 0).Тест, 1), 8707, "math");
ПроверитьРавенство(__dsl_charCode__(__dsl_index__(context.__variables__.get("ТЗ"), 1).Тест, 1), 69, "latin");
ПроверитьРавенство(__dsl_charCode__(__dsl_index__(context.__variables__.get("ТЗ"), 2).Тест, 1), 65317, "full-width");
ПроверитьРавенство(__dsl_charCode__(__dsl_index__(context.__variables__.get("ТЗ"), 3).Тест, 1), 917, "greek");
ПроверитьРавенство(__dsl_charCode__(__dsl_index__(context.__variables__.get("ТЗ"), 4).Тест, 1), 1045, "cyrillic");
}
context.__functions__.set("ТестДолжен_ПроверитьСортировку_СтрокРазныхАлфавитов", ТестДолжен_ПроверитьСортировку_СтрокРазныхАлфавитов);
function ТестДолжен_ПроверитьВставкуВнеРазмераТаблицы() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = -(1);
context.__variables__.get("ТЗ").Вставить(8).Тест = -(2);
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 1).Тест, -(2));
}
context.__functions__.set("ТестДолжен_ПроверитьВставкуВнеРазмераТаблицы", ТестДолжен_ПроверитьВставкуВнеРазмераТаблицы);
function ТестДолжен_ПроверитьИсключениеПриЗагрузкеКолонки() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__lastException__ = null;
try {
context.__variables__.get("ТЗ").ЗагрузитьКолонку(8, "Тест");
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
ПроверитьРавенство(__dsl_strFind__(__dsl_errorInfo__(context).Описание, "NullReferenceException"), 0, "NRE");
return;
}
throw new __dsl_RuntimeError__("Ожидали исключение, но его не было", 1070);
}
context.__functions__.set("ТестДолжен_ПроверитьИсключениеПриЗагрузкеКолонки", ТестДолжен_ПроверитьИсключениеПриЗагрузкеКолонки);
function ТестДолжен_ПроверитьИсключениеПриНеверномПараметреСортировки() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = 1;
context.__variables__.get("ТЗ").Добавить().Тест = 2;
context.__lastException__ = null;
try {
context.__variables__.get("ТЗ").Сортировать("Тест УБЫВ и_лишнее_через_пробел");
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
return;
}
throw new __dsl_RuntimeError__("Ожидали исключение, но его не было", 1086);
}
context.__functions__.set("ТестДолжен_ПроверитьИсключениеПриНеверномПараметреСортировки", ТестДолжен_ПроверитьИсключениеПриНеверномПараметреСортировки);
function ТестДолжен_ПроверитьСортировкуСЛишнимиПробеламиВПараметрах() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Колонки.Добавить("Тест2");
context.__variables__.get("ТЗ").Добавить().Тест = 1;
context.__variables__.get("ТЗ").Добавить().Тест2 = 2;
context.__variables__.get("ТЗ").Сортировать("   Тест   УБЫВ   , Тест2   ВОЗР   ");
}
context.__functions__.set("ТестДолжен_ПроверитьСортировкуСЛишнимиПробеламиВПараметрах", ТестДолжен_ПроверитьСортировкуСЛишнимиПробеламиВПараметрах);
function ТестДолжен_Проверить_ЗаполнитьЗначения_СПустымСпискомКолонок() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = 1;
context.__variables__.get("ТЗ").ЗаполнитьЗначения(3, "");
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ"), 0).Тест, 3);
}
context.__functions__.set("ТестДолжен_Проверить_ЗаполнитьЗначения_СПустымСпискомКолонок", ТестДолжен_Проверить_ЗаполнитьЗначения_СПустымСпискомКолонок);
function ТестДолжен_Проверить_Найти_СПустымСпискомКолонок() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = -(3);
context.__variables__.get("ТЗ").Добавить().Тест = 7;
context.__variables__.set("Рез", context.__variables__.get("ТЗ").Найти(7, ""));
ПроверитьНеравенство(context.__variables__.get("Рез"), undefined);
}
context.__functions__.set("ТестДолжен_Проверить_Найти_СПустымСпискомКолонок", ТестДолжен_Проверить_Найти_СПустымСпискомКолонок);
function ТестДолжен_Проверить_СкопироватьКолонки_СПустымСпискомКолонок() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = 1;
context.__variables__.set("ТЗ2", context.__variables__.get("ТЗ").СкопироватьКолонки());
ПроверитьРавенство(context.__variables__.get("ТЗ2").Колонки.Количество(), 1);
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ2").Колонки, 0).Имя, "Тест");
}
context.__functions__.set("ТестДолжен_Проверить_СкопироватьКолонки_СПустымСпискомКолонок", ТестДолжен_Проверить_СкопироватьКолонки_СПустымСпискомКолонок);
function ТестДолжен_Проверить_Скопировать_СПустымСпискомКолонок() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = 1;
context.__variables__.get("ТЗ").Добавить().Тест = 2;
context.__variables__.set("ТЗ2", context.__variables__.get("ТЗ").Скопировать(undefined, ""));
ПроверитьРавенство(context.__variables__.get("ТЗ2").Количество(), 2);
ПроверитьРавенство(context.__variables__.get("ТЗ2").Колонки.Количество(), 1);
ПроверитьРавенство(__dsl_index__(context.__variables__.get("ТЗ2").Колонки, 0).Имя, "Тест");
}
context.__functions__.set("ТестДолжен_Проверить_Скопировать_СПустымСпискомКолонок", ТестДолжен_Проверить_Скопировать_СПустымСпискомКолонок);
function ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_Строка() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест", __dsl_newTypeDescription__("Строка"));
context.__variables__.get("ТЗ").Добавить().Тест = -(3);
context.__variables__.get("ТЗ").Добавить().Тест = "7";
context.__variables__.get("ТЗ").Добавить().Тест = "ц5";
ПроверитьРавенство(context.__variables__.get("ТЗ").Итог("Тест"), 4);
}
context.__functions__.set("ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_Строка", ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_Строка);
function ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаЧисло() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест", __dsl_newTypeDescription__("Строка,Число"));
context.__variables__.get("ТЗ").Добавить().Тест = -(3);
context.__variables__.get("ТЗ").Добавить().Тест = "7";
context.__variables__.get("ТЗ").Добавить().Тест = "ц5";
ПроверитьРавенство(context.__variables__.get("ТЗ").Итог("Тест"), -(3));
}
context.__functions__.set("ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаЧисло", ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаЧисло);
function ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаДата() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест", __dsl_newTypeDescription__("Строка,Дата"));
context.__variables__.get("ТЗ").Добавить().Тест = -(3);
context.__variables__.get("ТЗ").Добавить().Тест = "7";
context.__variables__.get("ТЗ").Добавить().Тест = "ц5";
ПроверитьРавенство(context.__variables__.get("ТЗ").Итог("Тест"), undefined);
}
context.__functions__.set("ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаДата", ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаДата);
function ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаБезЧисел() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест", __dsl_newTypeDescription__("Строка"));
context.__variables__.get("ТЗ").Добавить().Тест = "без";
context.__variables__.get("ТЗ").Добавить().Тест = "числовых";
context.__variables__.get("ТЗ").Добавить().Тест = "значений";
ПроверитьРавенство(context.__variables__.get("ТЗ").Итог("Тест"), 0);
}
context.__functions__.set("ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаБезЧисел", ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаБезЧисел);
function ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаЧислоБезЧисел() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест", __dsl_newTypeDescription__("Строка,Число"));
context.__variables__.get("ТЗ").Добавить().Тест = "без";
context.__variables__.get("ТЗ").Добавить().Тест = "числовых";
context.__variables__.get("ТЗ").Добавить().Тест = "значений";
ПроверитьРавенство(context.__variables__.get("ТЗ").Итог("Тест"), 0);
}
context.__functions__.set("ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаЧислоБезЧисел", ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаЧислоБезЧисел);
function ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаДатаБезЧисел() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест", __dsl_newTypeDescription__("Строка,Дата"));
context.__variables__.get("ТЗ").Добавить().Тест = "без";
context.__variables__.get("ТЗ").Добавить().Тест = "числовых";
context.__variables__.get("ТЗ").Добавить().Тест = "значений";
ПроверитьРавенство(context.__variables__.get("ТЗ").Итог("Тест"), undefined);
}
context.__functions__.set("ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаДатаБезЧисел", ТестДолжен_ПроверитьИтогПоКолонкеСОписаниемТипов_СтрокаДатаБезЧисел);
function ТестДолжен_ПроверитьИтогПоКолонкеБезОписанияТипов_БезЧисел() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = "без";
context.__variables__.get("ТЗ").Добавить().Тест = "числовых";
context.__variables__.get("ТЗ").Добавить().Тест = "значений";
ПроверитьРавенство(context.__variables__.get("ТЗ").Итог("Тест"), 0);
}
context.__functions__.set("ТестДолжен_ПроверитьИтогПоКолонкеБезОписанияТипов_БезЧисел", ТестДолжен_ПроверитьИтогПоКолонкеБезОписанияТипов_БезЧисел);
function ТестДолжен_ПроверитьИсключениеПриНеверномИмениКолонкиВОтборе() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = -(3);
context.__variables__.get("ТЗ").Добавить().Тест = 7;
context.__variables__.set("Фильтр", __dsl_newStructure__("Тест,Тест2", 7, 7));
context.__lastException__ = null;
try {
context.__variables__.set("Рез", context.__variables__.get("ТЗ").НайтиСтроки(context.__variables__.get("Фильтр")));
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
ПроверитьРавенство(__dsl_strFind__(__dsl_errorInfo__(context).Описание, "NullException"), 0, "ArgumentNull");
return;
}
throw new __dsl_RuntimeError__("Ожидали исключение, но его не было", 1239);
}
context.__functions__.set("ТестДолжен_ПроверитьИсключениеПриНеверномИмениКолонкиВОтборе", ТестДолжен_ПроверитьИсключениеПриНеверномИмениКолонкиВОтборе);
function ТестДолжен_ПроверитьЗапятуюВИменахКолонок_БезПустых() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Колонки.Добавить("Тест2");
context.__variables__.get("ТЗ").Добавить().Тест = -(3);
context.__variables__.get("ТЗ").Добавить().Тест = 7;
context.__variables__.get("ТЗ").Свернуть(", Тест", "Тест2,");
}
context.__functions__.set("ТестДолжен_ПроверитьЗапятуюВИменахКолонок_БезПустых", ТестДолжен_ПроверитьЗапятуюВИменахКолонок_БезПустых);
function ТестДолжен_ПроверитьЗапятуюВИменахКолонок_СПустыми() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Колонки.Добавить("Тест2");
context.__variables__.get("ТЗ").Добавить().Тест = -(3);
context.__variables__.get("ТЗ").Добавить().Тест = 7;
context.__lastException__ = null;
try {
context.__variables__.get("ТЗ").Свернуть("Тест, ", "Тест2");
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
return;
}
throw new __dsl_RuntimeError__("Ожидали исключение, но его не было", 1266);
}
context.__functions__.set("ТестДолжен_ПроверитьЗапятуюВИменахКолонок_СПустыми", ТестДолжен_ПроверитьЗапятуюВИменахКолонок_СПустыми);
function ТестДолжен_ПроверитьИсключениеДляИндекса() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.get("ТЗ").Добавить().Тест = -(1);
context.__lastException__ = null;
try {
context.__variables__.set("Индекс", context.__variables__.get("ТЗ").Индекс("Тест"));
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
return;
}
throw new __dsl_RuntimeError__("Ожидали исключение, но его не было", 1281);
}
context.__functions__.set("ТестДолжен_ПроверитьИсключениеДляИндекса", ТестДолжен_ПроверитьИсключениеДляИндекса);
function ТестДолжен_ВызватьИсключениеПриДобавленииКолонкиСНевернымИменем() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__lastException__ = null;
try {
context.__variables__.get("ТЗ").Колонки.Добавить("!@#");
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
return;
}
throw new __dsl_RuntimeError__("Должно было быть выдано исключение, но его не было", 1292);
}
context.__functions__.set("ТестДолжен_ВызватьИсключениеПриДобавленииКолонкиСНевернымИменем", ТестДолжен_ВызватьИсключениеПриДобавленииКолонкиСНевернымИменем);
function ТестДолжен_ВызватьИсключениеПриВставкеКолонкиСНевернымИменем() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__lastException__ = null;
try {
context.__variables__.get("ТЗ").Колонки.Вставить(0, "!@#");
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
return;
}
throw new __dsl_RuntimeError__("Должно было быть выдано исключение, но его не было", 1303);
}
context.__functions__.set("ТестДолжен_ВызватьИсключениеПриВставкеКолонкиСНевернымИменем", ТестДолжен_ВызватьИсключениеПриВставкеКолонкиСНевернымИменем);
function ТестДолжен_ВызватьИсключениеНаПоискеИндексаКолонкиСНевернымПримитивнымТипом() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__lastException__ = null;
try {
context.__variables__.get("ТЗ").Колонки.Индекс(0);
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
context.__variables__.set("Ошибка", __dsl_errorInfo__(context).Описание);
ПроверитьНеравенство(__dsl_strFind__(context.__variables__.get("Ошибка"), "Неверный тип аргумента"), 0, __dsl_add__("Неверный вид ошибки: ", context.__variables__.get("Ошибка")));
return;
}
throw new __dsl_RuntimeError__("Должно было быть выдано исключение, но его не было", 1316);
}
context.__functions__.set("ТестДолжен_ВызватьИсключениеНаПоискеИндексаКолонкиСНевернымПримитивнымТипом", ТестДолжен_ВызватьИсключениеНаПоискеИндексаКолонкиСНевернымПримитивнымТипом);
function ТестДолжен_ВызватьИсключениеНаПоискеИндексаКолонкиСНевернымОбъектнымТипом() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__lastException__ = null;
try {
context.__variables__.get("ТЗ").Колонки.Индекс(context.__variables__.get("ТЗ"));
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
context.__variables__.set("Ошибка", __dsl_errorInfo__(context).Описание);
ПроверитьНеравенство(__dsl_strFind__(context.__variables__.get("Ошибка"), "Неверный тип аргумента"), 0, __dsl_add__("Неверный вид ошибки: ", context.__variables__.get("Ошибка")));
return;
}
throw new __dsl_RuntimeError__("Должно было быть выдано исключение, но его не было", 1329);
}
context.__functions__.set("ТестДолжен_ВызватьИсключениеНаПоискеИндексаКолонкиСНевернымОбъектнымТипом", ТестДолжен_ВызватьИсключениеНаПоискеИндексаКолонкиСНевернымОбъектнымТипом);
function ТестДолжен_ПроверитьИсключениеПолученияКолонкиСНевернымНомером() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Тест");
context.__variables__.set("СтрокаТЗ", context.__variables__.get("ТЗ").Добавить());
context.__variables__.set("БылоИсключение", false);
context.__lastException__ = null;
try {
context.__variables__.set("Рез", context.__variables__.get("СтрокаТЗ").Получить(-(1)));
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
context.__variables__.set("Ошибка", __dsl_errorInfo__(context).Описание);
ПроверитьНеравенство(__dsl_strFind__(context.__variables__.get("Ошибка"), "Значение индекса выходит за пределы"), 0, __dsl_add__("Неверный вид ошибки: ", context.__variables__.get("Ошибка")));
context.__variables__.set("БылоИсключение", true);
}
ПроверитьИстину(context.__variables__.get("БылоИсключение"), "Получение колонки с неверным номером");
context.__variables__.set("БылоИсключение", false);
context.__lastException__ = null;
try {
context.__variables__.set("Рез", __dsl_index__(context.__variables__.get("СтрокаТЗ"), -(1)));
} catch (__dsl_err__) {
  context.__lastException__ = __dsl_err__;
context.__variables__.set("Ошибка", __dsl_errorInfo__(context).Описание);
ПроверитьНеравенство(__dsl_strFind__(context.__variables__.get("Ошибка"), "Значение индекса выходит за пределы"), 0, __dsl_add__("Неверный вид ошибки: ", context.__variables__.get("Ошибка")));
context.__variables__.set("БылоИсключение", true);
}
ПроверитьИстину(context.__variables__.get("БылоИсключение"), "Получение колонки по неверному индексу");
}
context.__functions__.set("ТестДолжен_ПроверитьИсключениеПолученияКолонкиСНевернымНомером", ТестДолжен_ПроверитьИсключениеПолученияКолонкиСНевернымНомером);
function ТестДолжен_НайтиИспользуетИндекс() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("СИндексом");
context.__variables__.get("ТЗ").Колонки.Добавить("БезИндекса");
context.__variables__.get("ТЗ").Индексы.Добавить("СИндексом");
context.__variables__.set("КоличествоСтрок", 1000);
context.__variables__.set("к", 0);
while (context.__variables__.get("к") <= context.__variables__.get("КоличествоСтрок") - 1) {
context.__variables__.set("Стр", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("Стр").СИндексом = __dsl_add__("Ключ", __dsl_format__(context.__variables__.get("к"), "ЧГ="));
context.__variables__.get("Стр").БезИндекса = __dsl_add__("Ключ", __dsl_format__(context.__variables__.get("к"), "ЧГ="));
  context.__variables__.set("к", context.__variables__.get("к") + 1);
}
context.__variables__.set("ИскомыйКлюч", __dsl_add__("Ключ", __dsl_format__(context.__variables__.get("КоличествоСтрок") / 2, "ЧГ=")));
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти(context.__variables__.get("ИскомыйКлюч"), "СИндексом"));
ПроверитьЛожь(context.__variables__.get("НайденнаяСтрока") === undefined, "Строка должна быть найдена по проиндексированной колонке");
ПроверитьРавенство(context.__variables__.get("НайденнаяСтрока").СИндексом, context.__variables__.get("ИскомыйКлюч"), "Найденная строка должна содержать искомое значение");
context.__variables__.set("НесуществующийКлюч", __dsl_add__("Ключ", __dsl_format__(__dsl_add__(context.__variables__.get("КоличествоСтрок"), 1), "ЧГ=")));
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти(context.__variables__.get("НесуществующийКлюч"), "СИндексом"));
ПроверитьИстину(context.__variables__.get("НайденнаяСтрока") === undefined, "Несуществующее значение не должно быть найдено по проиндексированной колонке");
}
context.__functions__.set("ТестДолжен_НайтиИспользуетИндекс", ТестДолжен_НайтиИспользуетИндекс);
function ТестДолжен_НайтиВозвращаетНеопределеноЕслиНетСовпадений() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Ключ");
context.__variables__.get("ТЗ").Индексы.Добавить("Ключ");
context.__variables__.set("Стр", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("Стр").Ключ = "Существующий";
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти("Несуществующий", "Ключ"));
ПроверитьИстину(context.__variables__.get("НайденнаяСтрока") === undefined, "Должно вернуть Неопределено при отсутствии совпадений");
}
context.__functions__.set("ТестДолжен_НайтиВозвращаетНеопределеноЕслиНетСовпадений", ТестДолжен_НайтиВозвращаетНеопределеноЕслиНетСовпадений);
function ТестДолжен_НайтиПоНесколькимКолонкам() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("А");
context.__variables__.get("ТЗ").Колонки.Добавить("Б");
context.__variables__.get("ТЗ").Колонки.Добавить("В");
context.__variables__.set("Стр", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("Стр").А = "ЗначениеА";
context.__variables__.get("Стр").Б = "ЗначениеБ";
context.__variables__.get("Стр").В = "ЗначениеВ";
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти("ЗначениеА", "А, Б"));
ПроверитьЛожь(context.__variables__.get("НайденнаяСтрока") === undefined, "Строка должна быть найдена по первой из колонок");
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти("ЗначениеБ", "А, Б"));
ПроверитьЛожь(context.__variables__.get("НайденнаяСтрока") === undefined, "Строка должна быть найдена по второй из колонок");
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти("ЗначениеВ", "А, Б"));
ПроверитьИстину(context.__variables__.get("НайденнаяСтрока") === undefined, "Значение из колонки В не должно найтись при поиске по А и Б");
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти("ЗначениеВ"));
ПроверитьЛожь(context.__variables__.get("НайденнаяСтрока") === undefined, "Строка должна быть найдена при поиске по всем колонкам");
}
context.__functions__.set("ТестДолжен_НайтиПоНесколькимКолонкам", ТестДолжен_НайтиПоНесколькимКолонкам);
function ТестДолжен_НайтиПоНесколькимКолонкамСЧастичнымИндексом() {
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("Товар");
context.__variables__.get("ТЗ").Колонки.Добавить("Цвет");
context.__variables__.get("ТЗ").Индексы.Добавить("Цвет");
context.__variables__.set("С1", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("С1").Товар = "Иск";
context.__variables__.get("С1").Цвет = "Красный";
context.__variables__.set("С2", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("С2").Товар = "Другой";
context.__variables__.get("С2").Цвет = "Иск";
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти("Иск", "Товар, Цвет"));
ПроверитьЛожь(context.__variables__.get("НайденнаяСтрока") === undefined, "Должна находиться строка по совпадению в колонке «Товар»");
ПроверитьРавенство(context.__variables__.get("НайденнаяСтрока"), context.__variables__.get("С1"), "При совпадении в первой колонке раньше по порядку — первая строка");
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти("Синий", "Товар, Цвет"));
ПроверитьИстину(context.__variables__.get("НайденнаяСтрока") === undefined, "Нет совпадений ни в одной из колонок");
context.__variables__.set("С3", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("С3").Товар = "Третий";
context.__variables__.get("С3").Цвет = "Синий";
context.__variables__.set("НайденнаяСтрока", context.__variables__.get("ТЗ").Найти("Синий", "Товар, Цвет"));
ПроверитьЛожь(context.__variables__.get("НайденнаяСтрока") === undefined, "Совпадение только в проиндексированной колонке «Цвет»");
ПроверитьРавенство(context.__variables__.get("НайденнаяСтрока"), context.__variables__.get("С3"));
}
context.__functions__.set("ТестДолжен_НайтиПоНесколькимКолонкамСЧастичнымИндексом", ТестДолжен_НайтиПоНесколькимКолонкамСЧастичнымИндексом);
function ТестДолжен_НайтиСИндексомБыстрееЧемБезИндекса() {
context.__variables__.set("КоличествоСтрок", 10000);
context.__variables__.set("КоличествоИзмерений", 100);
context.__variables__.set("ТЗ", __dsl_newValueTable__());
context.__variables__.get("ТЗ").Колонки.Добавить("СИндексом");
context.__variables__.get("ТЗ").Колонки.Добавить("БезИндекса");
context.__variables__.get("ТЗ").Индексы.Добавить("СИндексом");
context.__variables__.set("ИскомоеЗначение", undefined);
context.__variables__.set("к", 1);
while (context.__variables__.get("к") <= context.__variables__.get("КоличествоСтрок")) {
context.__variables__.set("UID", __dsl_newUUID__());
context.__variables__.set("Стр", context.__variables__.get("ТЗ").Добавить());
context.__variables__.get("Стр").СИндексом = __dsl_string__(context.__variables__.get("UID"));
context.__variables__.get("Стр").БезИндекса = __dsl_string__(context.__variables__.get("UID"));
if (context.__variables__.get("к") === context.__variables__.get("КоличествоСтрок") / 2) {
context.__variables__.set("ИскомоеЗначение", __dsl_string__(context.__variables__.get("UID")));
}
  context.__variables__.set("к", context.__variables__.get("к") + 1);
}
context.__variables__.set("НачалоБезИндекса", __dsl_currentUniversalDateInMillis__());
context.__variables__.set("Ит", 1);
while (context.__variables__.get("Ит") <= context.__variables__.get("КоличествоИзмерений")) {
context.__variables__.get("ТЗ").Найти(context.__variables__.get("ИскомоеЗначение"), "БезИндекса");
  context.__variables__.set("Ит", context.__variables__.get("Ит") + 1);
}
context.__variables__.set("ВремяБезИндекса", __dsl_currentUniversalDateInMillis__() - context.__variables__.get("НачалоБезИндекса"));
context.__variables__.set("НачалоСИндексом", __dsl_currentUniversalDateInMillis__());
context.__variables__.set("Ит", 1);
while (context.__variables__.get("Ит") <= context.__variables__.get("КоличествоИзмерений")) {
context.__variables__.get("ТЗ").Найти(context.__variables__.get("ИскомоеЗначение"), "СИндексом");
  context.__variables__.set("Ит", context.__variables__.get("Ит") + 1);
}
context.__variables__.set("ВремяСИндексом", __dsl_currentUniversalDateInMillis__() - context.__variables__.get("НачалоСИндексом"));
ПроверитьИстину(context.__variables__.get("ВремяСИндексом") < context.__variables__.get("ВремяБезИндекса"), __dsl_add__(__dsl_add__(__dsl_add__(__dsl_add__("Поиск с индексом (", context.__variables__.get("ВремяСИндексом")), " мс) должен быть быстрее поиска без индекса ("), context.__variables__.get("ВремяБезИндекса")), " мс)"));
}
context.__functions__.set("ТестДолжен_НайтиСИндексомБыстрееЧемБезИндекса", ТестДолжен_НайтиСИндексомБыстрееЧемБезИндекса);
function ПроверитьНеравенство(Значение1, Значение2, Комментарий = "") {
  context.__variables__.set("Значение1", Значение1);
  context.__variables__.set("Значение2", Значение2);
  context.__variables__.set("Комментарий", Комментарий);
if (!(__dsl_strIsEmpty__(context.__variables__.get("Комментарий")))) {
context.__variables__.set("Комментарий", __dsl_add__(__dsl_add__(" (", context.__variables__.get("Комментарий")), ")"));
}
context.__variables__.set("ТексДляШаблона", "%1) %2 %3 %4%5");
context.__variables__.set("НомерТеста", __dsl_add__(context.__variables__.get("НомерТеста"), 1));
if (context.__variables__.get("Значение1") === context.__variables__.get("Значение2")) {
__dsl_log__(__dsl_strTemplate__(context.__variables__.get("ТексДляШаблона"), context.__variables__.get("НомерТеста"), context.__variables__.get("Значение1"), "=", context.__variables__.get("Значение2"), context.__variables__.get("Комментарий")));
}
else {
__dsl_log__(__dsl_strTemplate__(context.__variables__.get("ТексДляШаблона"), context.__variables__.get("НомерТеста"), context.__variables__.get("Значение1"), "<>", context.__variables__.get("Значение2"), context.__variables__.get("Комментарий")));
}
}
context.__functions__.set("ПроверитьНеравенство", ПроверитьНеравенство);
function ПроверитьРавенство(Значение1, Значение2, Комментарий = "") {
  context.__variables__.set("Значение1", Значение1);
  context.__variables__.set("Значение2", Значение2);
  context.__variables__.set("Комментарий", Комментарий);
if (!(__dsl_strIsEmpty__(context.__variables__.get("Комментарий")))) {
context.__variables__.set("Комментарий", __dsl_add__(__dsl_add__(" (", context.__variables__.get("Комментарий")), ")"));
}
context.__variables__.set("ТексДляШаблона", "%1) %2 %3 %4%5");
context.__variables__.set("НомерТеста", __dsl_add__(context.__variables__.get("НомерТеста"), 1));
if (context.__variables__.get("Значение1") === context.__variables__.get("Значение2")) {
__dsl_log__(__dsl_strTemplate__(context.__variables__.get("ТексДляШаблона"), context.__variables__.get("НомерТеста"), context.__variables__.get("Значение1"), "=", context.__variables__.get("Значение2"), context.__variables__.get("Комментарий")));
}
else {
__dsl_log__(__dsl_strTemplate__(context.__variables__.get("ТексДляШаблона"), context.__variables__.get("НомерТеста"), context.__variables__.get("Значение1"), "<>", context.__variables__.get("Значение2"), context.__variables__.get("Комментарий")));
}
}
context.__functions__.set("ПроверитьРавенство", ПроверитьРавенство);
function ПроверитьИстину(Значение1, Комментарий = "") {
  context.__variables__.set("Значение1", Значение1);
  context.__variables__.set("Комментарий", Комментарий);
ПроверитьРавенство(true, context.__variables__.get("Значение1"), context.__variables__.get("Комментарий"));
}
context.__functions__.set("ПроверитьИстину", ПроверитьИстину);
function ПроверитьЛожь(Значение1, Комментарий = "") {
  context.__variables__.set("Значение1", Значение1);
  context.__variables__.set("Комментарий", Комментарий);
ПроверитьРавенство(false, context.__variables__.get("Значение1"), context.__variables__.get("Комментарий"));
}
context.__functions__.set("ПроверитьЛожь", ПроверитьЛожь);
function ЗагрузитьСценарийИзСтроки(текст) {
  context.__variables__.set("текст", текст);
return context.__variables__.get("Текст");
}
context.__functions__.set("ЗагрузитьСценарийИзСтроки", ЗагрузитьСценарийИзСтроки);