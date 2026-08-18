'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getAuthContext } from '@/lib/auth';
import { logger } from '@/lib/logger';

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

function logToConsole(msg: string) {
  const formatted = `[HUN-WEBHOOK-LOG ${new Date().toISOString()}] ${msg}\n`;
  try {
    process.stdout.write(formatted);
  } catch (e) {
    console.log(formatted);
  }
}

function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function getAdminClient() {
  const serviceRoleKey =
    process.env.SUPABASE_CENTRAL_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) return null;

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    serviceRoleKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

async function convertUrlsToBase64Binaries(mediaUrls: string[]) {
  const mediaBinaries: Array<{ url: string; base64: string; mime_type: string; file_name: string }> = [];

  if (mediaUrls && mediaUrls.length > 0) {
    for (let i = 0; i < mediaUrls.length; i++) {
      const url = mediaUrls[i];
      if (!url) continue;

      try {
        if (url.startsWith('data:')) {
          const parts = url.split(';base64,');
          const mimeType = parts[0].replace('data:', '');
          const base64Data = parts[1] || '';
          mediaBinaries.push({
            url,
            base64: base64Data,
            mime_type: mimeType,
            file_name: `media_${i + 1}`,
          });
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
          const imgRes = await fetch(url);
          if (imgRes.ok) {
            const arrayBuf = await imgRes.arrayBuffer();
            const base64Data = Buffer.from(arrayBuf).toString('base64');
            const mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
            const fileNameFromUrl = url.split('/').pop() || `media_${i + 1}.jpg`;
            mediaBinaries.push({
              url,
              base64: base64Data,
              mime_type: mimeType,
              file_name: fileNameFromUrl,
            });
          }
        }
      } catch (fetchErr) {
        logToConsole(`No se pudo convertir URL a binario base64: ${url}`);
      }
    }
  }

  return mediaBinaries;
}

