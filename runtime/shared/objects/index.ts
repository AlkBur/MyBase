/**
 * Индексный файл для runtime/shared/objects/
 * Re-export всех DSL-фабрик и type guards.
 */

export { createArray } from "./array";
export { createStructure } from "./structure";
export { createValueTable } from "./value-table";
export { createRow, rowGet, rowSet } from "./value-table-row";
export type { DSLValueTableRow } from "./value-table-row";
export { createValueTableColumns } from "./value-table-columns";
export type { ColumnDef } from "./value-table-columns";
export { createValueTableIndexes } from "./value-table-indexes";
export type { DSLIndexDef } from "./value-table-indexes";
export { createMap } from "./map";
export { getDSLType } from "./type";
export type { DSLType } from "./type";
export { createUUID } from "./uuid";

export {
  defineMethod,
  defineDSLType,
  isDSLArray,
  isDSLValueTable,
  isDSLValueTableRow,
  isDSLColumns,
  isDSLIndexes,
  isDSLStructure,
  isDSLMap,
  isDSLUUID,
  isDSLType,
} from "./helpers";
