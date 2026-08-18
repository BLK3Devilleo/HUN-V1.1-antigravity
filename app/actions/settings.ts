'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getAuthContext } from '@/lib/auth';
import { logger } from '@/lib/logger';

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

export async function saveN8nWebhook(webhookUrl: string) {
  try {
    // Resolver contexto de autenticación de forma segura (no confiar en headers)
    const { user, orgId: rawOrgId, role: userRole } = await getAuthContext();

    if (!user || !rawOrgId) {
      logger.warn('action.webhook_save.denied', { reason: 'unauthenticated' });
      return { success: false, error: 'No se pudo identificar tu organización' };
    }

    if (userRole !== 'owner' && userRole !== 'admin') {
      logger.warn('action.webhook_save.denied', { user: user.email || user.id, org: rawOrgId, role: userRole, reason: 'insufficient_permissions' });
      return { success: false, error: 'Solo los administradores o propietarios pueden configurar Webhooks' };
    }

    logger.info('action.webhook_save.start', { user: user.email || user.id, org: rawOrgId, role: userRole });

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
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

    // Buscar el ID real de la organización (UUID) del usuario autenticado
    const { data: orgData } = isUuid(rawOrgId)
      ? await dbClient
          .from('organizations')
          .select('id, settings')
          .eq('id', rawOrgId)
          .maybeSingle()
      : { data: null };

    if (!orgData) {
      return { success: false, error: 'No existe ninguna organización activa en la base de datos para asignar el Webhook.' };
    }

    const currentSettings: any = orgData.settings || {};

    // Actualizar webhook
    const newSettings = {
      ...currentSettings,
      n8n_webhook_url: webhookUrl,
    };

    const { error: updateError } = await dbClient
      .from('organizations')
      .update({ settings: newSettings })
      .eq('id', orgData.id);

    if (updateError) {
      throw new Error(`Error al actualizar organización: ${updateError.message}`);
    }

    logger.info('action.webhook_save.ok', { user: user.email || user.id, org: orgData.id });

    return { success: true };
  } catch (error: any) {
    logger.error('action.webhook_save.failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

export async function getN8nWebhook() {
  try {
    // Resolver contexto de autenticación de forma segura (no confiar en headers)
    const { orgId: rawOrgId } = await getAuthContext();

    if (!rawOrgId) return { url: '' };

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
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

    const { data: orgData } = isUuid(rawOrgId)
      ? await dbClient
          .from('organizations')
          .select('settings')
          .eq('id', rawOrgId)
          .maybeSingle()
      : { data: null };

    return { url: orgData?.settings?.n8n_webhook_url || '' };
  } catch (error) {
    return { url: '' };
  }
}
