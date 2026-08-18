'use server';

import { createSessionClient } from '@/lib/supabase-server';
import { authorize } from '@/lib/authz';
import { dispatchWebhook } from '@/lib/webhook';
import { logger } from '@/lib/logger';

/**
 * Registra en la base de datos un archivo ya subido a R2.
 *
 * Se ejecuta DESPUÉS de que el navegador haya hecho el PUT a la URL
 * pre-firmada, y es el paso que cierra el flujo de subida de media.
 */
export async function saveMediaRecord(mediaUrl: string, fileName: string) {
  const event = 'action.media_save';

  try {
    const auth = await authorize(event);
    if (!auth.ok) {
      return { success: false, error: auth.error };
    }
    const { user, orgId } = auth.context;

    // La URL debe pertenecer a nuestro bucket público de R2. Sin esta
    // comprobación se podría inyectar cualquier URL externa en la BD y
    // acabaría propagándose a n8n y a las redes sociales.
    const publicBase = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
    if (!publicBase) {
      logger.error(`${event}.failed`, { reason: 'missing_r2_public_url' });
      return { success: false, error: 'El almacenamiento de medios no está configurado.' };
    }
    if (!mediaUrl.startsWith(`${publicBase.replace(/\/$/, '')}/`)) {
      logger.warn(`${event}.rejected`, { user: user.id, org: orgId, reason: 'url_outside_bucket' });
      return { success: false, error: 'La URL del archivo no pertenece al almacenamiento de la aplicación.' };
    }

    // El objeto debe estar dentro del prefijo de la propia organización, tal
    // y como lo genera `generatePresignedUploadUrl` (`orgs/{orgId}/...`).
    if (!mediaUrl.includes(`/orgs/${orgId}/`)) {
      logger.warn(`${event}.rejected`, { user: user.id, org: orgId, reason: 'cross_tenant_path' });
      return { success: false, error: 'La URL del archivo no pertenece a tu organización.' };
    }

    logger.info(`${event}.start`, { user: user.id, org: orgId, file_name: fileName });

    const supabase = await createSessionClient(true);

    const { data: cause, error: dbError } = await supabase
      .from('causes')
      .insert({
        org_id: orgId,
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

    const { data: orgData } = await supabase
      .from('organizations')
      .select('settings')
      .eq('id', orgId)
      .maybeSingle();

    const webhookUrl = orgData?.settings?.n8n_webhook_url || process.env.N8N_WEBHOOK_URL;

    // El webhook es informativo: si falla, el archivo ya está guardado y la
    // operación se considera correcta.
    const webhook = await dispatchWebhook(webhookUrl, 'media_uploaded', {
      cause_id: cause?.id,
      media_url: mediaUrl,
      file_name: fileName,
      org_id: orgId,
    });

    logger.info(`${event}.ok`, {
      user: user.id,
      org: orgId,
      cause_id: cause?.id,
      webhook: webhook.ok,
    });

    return { success: true, causeId: cause?.id, webhookDispatched: webhook.ok };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error(`${event}.failed`, { error: message });
    return { success: false, error: message };
  }
}
