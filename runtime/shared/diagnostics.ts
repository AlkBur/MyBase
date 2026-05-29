/**
 * DiagnosticsCollector — единый сборщик диагностики для компилятора и runtime.
 *
 * Пока: только compile-time (parse + compile фазы).
 * Runtime diagnostics: deferred — затронет error wrapping, stack behaviour, snapshots.
 *
 * Explicit parameter, не global singleton.
 * Это позволяет:
 *   - parallel compilation
 *   - LSP
 *   - incremental compilation
 *   - worker threads
 *
 * Коды ошибок (code) — обязательны и стабильны.
 * Тексты (message) могут меняться, коды — нет.
 */
import type { Diagnostic, DiagnosticSeverity } from "./types";

export class DiagnosticsCollector {
  private items: Diagnostic[] = [];

  /** Код и severity — обязательны. Тексты могут меняться, коды — нет. */
  add(code: string, severity: DiagnosticSeverity, message: string, line?: number, column?: number): void {
    this.items.push({ code, severity, message, line, column });
  }

  error(code: string, message: string, line?: number, column?: number): void {
    this.add(code, "error", message, line, column);
  }

  warning(code: string, message: string, line?: number, column?: number): void {
    this.add(code, "warning", message, line, column);
  }

  info(code: string, message: string, line?: number, column?: number): void {
    this.add(code, "info", message, line, column);
  }

  hasErrors(): boolean {
    return this.items.some((d) => d.severity === "error");
  }

  hasWarnings(): boolean {
    return this.items.some((d) => d.severity === "warning");
  }

  toArray(): readonly Diagnostic[] {
    return this.items;
  }

  clear(): void {
    this.items = [];
  }
}
