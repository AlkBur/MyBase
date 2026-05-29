ТЗ = Новый ТаблицаЗначений;
ТЗ.Колонки.Добавить("К1");
ТЗ.Колонки.Добавить("К2");

Стр = ТЗ.Добавить();
Стр.К1 = 10;
Стр.К2 = "привет";

// B1.4: dot-read → member_get → rowGet()
Сообщить(Стр.К1);
Сообщить(Стр.К2);

// bracket-read → __dsl_index__ (legacy до B.1.6)
Сообщить(Стр["К1"]);

// coherence invariant: member_get == __dsl_index__
Если Стр.К1 = Стр["К1"] Тогда
	Сообщить("coherent");
Иначе
	Сообщить("divergent");
КонецЕсли;

// missing column dot → undefined
Сообщить(Стр.NoColumn);

// missing column bracket → throw
Попытка
	Х = Стр["NoColumn"];
Исключение
	Сообщить("err1");
КонецПопытки;

// assignment still works (__dsl_index_set__, legacy до B.3)
Стр.К1 = 20;
Сообщить(Стр.К1);

// case insensitive
Сообщить(Стр.к1);
