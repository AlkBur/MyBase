// ValueTableRow: bracket access через __dsl_index__ dispatch
// Critical migration path for B.1

Т = Новый ТаблицаЗначений;
Т.Колонки.Добавить("К1");
Т.Колонки.Добавить("К2");
Стр = Т.Добавить();
Стр.К1 = 100;
Стр.К2 = "test";

a = Стр["К1"];
b = Стр["К2"];
c = Стр.К1;
d = Стр.К2;
