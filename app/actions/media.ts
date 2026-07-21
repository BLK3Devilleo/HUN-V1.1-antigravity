'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function saveMediaRecord(mediaUrl: string, fileName: string) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
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
    if (!user) {
      throw new Error('Usuario no autenticado');
    }

    // 2. Obtener el org_id del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      throw new Error('Perfil no encontrado');
    }

    // 3. Guardar en la Base de Datos Central como una Causa en borrador
    const { data: cause, error: dbError } = await supabase
      .from('causes')
      .insert({
        org_id: profile.org_id,
        creator_id: user.id,
        title: `Upload: ${fileName}`,
        description: 'Auto-generado desde la subida rápida de dashboard',
        media_url: mediaUrl,
        status: 'draft',
      })
      .select('id')
      .single();

    if (dbError) {
      throw new Error(`Error en BD: ${dbError.message}`);
    }

    // 4. Obtener el Webhook Configurado de la Organización
    const { data: orgData } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', profile.org_id)
      .single();

    const tenantWebhook = orgData?.settings?.n8n_webhook_url;
    const webhookUrl = tenantWebhook || process.env.N8N_WEBHOOK_URL;

    // 5. Disparar Webhook a n8n
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event: 'media_uploaded',
            cause_id: cause?.id,
            media_url: mediaUrl,
            file_name: fileName,
            org_id: profile.org_id,
          }),
        });
        console.log('Webhook disparado exitosamente a n8n');
      } catch (webhookErr) {
        console.error('Error disparando webhook:', webhookErr);
        // No lanzamos error para no frenar la UI, el archivo ya se guardó
      }
    }

    return { success: true, causeId: cause?.id };
  } catch (error: any) {
    console.error('Error saving media record:', error);
    return { success: false, error: error.message };
  }
}
