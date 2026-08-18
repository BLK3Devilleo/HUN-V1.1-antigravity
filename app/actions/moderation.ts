'use server';

import { createSessionClient } from '@/lib/supabase-server';
import { authorize } from '@/lib/authz';
import { dispatchWebhook } from '@/lib/webhook';
import { logger } from '@/lib/logger';
import { isUuid } from '@/lib/validation';

export async function moderateCause(
  causeId: string,
  decision: 'approved' | 'rejected',
  reason?: string
) {
  const event = 'action.moderate';

  try {
    // Comprobación de permisos centralizada: moderator o superior.
    const auth = await authorize(event, 'moderator');
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }
    const { user, orgId, role } = auth.context;

    if (!isUuid(causeId)) {
      return { success: false, error: 'Identificador de publicación no válido.' };
    }

    logger.info(`${event}.start`, { user: user.id, org: orgId, role, cause_id: causeId });

    const supabase = await createSessionClient(true);

    // El filtro por org_id impide moderar contenido de otra organización
    // aunque se conozca el UUID (defensa en profundidad junto al RLS).
    const { data: updatedCause, error: updateError } = await supabase
      .from('causes')
      .update({
        status: decision,
        rejection_reason: decision === 'rejected' ? reason : null,
      })
      .eq('id', causeId)
      .eq('org_id', orgId)
      .select('id, media_url, title, status, org_id')
      .single();

    if (updateError) {
      throw new Error(`Error actualizando causa: ${updateError.message}`);
    }
    if (!updatedCause) {
      return { success: false, error: 'La publicación no existe o no pertenece a tu organización.' };
    }

    const { error: reviewError } = await supabase.from('cause_moderation_reviews').insert({
      cause_id: causeId,
      moderator_id: user.id,
      decision,
      notes: reason || '',
    });

    // El registro de auditoría no debe tumbar la moderación, pero sí constar.
    if (reviewError) {
      logger.error(`${event}.review_insert_failed`, {
        cause_id: causeId,
        error: reviewError.message,
      });
    }

    let webhookDispatched = false;

    if (decision === 'approved') {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('settings')
        .eq('id', orgId)
        .maybeSingle();

      const webhookUrl = orgData?.settings?.n8n_webhook_url || process.env.N8N_WEBHOOK_URL;

      const result = await dispatchWebhook(webhookUrl, 'cause_approved', {
        cause_id: updatedCause.id,
        media_url: updatedCause.media_url,
        title: updatedCause.title,
        org_id: updatedCause.org_id,
      });
      webhookDispatched = result.ok;
    }

    logger.info(`${event}.ok`, {
      user: user.id,
      org: orgId,
      cause_id: causeId,
      decision,
      webhook: webhookDispatched,
    });

    // Se informa del estado del webhook para que la UI pueda avisar de que la
    // decisión se guardó pero la automatización no llegó a dispararse.
    return { success: true, status: updatedCause.status, webhookDispatched };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`${event}.failed`, { cause_id: causeId, error: message });
    return { success: false, error: message };
  }
}
