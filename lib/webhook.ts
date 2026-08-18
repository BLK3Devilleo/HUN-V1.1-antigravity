import { logger } from '@/lib/logger';

/**
 * Envío de webhooks salientes a n8n con timeout y reintentos.
 *
 * Problema que resuelve: las tres llamadas a n8n del proyecto usaban `fetch`
 * pelado. Eso implicaba:
 *
 *   - **Sin timeout.** Si n8n aceptaba la conexión pero no respondía, la
 *     Server Action quedaba colgada indefinidamente y con ella la petición
 *     del usuario.
 *   - **Sin reintentos.** Un corte de red momentáneo perdía la publicación
 *     de forma silenciosa; el post quedaba en la base de datos pero nunca se
 *     publicaba en las redes.
 *   - **Errores tragados.** `moderation.ts` y `media.ts` capturaban el fallo
 *     con `console.error`, sin traza estructurada ni señal al llamante.
 *
 * Se reintenta solo cuando tiene sentido: errores de red, timeouts y 5xx/429.
 * Un 4xx es un error del propio payload y reintentarlo solo duplica carga.
 */

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 500;

export interface WebhookResult {
  ok: boolean;
  status?: number;
  attempts: number;
  error?: string;
}

interface DispatchOptions {
  timeoutMs?: number;
  maxAttempts?: number;
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Envía un evento al webhook indicado.
 *
 * Nunca lanza: devuelve el resultado para que el llamante decida qué hacer.
 * Así una acción de negocio no revienta por un fallo de un sistema externo.
 *
 * @param url - Destino del webhook. Si viene vacío, se informa sin llamar.
 * @param event - Nombre del evento (`post_published`, `cause_approved`, ...).
 * @param payload - Cuerpo JSON del evento.
 */
export async function dispatchWebhook(
  url: string | undefined | null,
  event: string,
  payload: Record<string, unknown>,
  options: DispatchOptions = {}
): Promise<WebhookResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

  if (!url || url.trim() === '') {
    logger.warn('webhook.skipped', { event, reason: 'no_url_configured' });
    return { ok: false, attempts: 0, error: 'No hay ninguna URL de webhook n8n configurada.' };
  }

  const body = JSON.stringify({ event, ...payload });
  let lastError = 'Error desconocido enviando el webhook';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const startedAt = Date.now();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      });
      const durationMs = Date.now() - startedAt;

      if (response.ok) {
        logger.info('webhook.ok', { event, status: response.status, attempt, dur_ms: durationMs });
        return { ok: true, status: response.status, attempts: attempt };
      }

      // Se lee un fragmento del cuerpo para diagnosticar sin volcar todo.
      const detail = (await response.text().catch(() => '')).slice(0, 200);
      lastError = `n8n respondió HTTP ${response.status}${detail ? `: ${detail}` : ''}`;

      if (!isRetryableStatus(response.status)) {
        logger.error('webhook.failed', {
          event,
          status: response.status,
          attempt,
          reason: 'non_retryable',
        });
        return { ok: false, status: response.status, attempts: attempt, error: lastError };
      }

      logger.warn('webhook.retrying', { event, status: response.status, attempt });
    } catch (err: unknown) {
      const aborted = err instanceof Error && err.name === 'AbortError';
      lastError = aborted
        ? `Tiempo de espera agotado tras ${timeoutMs} ms`
        : err instanceof Error
          ? err.message
          : 'Fallo de red';
      logger.warn('webhook.retrying', {
        event,
        attempt,
        reason: aborted ? 'timeout' : 'network_error',
        error: lastError,
      });
    } finally {
      clearTimeout(timer);
    }

    // Backoff exponencial entre intentos (no tras el último).
    if (attempt < maxAttempts) {
      await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
    }
  }

  logger.error('webhook.failed', { event, attempts: maxAttempts, error: lastError });
  return { ok: false, attempts: maxAttempts, error: lastError };
}
