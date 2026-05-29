import { compile } from "./compiler/compile.ts";
import { serverCapabilities } from "./runtime/server/capabilities.ts";

const result = compile('Т = Новый ТаблицаЗначений; Т.Колонки.Добавить("К1");', serverCapabilities);
console.log("=== OUTPUT ===");
console.log(result.jsCode);
