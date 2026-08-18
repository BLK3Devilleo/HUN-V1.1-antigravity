'use server';

import { createSessionClient } from '@/lib/supabase-server';
import { authorize } from '@/lib/authz';
import { logger } from '@/lib/logger';

export interface DashboardPost {
  id: string;
  title: string;
  description?: string;
  media_url?: string;
  active?: boolean;
}

export interface DashboardOrg {
  id: string;
  name: string;
  posts: DashboardPost[];
}

export interface DashboardDataResult {
  organizations: DashboardOrg[];
  activeOrgId: string;
  storage: {
    usedGB: number;
    totalGB: number;
  };
  reachCount: number;
  plannerCount: number;
  commentsCount: number;
  /**
   * `true` cuando no se pudieron cargar datos reales (sin sesión o error de
   * consulta). Permite a la UI mostrar un estado vacío honesto en lugar de
   * cifras inventadas.
   */
  isEmpty: boolean;
}

/** Cuota de almacenamiento del plan, en GB. */
const STORAGE_QUOTA_GB = 3688;

/**
 * Estado vacío. Sustituye a los antiguos `MOCK_ORGANIZATIONS`, que devolvían
 * organizaciones y métricas ficticias ("252.000 de alcance") indistinguibles
 * de datos reales para el usuario final.
 */
const EMPTY_RESULT: DashboardDataResult = {
  organizations: [],
  activeOrgId: '',
  storage: { usedGB: 0, totalGB: STORAGE_QUOTA_GB },
  reachCount: 0,
  plannerCount: 0,
  commentsCount: 0,
  isEmpty: true,
};

export async function getDashboardData(): Promise<DashboardDataResult> {
  try {
    const auth = await authorize('action.dashboard_data');
    if (!auth.ok) return EMPTY_RESULT;

    const { orgId } = auth.context;
    const supabase = await createSessionClient();

    const [{ data: orgData }, { data: causesData, error: causesError }] = await Promise.all([
      supabase.from('organizations').select('id, name').eq('id', orgId).maybeSingle(),
      supabase
        .from('causes')
        .select('id, title, description, media_url, status, created_at')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(100),
    ]);

    if (!orgData) {
      logger.warn('action.dashboard_data.empty', { org: orgId, reason: 'org_not_found' });
      return EMPTY_RESULT;
    }
    if (causesError) {
      logger.error('action.dashboard_data.query_failed', { org: orgId, error: causesError.message });
    }

    const causes = causesData || [];

    const posts: DashboardPost[] = causes.map((c, idx) => ({
      id: c.id,
      title: c.title || `Publicación #${idx + 1}`,
      description: c.description ?? undefined,
      media_url: c.media_url ?? undefined,
      active: idx === 0,
    }));

    // Métricas derivadas de datos reales. Las que aún no tienen origen en la
    // base de datos (alcance, comentarios) se devuelven a 0 en lugar de
    // simularse: es preferible un cero honesto a una cifra inventada.
    const scheduledCount = causes.filter(
      (c) => c.status === 'approved' || c.status === 'pending_moderation'
    ).length;

    return {
      organizations: [{ id: orgData.id, name: orgData.name, posts }],
      activeOrgId: orgData.id,
      storage: { usedGB: 0, totalGB: STORAGE_QUOTA_GB },
      reachCount: 0,
      plannerCount: scheduledCount,
      commentsCount: 0,
      isEmpty: causes.length === 0,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    logger.error('action.dashboard_data.failed', { error: message });
    return EMPTY_RESULT;
  }
}
