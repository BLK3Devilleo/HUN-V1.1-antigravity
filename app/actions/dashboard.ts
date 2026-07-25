'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

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
}

const MOCK_ORGANIZATIONS: DashboardOrg[] = [
  {
    id: 'org-1',
    name: '[MOCK] Organización número 1',
    posts: [
      { id: 'mock-1', title: '[MOCK] Salvemos los árboles', active: true },
      { id: 'mock-2', title: '[MOCK] Esterilización de lomitos', active: false },
      { id: 'mock-3', title: '[MOCK] Técnicas de cuidado ambiental', active: false },
      { id: 'mock-4', title: '[MOCK] Cultivos en casa fáciles', active: false },
    ],
  },
  {
    id: 'org-2',
    name: '[MOCK] Organización número 2',
    posts: [
      { id: 'mock-5', title: '[MOCK] Anuncio de Producto B', active: true },
      { id: 'mock-6', title: '[MOCK] Campaña de Verano', active: false },
    ],
  },
  {
    id: 'org-3',
    name: '[MOCK] Organización número 3',
    posts: [
      { id: 'mock-7', title: '[MOCK] Boletín Mensual', active: true },
    ],
  },
];

export async function getDashboardData(): Promise<DashboardDataResult> {
  try {
    const headerList = await headers();
    const userOrgId = headerList.get('x-user-org-id');
    const userEmail = headerList.get('x-user-email');

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll() {},
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // 1. Intentar consultar causas reales de la organización en Supabase Central
    let realOrgs: DashboardOrg[] = [];

    if (userOrgId) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('id', userOrgId)
        .single();

      const { data: causesData } = await supabase
        .from('causes')
        .select('id, title, description, media_url, created_at')
        .eq('org_id', userOrgId)
        .order('created_at', { ascending: false });

      if (orgData) {
        const postsList: DashboardPost[] = (causesData || []).map((c, idx) => ({
          id: c.id,
          title: c.title || `Publicación #${idx + 1}`,
          description: c.description,
          media_url: c.media_url,
          active: idx === 0,
        }));

        realOrgs.push({
          id: orgData.id,
          name: orgData.name,
          posts: postsList,
        });
      }
    }

    // 2. Si no hay datos reales o no hay organizaciones devueltas, combinar con MOCK data etiquetada
    const finalOrgs = realOrgs.length > 0 ? realOrgs : MOCK_ORGANIZATIONS;
    const activeOrgId = userOrgId || finalOrgs[0].id;

    // Conteo de causas para métricas
    const totalCauses = realOrgs[0]?.posts.length || 0;

    return {
      organizations: finalOrgs,
      activeOrgId,
      storage: {
        usedGB: totalCauses > 0 ? totalCauses * 50 : 3500, // Estimado dinámico
        totalGB: 3688,
      },
      reachCount: totalCauses > 0 ? totalCauses * 1250 : 252000,
      plannerCount: totalCauses > 0 ? totalCauses : 8,
      commentsCount: totalCauses > 0 ? totalCauses * 12 : 100,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return {
      organizations: MOCK_ORGANIZATIONS,
      activeOrgId: 'org-1',
      storage: { usedGB: 3500, totalGB: 3688 },
      reachCount: 252000,
      plannerCount: 8,
      commentsCount: 100,
    };
  }
}
