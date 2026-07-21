import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Image from 'next/image';

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

  // Traer las causas aprobadas aleatoriamente (get_causes_feed via RPC no recibe auth si es security definer o podemos usar select simple)
  // Usaremos select simple por ahora para MVP
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
    <div className="min-h-screen bg-[#0d0e12] text-white p-6 md:p-10 relative overflow-hidden">
      {/* Fondo Glassmorphism Dinámico */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[160px]" />
        <div className="absolute bottom-[10%] right-[20%] w-[600px] h-[600px] rounded-full bg-emerald-500/5 blur-[180px]" />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-indigo-500/5 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-white mb-4">
            Feed Global de Causas
          </h1>
          <p className="text-sm text-white/50 leading-relaxed">
            Explora y difunde el contenido aprobado por la comunidad. Cada causa que compartes amplifica el mensaje de Build 4 Venezuela.
          </p>
        </div>

        {/* Bento Box Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(!causes || causes.length === 0) ? (
            <div className="col-span-full py-20 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white/80">Aún no hay contenido</h3>
              <p className="text-sm text-white/40 mt-2">Las causas aprobadas aparecerán aquí.</p>
            </div>
          ) : (
            causes.map((cause: any) => (
              <div key={cause.id} className="group relative backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl hover:bg-white/[0.07] hover:border-white/20 transition-all duration-300 flex flex-col h-full">
                
                {/* Media Container con aspecto dinámico */}
                <div className="relative w-full pt-[120%] bg-[#050505] overflow-hidden">
                  {cause.media_url.endsWith('.mp4') || cause.media_url.endsWith('.mov') ? (
                    <video 
                      src={cause.media_url} 
                      className="absolute inset-0 w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                      loop muted playsInline
                      onMouseOver={e => (e.target as HTMLVideoElement).play()}
                      onMouseOut={e => (e.target as HTMLVideoElement).pause()}
                    />
                  ) : (
                    <Image 
                      src={cause.media_url} 
                      alt={cause.title} 
                      fill 
                      className="object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" 
                      unoptimized 
                    />
                  )}
                  
                  {/* Overlay gradiente inferior para legibilidad */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
                  
                  {/* Etiqueta de Organización */}
                  <div className="absolute top-4 left-4 backdrop-blur-md bg-black/40 border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-wider">
                      {cause.organizations?.name || 'Comunidad'}
                    </span>
                  </div>
                </div>

                {/* Contenido Textual */}
                <div className="absolute bottom-0 left-0 w-full p-5 flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-white leading-tight drop-shadow-md">
                    {cause.title}
                  </h3>
                  <p className="text-xs text-white/70 line-clamp-2 drop-shadow-sm">
                    {cause.description}
                  </p>
                  
                  {/* Metadatos y Acción */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-1.5 text-xs text-white/40">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                      </svg>
                      {cause.total_shares || 0} Difusiones
                    </div>
                    <button className="text-xs font-bold bg-white text-black px-4 py-2 rounded-full hover:scale-105 transition-transform">
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
