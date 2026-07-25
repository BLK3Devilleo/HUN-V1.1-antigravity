import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import GalleryWorkspace from '@/components/dashboard/GalleryWorkspace';
import { ArrowLeft, HardDrive, Sparkles } from 'lucide-react';

export default async function GalleryPage() {
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';

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
    .select('id, title, media_url, created_at, status')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  const galleryItems = (causes || [])
    .filter(c => c.media_url && c.media_url.trim() !== '')
    .map(c => ({
      id: c.id,
      title: c.title || 'Recurso subido',
      media_url: c.media_url,
      created_at: c.created_at,
      status: c.status,
    }));

  return (
    <div className="min-h-screen bg-[#F2F2F2] text-black p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Bar - Estilo Bento Don Emilio */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-[#C4C4C4] hover:bg-[#B5B5B5] px-5 py-2.5 rounded-full shadow-sm transition-all w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
            <span>Volver al Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 bg-[#C4C4C4] text-black px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm w-fit">
            <HardDrive className="w-4 h-4 text-black" />
            <span>Cloudflare R2 Storage</span>
          </div>
        </div>

        {/* Header Principal Bento Box (Estilo Don Emilio) */}
        <div className="bg-[#D9D9D9] border border-black/5 rounded-[28px] p-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-black" />
              Biblioteca Multimedia NUH
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-black tracking-tight leading-tight mb-3">
            Mi Galería de Archivos Subidos
          </h1>

          <p className="text-sm text-[#666666] font-semibold max-w-2xl leading-relaxed">
            Visualiza, gestiona y selecciona las imágenes y videos cargados por tu organización para utilizarlos inmediatamente en tus campañas y publicaciones automáticas.
          </p>
        </div>

        {/* Componente Interactivo Bento */}
        <GalleryWorkspace initialItems={galleryItems} />

      </div>
    </div>
  );
}
