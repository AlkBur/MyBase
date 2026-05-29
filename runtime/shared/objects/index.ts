/**
 * Индексный файл для runtime/shared/objects/
 * Re-export всех DSL-фабрик и type guards.
 */

export { createArray } from "./array";
export { createFixedArray } from "./fixed-array";
export { createFixedMap } from "./fixed-map";
export { createStructure } from "./structure";
export { createValueTable } from "./value-table";
export { createRow, rowGet, rowSet } from "./value-table-row";
export type { DSLValueTableRow } from "./value-table-row";
export { createValueTableColumns } from "./value-table-columns";
export type { ColumnDef } from "./value-table-columns";
export { createValueTableIndexes } from "./value-table-indexes";
export type { DSLIndexDef } from "./value-table-indexes";
export { createValueList, createValueListItem } from "./list";
export { createMap } from "./map";
export { getDSLType } from "./type";
export type { DSLType } from "./type";
export { createUUID } from "./uuid";

export {
  defineMethod,
  defineDSLType,
  isDSLArray,
  isDSLFixedArray,
  isDSLValueTable,
  isDSLValueTableRow,
  isDSLColumns,
  isDSLIndexes,
  isDSLStructure,
  isDSLMap,
  isDSLFixedMap,
  isDSLUUID,
  isDSLType,
  isDSLValueList,
  isDSLValueListItem,
} from "./helpers";
