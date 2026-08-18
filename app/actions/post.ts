'use server';

import { createAdminClient, createSessionClient } from '@/lib/supabase-server';
import { authorize, hasAtLeast } from '@/lib/authz';
import { dispatchWebhook } from '@/lib/webhook';
import { logger } from '@/lib/logger';
import { isUuid } from '@/lib/validation';

export interface VariationBlockPayload {
  id?: string;
  number?: number;
  caption: string;
  platforms: string[];
  mediaUrls: string[];
  scheduledTimestamp?: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface PublishPostPayload {
  projectId?: string;
  title?: string;
  caption?: string;
  mediaUrls?: string[];
  platforms?: string[];
  sameDayScheduled?: boolean;
  baseScheduledDate?: string;
  baseScheduledTime?: string;
  blocks?: VariationBlockPayload[];
}

interface MediaBinary {
  url: string;
  base64: string;
  mime_type: string;
  file_name: string;
}

/**
 * Límites del empaquetado de medios en base64.
 *
 * El código anterior descargaba cada URL entera en memoria y la convertía a
 * base64 sin ningún tope. Con vídeos (el propio R2 admite hasta 500 MB) eso
 * es un OOM del contenedor: base64 infla ~33 %, y varios bloques se procesan
 * en paralelo. Estos límites acotan el peor caso.
 */
const MAX_BINARY_BYTES = 8 * 1024 * 1024; // 8 MB por archivo
const MAX_TOTAL_BINARY_BYTES = 24 * 1024 * 1024; // 24 MB por publicación
const MEDIA_FETCH_TIMEOUT_MS = 15_000;

/**
 * Descarga los medios y los adjunta en base64 para n8n.
 *
 * Los archivos que superan el límite NO se adjuntan: se envía igualmente su
 * URL pública en `media_urls`, de modo que n8n pueda descargarlos por su
 * cuenta en lugar de perder la publicación.
 */
async function convertUrlsToBase64Binaries(
  mediaUrls: string[],
  budget: { remaining: number }
): Promise<MediaBinary[]> {
  const mediaBinaries: MediaBinary[] = [];
  if (!mediaUrls || mediaUrls.length === 0) return mediaBinaries;

  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i];
    if (!url) continue;

    try {
      if (url.startsWith('data:')) {
        const parts = url.split(';base64,');
        const base64Data = parts[1] || '';
        const approxBytes = Math.floor(base64Data.length * 0.75);

        if (approxBytes > MAX_BINARY_BYTES || approxBytes > budget.remaining) {
          logger.warn('publish.media_skipped', { reason: 'too_large', index: i, bytes: approxBytes });
          continue;
        }

        budget.remaining -= approxBytes;
        mediaBinaries.push({
          url,
          base64: base64Data,
          mime_type: parts[0].replace('data:', ''),
          file_name: `media_${i + 1}`,
        });
        continue;
      }

      if (!url.startsWith('http://') && !url.startsWith('https://')) continue;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), MEDIA_FETCH_TIMEOUT_MS);

      try {
        const imgRes = await fetch(url, { signal: controller.signal });
        if (!imgRes.ok) {
          logger.warn('publish.media_skipped', { reason: 'fetch_failed', status: imgRes.status, index: i });
          continue;
        }

        // Descarte temprano por cabecera, sin llegar a leer el cuerpo.
        const declaredLength = Number(imgRes.headers.get('content-length') || 0);
        if (declaredLength > MAX_BINARY_BYTES || declaredLength > budget.remaining) {
          logger.warn('publish.media_skipped', { reason: 'too_large', index: i, bytes: declaredLength });
          continue;
        }

        const arrayBuf = await imgRes.arrayBuffer();
        if (arrayBuf.byteLength > MAX_BINARY_BYTES || arrayBuf.byteLength > budget.remaining) {
          logger.warn('publish.media_skipped', { reason: 'too_large', index: i, bytes: arrayBuf.byteLength });
          continue;
        }

        budget.remaining -= arrayBuf.byteLength;
        mediaBinaries.push({
          url,
          base64: Buffer.from(arrayBuf).toString('base64'),
          mime_type: imgRes.headers.get('content-type') || 'image/jpeg',
          file_name: url.split('/').pop() || `media_${i + 1}.jpg`,
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'error desconocido';
      logger.warn('publish.media_skipped', { reason: 'exception', index: i, error: message });
    }
  }

  return mediaBinaries;
}

