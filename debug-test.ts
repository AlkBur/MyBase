import { runTestCase } from "./tests/runner";
import { readFileSync } from "fs";

const code = readFileSync("./tests/cases/valuetable.os", "utf-8");

try {
  // Just compile it directly to see any compile errors
  const { tokenize } = require("./compiler/tokenize");
  const { compileProgram } = require("./compiler/compile");
  const { serverCapabilities } = require("./runtime/server/capabilities");
  
  const tokens = tokenize(code);
  console.log("Tokens OK:", tokens.length);
  
  const compiled = compileProgram(code, tokens, serverCapabilities);
  console.log("Compile OK, generated lines:", compiled.lines.length);
  
  // Try to execute the generated JS to see the runtime error
  // Build the sandbox
  const { createBuiltins } = require("./runtime/shared/builtins");
  const { DSRuntimeError } = require("./runtime/shared/errors");
  const { CaseInsensitiveMap } = require("./runtime/server/runtime");
  
  // Create sandbox
  const output: any[] = [];
  const builtinValues = createBuiltins(output);
  
  const RUNTIME_VERSION = "1.3-test";
  const CACHE_KEY = `${RUNTIME_VERSION}|server|${compiled.code}`;
  
  let err: any = null;
  try {
    const fn = new Function(
      "context", "__dsl_db__", "__dsl_RuntimeError__",
      ...Object.keys(builtinValues),
      compiled.code
    );
    const ctx = {
      __variables__: new CaseInsensitiveMap(),
      __functions__: new CaseInsensitiveMap(),
      __lastException__: null,
    };
    fn(ctx, null, DSRuntimeError, ...Object.values(builtinValues));
  } catch (e: any) {
    err = e;
    console.log("RUNTIME ERROR:", e.message);
    console.log("Stack:", e.stack?.split("\n").slice(0, 5).join("\n"));
  }
  
  if (err) {
    console.log("\nSearching for 'No default value'...");
    for (let i = 0; i < compiled.lines.length; i++) {
      if (compiled.lines[i].includes("default")) {
        console.log(`Line ${i}: ${compiled.lines[i]}`);
      }
    }
  }
  
} catch (e: any) {
  console.log("CATCH:", e.message);
  console.log("Stack:", e.stack?.split("\n").slice(0, 5).join("\n"));
}