export async function publishPostAction(payload: PublishPostPayload) {
  logToConsole(`Iniciando publishPostAction. Título: "${payload.title || 'Sin Título'}", Proyecto: ${payload.projectId || 'N/A'}`);

  try {
    // Resolver contexto de autenticación de forma segura (no confiar en headers/payload)
    const { user, orgId: rawOrgId, role } = await getAuthContext();

    if (!user) {
      return { success: false, error: 'Usuario no autenticado' };
    }
    if (!rawOrgId) {
      return { success: false, error: 'Perfil sin organización asignada' };
    }

    logger.info('action.publish.start', { user: user.email || user.id, org: rawOrgId, role, title: payload.title });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY || '',
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {}
          },
        },
      }
    );

    const adminClient = getAdminClient();
    const dbClient = adminClient || supabase;

    // 1. Obtener la organización real (solo la propia) y su Webhook N8N
    let validOrgId: string | null = null;
    let webhookUrl: string | undefined = process.env.N8N_WEBHOOK_URL;

    if (process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL) {
      const { data: orgData } = isUuid(rawOrgId)
        ? await dbClient
            .from('organizations')
            .select('id, settings')
            .eq('id', rawOrgId)
            .maybeSingle()
        : { data: null };

      if (orgData) {
        validOrgId = orgData.id;
        if (orgData.settings?.n8n_webhook_url) {
          webhookUrl = orgData.settings.n8n_webhook_url;
        }
      }
    }

    // Sin organización válida no se publica (sin fallback a "primera org")
    if (!validOrgId) {
      return { success: false, error: 'No se encontró la organización del usuario' };
    }

    logToConsole(`Webhook URL Objetivo: ${webhookUrl || 'NINGUNO CONFIGURADO'}`);

    // 2. Normalizar bloques de contenido (Soporte Multi-Bloque y Single Post fallback)
    const blocks: VariationBlockPayload[] = payload.blocks && payload.blocks.length > 0
      ? payload.blocks
      : [
          {
            caption: payload.caption || '',
            platforms: payload.platforms || [],
            mediaUrls: payload.mediaUrls || [],
          },
        ];

    // 3. Procesar cada bloque para convertir sus imágenes a Base64
    const processedBlocks = await Promise.all(
      blocks.map(async (block, index) => {
        const mediaBinaries = await convertUrlsToBase64Binaries(block.mediaUrls || []);
        return {
          id: block.id || `block-${index + 1}`,
          number: block.number || index + 1,
          caption: block.caption,
          platforms: block.platforms,
          media_urls: block.mediaUrls,
          media_binaries: mediaBinaries,
          scheduled_timestamp: block.scheduledTimestamp || null,
          scheduled_date: block.scheduledDate || null,
          scheduled_time: block.scheduledTime || null,
        };
      })
    );

    // 4. Guardar Causas / Publicaciones en Supabase Central
    let primaryCauseId: string | undefined;

    if (process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL) {
      const initialStatus =
        role && ['owner', 'admin', 'moderator'].includes(role)
          ? 'approved'
          : 'pending_moderation';

      for (const block of processedBlocks) {
        const { data: cause, error: insertErr } = await dbClient
          .from('causes')
          .insert({
            org_id: validOrgId,
            creator_id: user?.id || null,
            title: payload.title || 'Publicación sin título',
            description: block.caption,
            media_url: block.media_urls[0] || '',
            status: initialStatus,
          })
          .select('id')
          .single();

        if (insertErr) {
          logToConsole(`Error guardando causa en Supabase: ${insertErr.message}`);
        } else if (cause && !primaryCauseId) {
          primaryCauseId = cause.id;
          logToConsole(`Causa principal guardada en BD. ID: ${primaryCauseId}`);
        }
      }
    }

    // 5. Disparar Webhook a n8n con el Payload JSON Estructurado de UI/BKND.md
    let webhookDispatched = false;
    let webhookErrorMsg: string | null = null;

    if (webhookUrl && webhookUrl.trim() !== '') {
      try {
        logToConsole(`Disparando POST hacia Webhook N8N: ${webhookUrl}`);
        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'post_published',
            project_id: payload.projectId || null,
            cause_id: primaryCauseId,
            title: payload.title || '',
            same_day_scheduled: payload.sameDayScheduled || false,
            base_scheduled_date: payload.baseScheduledDate || null,
            base_scheduled_time: payload.baseScheduledTime || null,
            blocks: processedBlocks,
            // Fallback para n8n workflows legacy
            caption: processedBlocks[0]?.caption || payload.caption || '',
            media_urls: processedBlocks[0]?.media_urls || payload.mediaUrls || [],
            media_binaries: processedBlocks[0]?.media_binaries || [],
            platforms: processedBlocks[0]?.platforms || payload.platforms || [],
            org_id: validOrgId,
            timestamp: new Date().toISOString(),
          }),
        });

        if (webhookRes.ok) {
          webhookDispatched = true;
          logToConsole(`¡RESPUESTA EXITOSA DE N8N! Status HTTP: ${webhookRes.status}`);
        } else {
          const errText = await webhookRes.text();
          webhookErrorMsg = `N8N retornó estado HTTP ${webhookRes.status}: ${errText.slice(0, 100)}`;
          logToConsole(`Error N8N Status HTTP ${webhookRes.status}: ${errText}`);
        }
      } catch (webhookErr: any) {
        webhookErrorMsg = webhookErr?.message || 'Fallo de red al conectar con N8N';
        logToConsole(`Excepción disparando Webhook a N8N: ${webhookErrorMsg}`);
      }
    } else {
      webhookErrorMsg = 'No hay ninguna URL de Webhook N8N configurada en los Ajustes ni en variables de entorno.';
      logToConsole(webhookErrorMsg);
    }

    if (!webhookDispatched) {
      return {
        success: false,
        causeId: primaryCauseId,
        webhookDispatched: false,
        error: webhookErrorMsg || 'No se pudo enviar el contenido al Webhook de n8n.',
      };
    }

    logger.info('action.publish.ok', { user: user.email || user.id, org: validOrgId, cause_id: primaryCauseId });

    return {
      success: true,
      causeId: primaryCauseId,
      webhookDispatched: true,
      message: '¡Publicación enviada al webhook de n8n exitosamente!',
    };
  } catch (error: any) {
    logger.error('action.publish.failed', { error: error.message });
    logToConsole(`Error crítico en publishPostAction: ${error.message}`);
    return {
      success: false,
      error: error.message || 'Error desconocido al publicar.',
    };
  }
}
