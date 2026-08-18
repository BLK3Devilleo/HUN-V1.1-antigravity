/**
 * Logger estructurado — "cámaras de vigilancia" de NUH.
 * Escribe UNA línea por evento en stdout (Docker/Dokploy la captura):
 *   [NUH] 2026-08-18T12:00:00.000Z INFO request path=/dashboard method=GET user=dev@nuh.com
 * Niveles: debug/info/warn/error (LOG_LEVEL, default "info"). Redacta secretos. Trunca a 200 chars.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LEVEL_ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
const minLevel = LEVEL_ORDER[configuredLevel] ?? LEVEL_ORDER.info;
const SENSITIVE_KEYS = /token|secret|password|authorization|api[-_]?key|credential/i;
function stringify(value: unknown): string {
  if (value === null || value === undefined) return '-';
  const s = String(value);
  return s.length === 0 ? '-' : s.slice(0, 200);
}
function emit(level: LogLevel, event: string, fields?: Record<string, unknown>) {
  if (LEVEL_ORDER[level] < minLevel) return;
  const parts: string[] = ['[NUH]', new Date().toISOString(), level.toUpperCase(), event];
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      const safeKey = SENSITIVE_KEYS.test(key) ? `${key}=[REDACTED]` : key;
      parts.push(`${safeKey}=${stringify(value)}`);
    }
  }
  const line = parts.join(' ');
  try { process.stdout.write(line + '\n'); } catch { console.log(line); }
}
export const logger = {
  debug: (event: string, fields?: Record<string, unknown>) => emit('debug', event, fields),
  info: (event: string, fields?: Record<string, unknown>) => emit('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit('error', event, fields),
};
