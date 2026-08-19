'use server';

import { createSessionClient } from '@/lib/supabase-server';
import { authorize } from '@/lib/authz';
import { logger } from '@/lib/logger';
import { isUuid } from '@/lib/validation';

/**
 * Lectura de la galería de medios de la organización.
 *
 * La página `/dashboard/gallery` hacía la consulta en línea, así que no había
 * forma de recargar el listado sin recargar la página entera. Con esto, la UI
 * puede refrescar la galería después de subir un archivo.
 */

export interface GalleryItem {
  id: string;
  title: string;
  media_url: string;
  created_at: string;
  status: string;
}

export interface GalleryResult {
  items: GalleryItem[];
  /** `true` si la consulta no se pudo completar (sesión caída, error de BD). */
  failed: boolean;
}

const EMPTY: GalleryResult = { items: [], failed: false };

/** Extensiones consideradas vídeo, alineadas con la whitelist de `lib/r2.ts`. */
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.avi'];

export function isVideoUrl(url: string): boolean {
  const clean = url.split('?')[0].toLowerCase();
  return VIDEO_EXTENSIONS.some((ext) => clean.endsWith(ext));
}

/**
 * Devuelve los recursos multimedia de la organización del usuario.
 *
 * Solo se listan causas con `media_url` no vacío: la galería muestra archivos,
 * no publicaciones de solo texto.
 */
export async function getGalleryItems(limit = 100): Promise<GalleryResult> {
  try {
    const auth = await authorize('action.gallery_list');
    if (!auth.ok) return { ...EMPTY, failed: true };

    const { orgId } = auth.context;
    if (!isUuid(orgId)) return EMPTY;

    const supabase = await createSessionClient();

    const { data, error } = await supabase
      .from('causes')
      .select('id, title, media_url, created_at, status')
      .eq('org_id', orgId)
      .not('media_url', 'is', null)
      .neq('media_url', '')
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 200));

    if (error) {
      logger.error('action.gallery_list.failed', { org: orgId, error: error.message });
      return { ...EMPTY, failed: true };
    }

    const items: GalleryItem[] = (data || []).map((row) => ({
      id: row.id,
      title: row.title || 'Recurso subido',
      media_url: row.media_url,
      created_at: row.created_at,
      status: row.status,
    }));

    return { items, failed: false };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('action.gallery_list.failed', { error: message });
    return { ...EMPTY, failed: true };
  }
}
