'use server';

import { createAdminClient, createSessionClient } from '@/lib/supabase-server';
import { authorize } from '@/lib/authz';
import { logger } from '@/lib/logger';
import { isUuid } from '@/lib/validation';

/**
 * Valida la URL de un webhook n8n antes de persistirla.
 *
 * Se rechazan destinos internos (localhost, IPs privadas, `.internal`) porque
 * el servidor hará peticiones salientes a esta URL: sin esta comprobación, un
 * admin podría convertir la aplicación en un proxy hacia la red interna (SSRF).
 */
function validateWebhookUrl(rawUrl: string): { ok: true; url: string } | { ok: false; error: string } {
  const trimmed = rawUrl.trim();

  if (trimmed === '') {
    // Cadena vacía = desactivar el webhook. Es un caso válido.
    return { ok: true, url: '' };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { ok: false, error: 'La URL del webhook no es válida.' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, error: 'El webhook debe usar http o https.' };
  }

  const host = parsed.hostname.toLowerCase();
  const isPrivateHost =
    host === 'localhost' ||
    host === '0.0.0.0' ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    /^127\./.test(host) ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    /^169\.254\./.test(host) ||
    host === '::1' ||
    host === '[::1]';

  if (isPrivateHost) {
    return { ok: false, error: 'El webhook no puede apuntar a una dirección interna o privada.' };
  }

  return { ok: true, url: trimmed };
}

export async function saveN8nWebhook(webhookUrl: string) {
  const event = 'action.webhook_save';

  try {
    // Solo owner/admin pueden cambiar la configuración de la organización.
    const auth = await authorize(event, 'admin');
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }
    const { user, orgId, role } = auth.context;

    const validated = validateWebhookUrl(webhookUrl);
    if (!validated.ok) {
      logger.warn(`${event}.rejected`, { user: user.email || user.id, org: orgId, reason: 'invalid_url' });
      return { success: false, error: validated.error };
    }

    logger.info(`${event}.start`, { user: user.email || user.id, org: orgId, role });

    const dbClient = createAdminClient() ?? (await createSessionClient(true));

    if (!isUuid(orgId)) {
      return { success: false, error: 'El identificador de la organización no es válido.' };
    }

    const { data: orgData } = await dbClient
      .from('organizations')
      .select('id, settings')
      .eq('id', orgId)
      .maybeSingle();

    if (!orgData) {
      return {
        success: false,
        error: 'No existe ninguna organización activa en la base de datos para asignar el Webhook.',
      };
    }

    const currentSettings: Record<string, unknown> = orgData.settings || {};

    const { error: updateError } = await dbClient
      .from('organizations')
      .update({ settings: { ...currentSettings, n8n_webhook_url: validated.url } })
      .eq('id', orgData.id);

    if (updateError) {
      throw new Error(`Error al actualizar organización: ${updateError.message}`);
    }

    logger.info(`${event}.ok`, { user: user.email || user.id, org: orgData.id });

    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`${event}.failed`, { error: message });
    return { success: false, error: message };
  }
}

export async function getN8nWebhook() {
  try {
    const auth = await authorize('action.webhook_get');
    if (!auth.ok) return { url: '' };

    const { orgId } = auth.context;
    if (!isUuid(orgId)) return { url: '' };

    const dbClient = createAdminClient() ?? (await createSessionClient());

    const { data: orgData } = await dbClient
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .maybeSingle();

    return { url: orgData?.settings?.n8n_webhook_url || '' };
  } catch {
    return { url: '' };
  }
}
