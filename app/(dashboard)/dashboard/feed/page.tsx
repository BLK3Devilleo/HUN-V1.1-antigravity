import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Layers } from 'lucide-react';
import FeedGrid from '@/components/dashboard/FeedGrid';

export const revalidate = 60;

export default async function GlobalFeedPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );

  const { data: causes } = await supabase
    .from('causes')
    .select(`
      id, 
      title, 
      description, 
      media_url, 
      created_at,
      total_shares,
      organizations!inner ( name )
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false })
    .limit(30);

  const formattedCauses = (causes || []).map((c: any) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    media_url: c.media_url,
    created_at: c.created_at,
    total_shares: c.total_shares || 0,
    organizations: c.organizations ? { name: c.organizations.name } : undefined,
  }));

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-black p-4 sm:p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-[#C4C4C4] hover:bg-[#B5B5B5] px-5 py-2.5 rounded-full shadow-sm transition-all w-fit cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
            <span>Volver al Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 bg-[#C4C4C4] text-black px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm w-fit">
            <Sparkles className="w-4 h-4 text-emerald-700" />
            <span>Comunidad Activa</span>
          </div>
        </div>

        {/* Header Principal Bento Box (Estilo Don Emilio) */}
        <div className="bg-[#D9D9D9] border border-black/5 rounded-[28px] p-8 shadow-sm relative overflow-hidden folder-shape">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-black" />
              Red de Impacto Social NUH
            </span>
          </div>

          <h1 className="nuh-title text-3xl sm:text-4xl md:text-5xl font-extrabold text-black tracking-tight leading-tight mb-3">
            Feed Global de Causas Aprobadas
          </h1>

          <p className="text-sm text-[#666666] font-semibold max-w-2xl leading-relaxed">
            Explora las iniciativas comunitarias aprobadas por las organizaciones asociadas a Build 4 Venezuela. Selecciona cualquier recurso para difundirlo masivamente.
          </p>
        </div>

        {/* Grid Responsive Bento Box Animado */}
        <FeedGrid causes={formattedCauses} />

      </div>
    </div>
  );
}
