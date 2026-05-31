# MyBase — 1C-like DSL Platform

BSL-inspired runtime with zero-install embedded automation (SQLite + Bun).

## Quick Start

```bash
bun install
bun run web        # http://localhost:3000
```

## Commands

| Command | Description |
|---------|-------------|
| `bun run web` | HTTP playground (port 3000, CRUD + examples) |
| `bun run test` | Golden tests (check mode) |
| `bun run typecheck` | TypeScript type check (app only) |
| `bun run test:abi` | ABI assertions |
| `bun run build` | Build to EXE |

## Architecture

DSL code → Tokenizer → Compiler → JS IR → Sandbox Runtime (Server: JIT `new Function()`, Client: AST interpreter stub).

## Documentation

[AGENTS.md](./AGENTS.md) — full architecture, roadmap, freezes, and contracts.
