import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Share2, Layers } from 'lucide-react';

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

        {/* Header Principal */}
        <div className="bg-[#D9D9D9] border border-black/5 rounded-[28px] p-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-black" />
              Red de Impacto Social NUH
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black tracking-tight leading-tight mb-3">
            Feed Global de Causas Aprobadas
          </h1>

          <p className="text-sm text-[#666666] font-semibold max-w-2xl leading-relaxed">
            Explora las iniciativas comunitarias aprobadas por las organizaciones asociadas a Build 4 Venezuela. Selecciona cualquier recurso para difundirlo masivamente.
          </p>
        </div>

        {/* Grid Responsive Bento Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {(!causes || causes.length === 0) ? (
            <div className="col-span-full py-16 text-center bg-[#D9D9D9] border border-black/5 rounded-[28px] p-8 shadow-sm space-y-3">
              <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto shadow-sm">
                <Layers className="w-8 h-8 text-black/50" />
              </div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight">Aún no hay contenido disponible</h3>
              <p className="text-xs text-[#666666] font-semibold max-w-sm mx-auto">
                Las causas aprobadas por los moderadores de las organizaciones aparecerán aquí automáticamente.
              </p>
            </div>
          ) : (
            causes.map((cause: any) => (
              <div
                key={cause.id}
                className="group relative bg-[#D9D9D9] border border-black/10 rounded-[28px] p-4 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Container Multimedia */}
                  <div className="relative w-full aspect-square bg-black/10 rounded-[20px] overflow-hidden border border-black/5">
                    {cause.media_url.endsWith('.mp4') || cause.media_url.endsWith('.mov') ? (
                      <video 
                        src={cause.media_url} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        loop muted playsInline
                      />
                    ) : (
                      <Image 
                        src={cause.media_url} 
                        alt={cause.title} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-300" 
                        unoptimized 
                      />
                    )}
                    
                    {/* Badge de Organización */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-black/80 text-white px-3 py-1 rounded-full backdrop-blur-md truncate max-w-[80%] shadow-sm">
                        {cause.organizations?.name || 'Organización'}
                      </span>
                    </div>
                  </div>

                  {/* Info Text */}
                  <div className="bg-white/80 rounded-[18px] p-3.5 space-y-1 border border-black/5">
                    <h3 className="text-sm font-black text-black leading-snug truncate">{cause.title}</h3>
                    <p className="text-xs text-[#555555] font-medium line-clamp-2 leading-relaxed">
                      {cause.description || 'Sin descripción redactada.'}
                    </p>
                  </div>
                </div>

                {/* Acciones del Feed */}
                <div className="pt-3 border-t border-black/10 mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[11px] font-black text-[#555555]">
                    <Share2 className="w-3.5 h-3.5 text-black" />
                    <span>{cause.total_shares || 0} difusiones</span>
                  </div>

                  <Link
                    href="/dashboard"
                    className="btn-crear text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-full shadow-sm hover:scale-105 active:scale-95 transition-transform"
                  >
                    Difundir
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
