'use server';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies, headers } from 'next/headers';

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
    const headerList = await headers();
    const headerOrgId = headerList.get('x-user-org-id');
    const headerUserRole = headerList.get('x-user-role');

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

    const { data: { user } } = await supabase.auth.getUser();
    
    let rawOrgId = headerOrgId || 'org-1';
    let userRole = headerUserRole || 'admin';

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id, role')
        .eq('id', user.id)
        .single();

      if (profile) {
        rawOrgId = profile.org_id;
        userRole = profile.role;
      }
    }

    if (userRole !== 'owner' && userRole !== 'admin') {
      throw new Error('Solo los administradores o propietarios pueden configurar Webhooks');
    }

    const adminClient = getAdminClient();
    const dbClient = adminClient || supabase;

    // Buscar el ID real de la organización (UUID)
    let targetOrgId: string | null = null;
    let currentSettings: any = {};

    if (rawOrgId && isUuid(rawOrgId)) {
      const { data: orgData } = await dbClient
        .from('organizations')
        .select('id, settings')
        .eq('id', rawOrgId)
        .maybeSingle();

      if (orgData) {
        targetOrgId = orgData.id;
        currentSettings = orgData.settings || {};
      }
    }

    // Fallback: Si rawOrgId no es UUID o no existía, usar la primera organización
    if (!targetOrgId) {
      const { data: firstOrg } = await dbClient
        .from('organizations')
        .select('id, settings')
        .limit(1)
        .maybeSingle();

      if (firstOrg) {
        targetOrgId = firstOrg.id;
        currentSettings = firstOrg.settings || {};
      }
    }

    if (!targetOrgId) {
      throw new Error('No existe ninguna organización activa en la base de datos para asignar el Webhook.');
    }

    // Actualizar webhook
    const newSettings = {
      ...currentSettings,
      n8n_webhook_url: webhookUrl,
    };

    const { error: updateError } = await dbClient
      .from('organizations')
      .update({ settings: newSettings })
      .eq('id', targetOrgId);

    if (updateError) {
      throw new Error(`Error al actualizar organización: ${updateError.message}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error guardando webhook:', error);
    return { success: false, error: error.message };
  }
}

export async function getN8nWebhook() {
  try {
    const headerList = await headers();
    const headerOrgId = headerList.get('x-user-org-id');

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

    const { data: { user } } = await supabase.auth.getUser();
    let rawOrgId = headerOrgId || 'org-1';

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single();

      if (profile) {
        rawOrgId = profile.org_id;
      }
    }

    const adminClient = getAdminClient();
    const dbClient = adminClient || supabase;

    let orgData = null;
    if (rawOrgId && isUuid(rawOrgId)) {
      const { data } = await dbClient
        .from('organizations')
        .select('settings')
        .eq('id', rawOrgId)
        .maybeSingle();
      orgData = data;
    }

    if (!orgData) {
      const { data } = await dbClient
        .from('organizations')
        .select('settings')
        .limit(1)
        .maybeSingle();
      orgData = data;
    }

    return { url: orgData?.settings?.n8n_webhook_url || '' };
  } catch (error) {
    return { url: '' };
  }
}
