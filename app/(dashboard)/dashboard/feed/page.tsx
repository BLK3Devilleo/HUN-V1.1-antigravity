import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';
import Link from 'next/link';

export const revalidate = 60; // ISR cache every 60s

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
    <div className="min-h-screen bg-[#D9D9D9] text-gray-900 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-black bg-white px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
          <span className="text-xs font-black uppercase tracking-widest bg-emerald-600 text-white px-4 py-1.5 rounded-full shadow-sm">
            Comunidad Activa
          </span>
        </div>

        {/* Header Estilo Don Emilio */}
        <div className="bg-white rounded-[35px] p-8 shadow-xl border border-white/40 text-center max-w-3xl mx-auto">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
            Red de Impacto Social NUH
          </p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Feed Global de Causas Aprobadas
          </h1>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            Explora las iniciativas aprobadas por las organizaciones asociadas a Build 4 Venezuela. Selecciona cualquier recurso para multiplicarlo en tus redes.
          </p>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(!causes || causes.length === 0) ? (
            <div className="col-span-full py-16 text-center bg-white rounded-[35px] p-8 shadow-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-gray-900">Aún no hay contenido disponible</h3>
              <p className="text-xs text-gray-500 mt-2">Las causas aprobadas por los moderadores aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            causes.map((cause: any) => (
              <div key={cause.id} className="group relative bg-white border border-white/60 rounded-[30px] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col h-full">
                
                {/* Container Multimedia */}
                <div className="relative w-full pt-[110%] bg-gray-100 overflow-hidden">
                  {cause.media_url.endsWith('.mp4') || cause.media_url.endsWith('.mov') ? (
                    <video 
                      src={cause.media_url} 
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loop muted playsInline
                      onMouseOver={e => (e.target as HTMLVideoElement).play()}
                      onMouseOut={e => (e.target as HTMLVideoElement).pause()}
                    />
                  ) : (
                    <Image 
                      src={cause.media_url} 
                      alt={cause.title} 
                      fill 
                      className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      unoptimized 
                    />
                  )}
                  
                  {/* Tag Org */}
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md border border-white/50 px-3 py-1.5 rounded-full flex items-center gap-2 shadow-md">
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                    <span className="text-[10px] font-black text-gray-900 uppercase tracking-wider">
                      {cause.organizations?.name || 'Comunidad'}
                    </span>
                  </div>
                </div>

                {/* Texto */}
                <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900 leading-snug">
                      {cause.title}
                    </h3>
                    <p className="text-xs text-gray-600 line-clamp-2 mt-1 font-medium">
                      {cause.description}
                    </p>
                  </div>
                  
                  {/* Metadatos */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {cause.total_shares || 0} Difusiones
                    </div>
                    <button className="text-xs font-extrabold bg-black text-white px-4 py-2 rounded-full hover:scale-105 transition-transform shadow-md">
                      Difundir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