export async function publishPostAction(payload: PublishPostPayload) {
  const event = 'action.publish';

  try {
    const auth = await authorize(event);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }
    const { user, orgId, role } = auth.context;

    logger.info(`${event}.start`, {
      user: user.email || user.id,
      org: orgId,
      role,
      title: payload.title,
    });

    if (!isUuid(orgId)) {
      return { success: false, error: 'No se encontró la organización del usuario' };
    }

    const dbClient = createAdminClient() ?? (await createSessionClient(true));

    // 1. Resolver la organización propia y su webhook configurado.
    const { data: orgData } = await dbClient
      .from('organizations')
      .select('id, settings')
      .eq('id', orgId)
      .maybeSingle();

    if (!orgData) {
      return { success: false, error: 'No se encontró la organización del usuario' };
    }

    const webhookUrl = orgData.settings?.n8n_webhook_url || process.env.N8N_WEBHOOK_URL;

    // 2. Normalizar bloques (multi-bloque, con fallback a publicación simple).
    const blocks: VariationBlockPayload[] =
      payload.blocks && payload.blocks.length > 0
        ? payload.blocks
        : [
            {
              caption: payload.caption || '',
              platforms: payload.platforms || [],
              mediaUrls: payload.mediaUrls || [],
            },
          ];

    // 3. Empaquetar medios con un presupuesto de memoria compartido.
    //    Se procesa en serie a propósito: en paralelo, el tope global se
    //    podía sobrepasar por condición de carrera.
    const budget = { remaining: MAX_TOTAL_BINARY_BYTES };
    const processedBlocks = [];

    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index];
      const mediaBinaries = await convertUrlsToBase64Binaries(block.mediaUrls || [], budget);

      processedBlocks.push({
        id: block.id || `block-${index + 1}`,
        number: block.number || index + 1,
        caption: block.caption,
        platforms: block.platforms,
        media_urls: block.mediaUrls,
        media_binaries: mediaBinaries,
        scheduled_timestamp: block.scheduledTimestamp || null,
        scheduled_date: block.scheduledDate || null,
        scheduled_time: block.scheduledTime || null,
      });
    }

    // 4. Persistir una causa por bloque.
    //    Quien puede moderar publica directamente; el resto pasa por revisión.
    const initialStatus = hasAtLeast(role, 'moderator') ? 'approved' : 'pending_moderation';

    let primaryCauseId: string | undefined;
    const insertErrors: string[] = [];

    for (const block of processedBlocks) {
      const { data: cause, error: insertErr } = await dbClient
        .from('causes')
        .insert({
          org_id: orgId,
          creator_id: user.id,
          title: payload.title || 'Publicación sin título',
          description: block.caption,
          media_url: block.media_urls?.[0] || '',
          status: initialStatus,
        })
        .select('id')
        .single();

      if (insertErr) {
        insertErrors.push(insertErr.message);
        logger.error(`${event}.insert_failed`, { org: orgId, error: insertErr.message });
      } else if (cause && !primaryCauseId) {
        primaryCauseId = cause.id;
      }
    }

    // Si no se guardó nada, no se dispara el webhook: publicar sin registro
    // dejaría el sistema sin rastro de lo enviado a las redes.
    if (!primaryCauseId) {
      return {
        success: false,
        error: insertErrors[0]
          ? `No se pudo guardar la publicación: ${insertErrors[0]}`
          : 'No se pudo guardar la publicación.',
      };
    }

    // 5. Enviar a n8n (con timeout y reintentos).
    const webhook = await dispatchWebhook(webhookUrl, 'post_published', {
      project_id: payload.projectId || null,
      cause_id: primaryCauseId,
      title: payload.title || '',
      same_day_scheduled: payload.sameDayScheduled || false,
      base_scheduled_date: payload.baseScheduledDate || null,
      base_scheduled_time: payload.baseScheduledTime || null,
      blocks: processedBlocks,
      // Campos planos para workflows de n8n antiguos.
      caption: processedBlocks[0]?.caption || payload.caption || '',
      media_urls: processedBlocks[0]?.media_urls || payload.mediaUrls || [],
      media_binaries: processedBlocks[0]?.media_binaries || [],
      platforms: processedBlocks[0]?.platforms || payload.platforms || [],
      org_id: orgId,
      timestamp: new Date().toISOString(),
    });

    if (!webhook.ok) {
      return {
        success: false,
        causeId: primaryCauseId,
        webhookDispatched: false,
        error: webhook.error || 'No se pudo enviar el contenido al Webhook de n8n.',
      };
    }

    logger.info(`${event}.ok`, {
      user: user.email || user.id,
      org: orgId,
      cause_id: primaryCauseId,
      blocks: processedBlocks.length,
      status: initialStatus,
    });

    return {
      success: true,
      causeId: primaryCauseId,
      webhookDispatched: true,
      status: initialStatus,
      message: '¡Publicación enviada al webhook de n8n exitosamente!',
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido al publicar.';
    logger.error(`${event}.failed`, { error: message });
    return { success: false, error: message };
  }
}
