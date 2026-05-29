// Nested chains: read + write
// B.1 проверяет порядок lowering: index → dot → index
// B.3 проверяет chained writes

Т = Новый ТаблицаЗначений;
Т.Колонки.Добавить("К1");
Т.Колонки.Добавить("Данные");
Стр = Т.Добавить();
Стр.К1 = 1;
Стр.Данные = "a";

// read chain: index → dot → index
a = Т[0].Данные["К1"]; // ожидаем: __dsl_index__(Т, 0).Данные["К1"]

// write chain: index → dot → dot (будет member_set в B.3)
Т[0].К1.Данные = 2;
