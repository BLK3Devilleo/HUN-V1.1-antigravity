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

    let targetOrgId = payload.orgId || headerOrgId || 'org-1';
    let creatorId = user?.id;

    if (user && !payload.orgId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();
      if (profile?.org_id) {
        targetOrgId = profile.org_id;
      }
    }

    const adminClient = getAdminClient();
    const dbClient = adminClient || supabase;

    // 1. Guardar Causa / Publicación en Supabase Central
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

      const { data: cause } = await dbClient
        .from('causes')
        .insert({
          org_id: targetOrgId || null,
          creator_id: creatorId || null,
          title: payload.title || 'Publicación sin título',
          description: payload.caption,
          media_url: payload.mediaUrls[0] || '',
          status: initialStatus,
        })
        .select('id')
        .single();

      if (cause) {
        causeId = cause.id;
      }
    }

    // 2. Obtener la URL del Webhook de n8n desde las organizaciones
    let webhookUrl: string | undefined = process.env.N8N_WEBHOOK_URL;

    if (targetOrgId && process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL) {
      const { data: orgData } = await dbClient
        .from('organizations')
        .select('settings')
        .eq('id', targetOrgId)
        .single();

      if (orgData?.settings?.n8n_webhook_url) {
        webhookUrl = orgData.settings.n8n_webhook_url;
      }
    }

    // 3. Disparar Webhook a n8n para envío a redes sociales
    let webhookDispatched = false;

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'post_published',
            cause_id: causeId,
            caption: payload.caption,
            media_urls: payload.mediaUrls,
            platforms: payload.platforms,
            org_id: targetOrgId,
            timestamp: new Date().toISOString(),
          }),
        });
        webhookDispatched = true;
      } catch (webhookErr) {
        console.error('Error enviando webhook a n8n:', webhookErr);
      }
    }

    return {
      success: true,
      causeId,
      webhookDispatched,
      message: webhookDispatched
        ? '¡Publicación enviada al webhook de n8n exitosamente!'
        : '¡Publicación guardada correctamente!',
    };
  } catch (error: any) {
    console.error('Error publicando post:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al publicar.',
    };
  }
}
