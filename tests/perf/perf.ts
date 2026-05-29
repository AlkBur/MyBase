#!/usr/bin/env bun
// ======================================================================
//  perf.ts — Benchmark runner CLI
//
//  Usage:
//    bun run tests/perf/perf.ts                          # все бенчи, human output
//    bun run tests/perf/perf.ts --compare-baseline       # diff v1.3.3.dsl.json
//    bun run tests/perf/perf.ts --tag dispatch           # только dispatch-бенчи
//    bun run tests/perf/perf.ts --filter "member-access" # по имени
//    bun run tests/perf/perf.ts --history-save           # сохранить в history/
//
//  Output:
//    stdout: human-readable report
//    ./results.json: machine-readable (всегда)
// ======================================================================

import {
  runScenarios,
  compareResults,
  loadBaseline,
  buildReport,
  formatHuman,
} from "./harness";
import type { BenchmarkScenario } from "./types";

// ---- сбор всех сценариев ----

import { scenarios as memberAccess } from "./regression/member-access.bench";
import { scenarios as rowAccess } from "./regression/row-access.bench";
import { scenarios as findRows } from "./regression/find-rows.bench";
import { scenarios as tableIteration } from "./regression/table-iteration.bench";
import { scenarios as arrayAppend } from "./regression/array-append.bench";
import { scenarios as structureLookup } from "./regression/structure-lookup.bench";
import { scenarios as compilation } from "./regression/compilation.bench";
import { scenarios as nativeComparison } from "./native/native-comparison.bench";

const ALL_SCENARIOS: BenchmarkScenario[] = [
  ...memberAccess,
  ...rowAccess,
  ...findRows,
  ...tableIteration,
  ...arrayAppend,
  ...structureLookup,
  ...compilation,
  ...nativeComparison,
];

// ---- CLI parsing ----

const args = process.argv.slice(2);
const compareBaseline = args.includes("--compare-baseline");
const historySave = args.includes("--history-save");

const tagIndex = args.indexOf("--tag");
const filterTag = tagIndex >= 0 ? args[tagIndex + 1]?.toLowerCase() : null;

const filterIndex = args.indexOf("--filter");
const filterName = filterIndex >= 0 ? args[filterIndex + 1]?.toLowerCase() : null;

// ---- filter scenarios ----

const filtered = ALL_SCENARIOS.filter((s) => {
  if (filterTag && !s.def.tags.some((t) => t.toLowerCase().includes(filterTag))) return false;
  if (filterName && !s.def.name.toLowerCase().includes(filterName)) return false;
  return true;
});

if (filtered.length === 0) {
  console.error("No scenarios match the filter.");
  process.exit(1);
}

// ---- run ----

const baselinePath = "tests/perf/baselines/v1.3.3.dsl.json";

async function main() {
  // Run benchmarks
  console.error(`Running ${filtered.length} scenarios...\n`);
  const results = runScenarios(filtered);

  // Compare with baseline
  const baseline = compareBaseline ? await loadBaseline(baselinePath) : null;
  const finalResults = baseline ? compareResults(results, baseline) : results;

  // Build report
  const report = buildReport(finalResults);
  const human = formatHuman(report, baseline ? baselinePath : undefined);

  // Output
  console.log("\n" + human);

  // Always write results.json
  await Bun.write("results.json", JSON.stringify(report, null, 2));
  console.error(`\nMachine-readable: results.json`);

  // History save
  if (historySave) {
    const date = new Date().toISOString().split("T")[0];
    const version = report.runtimeVersion.replace(/\./g, "-");
    const path = `tests/perf/history/${date}-v${version}.json`;
    await Bun.write(path, JSON.stringify(report, null, 2));
    console.error(`History saved: ${path}`);
  }

  // Exit code: flag regressions
  const flagged = report.summary["regression-flag"];
  if (flagged > 0) {
    console.error(`\n⚠️  ${flagged} flagged regression(s). Investigate before merging.`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
