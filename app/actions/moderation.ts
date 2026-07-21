'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function moderateCause(causeId: string, decision: 'approved' | 'rejected', reason?: string) {
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

    // 2. Verificar Rol (Admin o Moderador)
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) throw new Error('Perfil no encontrado');
    if (!['owner', 'admin', 'moderator'].includes(profile.role)) {
      throw new Error('No tienes permisos de moderador');
    }

    // 3. Actualizar el estado de la Causa
    const { data: updatedCause, error: updateError } = await supabase
      .from('causes')
      .update({
        status: decision,
        rejection_reason: decision === 'rejected' ? reason : null
      })
      .eq('id', causeId)
      .select('id, media_url, title, status, org_id')
      .single();

    if (updateError) {
      throw new Error(`Error actualizando causa: ${updateError.message}`);
    }

    // 4. Guardar registro en Moderation Reviews
    await supabase.from('cause_moderation_reviews').insert({
      cause_id: causeId,
      moderator_id: user.id,
      decision: decision,
      notes: reason || ''
    });

    // 5. Disparar Webhook de Aprobación a n8n
    if (decision === 'approved') {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', profile.org_id)
        .single();

      const webhookUrl = orgData?.settings?.n8n_webhook_url || process.env.N8N_WEBHOOK_URL;
      
      if (webhookUrl) {
        try {
          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event: 'cause_approved',
              cause_id: updatedCause.id,
              media_url: updatedCause.media_url,
              title: updatedCause.title,
              org_id: updatedCause.org_id,
            }),
          });
        } catch (webhookErr) {
          console.error('Error disparando webhook de aprobación:', webhookErr);
        }
      }
    }

    return { success: true, status: updatedCause.status };
  } catch (error: any) {
    console.error('Error moderating cause:', error);
    return { success: false, error: error.message };
  }
}
