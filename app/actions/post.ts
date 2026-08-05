'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

export interface PublishPostPayload {
  title?: string;
  caption: string;
  mediaUrls: string[];
  platforms: string[];
  orgId?: string;
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

export async function publishPostAction(payload: PublishPostPayload) {
  try {
    const headerList = await headers();
    const headerOrgId = headerList.get('x-user-org-id');

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

    const { data: { user } } = await supabase.auth.getUser();
    let rawOrgId = payload.orgId || headerOrgId || '';

    if (user && !payload.orgId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
      if (profile?.org_id) {
        rawOrgId = profile.org_id;
      }
    }

    const adminClient = getAdminClient();
    const dbClient = adminClient || supabase;

    // 1. Obtener la organización real en la BD y su Webhook N8N
    let validOrgId: string | null = null;
    let webhookUrl: string | undefined = process.env.N8N_WEBHOOK_URL;

    if (process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL) {
      let orgData = null;
      if (rawOrgId && isUuid(rawOrgId)) {
        const { data } = await dbClient
          .from('organizations')
          .select('id, settings')
          .eq('id', rawOrgId)
          .maybeSingle();
        orgData = data;
      }

      if (!orgData) {
        const { data } = await dbClient
          .from('organizations')
          .select('id, settings')
          .limit(1)
          .maybeSingle();
        orgData = data;
      }

      if (orgData) {
        validOrgId = orgData.id;
        if (orgData.settings?.n8n_webhook_url) {
          webhookUrl = orgData.settings.n8n_webhook_url;
        }
      }
    }

    // 2. Guardar Causa / Publicación en Supabase Central
    let causeId: string | undefined;

    if (process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL) {
      let initialStatus = 'pending_moderation';
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role && ['owner', 'admin', 'moderator'].includes(profile.role)) {
          initialStatus = 'approved';
        }
      }

      const { data: cause, error: insertErr } = await dbClient
        .from('causes')
        .insert({
          org_id: validOrgId,
          creator_id: user?.id || null,
          title: payload.title || 'Publicación sin título',
          description: payload.caption,
          media_url: payload.mediaUrls[0] || '',
          status: initialStatus,
        })
        .select('id')
        .single();

      if (insertErr) {
        console.error('[publishPostAction] Error guardando causa en Supabase:', insertErr.message);
      } else if (cause) {
        causeId = cause.id;
      }
    }

    // 3. Preparar los datos binarios en Base64 para que n8n pueda procesar los archivos directamente
    const mediaBinaries: Array<{ url: string; base64: string; mime_type: string; file_name: string }> = [];

    if (payload.mediaUrls && payload.mediaUrls.length > 0) {
      for (let i = 0; i < payload.mediaUrls.length; i++) {
        const url = payload.mediaUrls[i];
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
          console.warn('[publishPostAction] No se pudo convertir URL a binario base64:', url, fetchErr);
        }
      }
    }

    // 4. Disparar Webhook a n8n para envío a redes sociales
    let webhookDispatched = false;
    let webhookErrorMsg: string | null = null;

    if (webhookUrl && webhookUrl.trim() !== '') {
      try {
        console.log('[publishPostAction] Enviando POST a Webhook N8N:', webhookUrl);
        const webhookRes = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'post_published',
            cause_id: causeId,
            title: payload.title || '',
            caption: payload.caption,
            media_urls: payload.mediaUrls,
            media_binaries: mediaBinaries,
            platforms: payload.platforms,
            org_id: validOrgId || rawOrgId,
            timestamp: new Date().toISOString(),
          }),
        });

        if (webhookRes.ok) {
          webhookDispatched = true;
          console.log('[publishPostAction] Webhook enviado con éxito. Status:', webhookRes.status);
        } else {
          const errText = await webhookRes.text();
          webhookErrorMsg = `N8N retornó estado HTTP ${webhookRes.status}: ${errText.slice(0, 100)}`;
          console.error('[publishPostAction] Error en respuesta de N8N:', webhookErrorMsg);
        }
      } catch (webhookErr: any) {
        webhookErrorMsg = webhookErr?.message || 'Fallo de red al conectar con N8N';
        console.error('[publishPostAction] Excepción enviando webhook a n8n:', webhookErr);
      }
    } else {
      webhookErrorMsg = 'No hay ninguna URL de Webhook N8N configurada en los Ajustes ni en variables de entorno.';
    }

    if (!webhookDispatched) {
      return {
        success: false,
        causeId,
        webhookDispatched: false,
        error: webhookErrorMsg || 'No se pudo enviar el contenido al Webhook de n8n.',
      };
    }

    return {
      success: true,
      causeId,
      webhookDispatched: true,
      message: '¡Publicación enviada al webhook de n8n exitosamente!',
    };
  } catch (error: any) {
    console.error('Error publicando post:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al publicar.',
    };
  }
}
