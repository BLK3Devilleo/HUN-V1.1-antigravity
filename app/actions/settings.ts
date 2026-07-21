'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function saveN8nWebhook(webhookUrl: string) {
  try {
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

    // 1. Obtener usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuario no autenticado');

    // 2. Obtener el org_id y verificar rol (solo admin/owner pueden actualizar configuraciones)
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Perfil no encontrado');
    if (profile.role !== 'owner' && profile.role !== 'admin') {
      throw new Error('Solo los administradores pueden configurar Webhooks');
    }

    // 3. Obtener settings actuales para no sobreescribir otros valores
    const { data: orgData } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', profile.org_id)
      .single();

    const currentSettings = orgData?.settings || {};

    // 4. Actualizar webhook
    const newSettings = {
      ...currentSettings,
      n8n_webhook_url: webhookUrl
    };

    const { error: updateError } = await supabase
      .from('organizations')
      .update({ settings: newSettings })
      .eq('id', profile.org_id);

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
    if (!user) return { url: '' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile) return { url: '' };

    const { data: orgData } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', profile.org_id)
      .single();

    return { url: orgData?.settings?.n8n_webhook_url || '' };
  } catch (error) {
    return { url: '' };
  }
}
