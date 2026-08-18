import Link from 'next/link';
import { ArrowLeft, Image as ImageIcon, Sparkles } from 'lucide-react';
import GalleryWorkspace from '@/components/dashboard/GalleryWorkspace';
import { getAuthContext } from '@/lib/auth';
import { createSessionClient } from '@/lib/supabase-server';

export default async function GalleryPage() {
  // Fuente de verdad: sesión + tabla `profiles`, no la cabecera `x-user-org-id`
  // (una cabecera puede falsificarse si algo llega sin pasar por el proxy).
  const { orgId } = await getAuthContext();

  const supabase = await createSessionClient();

  const { data: causes } = orgId
    ? await supabase
        .from('causes')
        .select('id, title, media_url, created_at, status')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
    : { data: [] };

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
    <div className="min-h-screen bg-[#F6F6F6] text-black px-4 py-8 sm:px-8 md:px-12 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-[#E2E2E2] hover:bg-[#D4D4D4] px-5 py-2.5 rounded-full shadow-sm transition-all w-fit cursor-pointer border border-black/5"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
            <span>Volver al Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 bg-white border border-black/10 text-black px-4 py-2 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-sm w-fit">
            <ImageIcon className="w-4 h-4 text-black" />
            <span>Galería de Archivos</span>
          </div>
        </div>

        {/* Header Principal Bento Box */}
        <div className="bg-white border border-black/10 rounded-[28px] p-6 sm:p-10 shadow-sm relative space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5 bg-[#F0F0F0] px-3 py-1 rounded-full border border-black/5">
              <Sparkles className="w-4 h-4 text-black" />
              Banco de Multimedia HD
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tight leading-snug">
            Galería y Recursos Multimedia
          </h1>

          <p className="text-sm text-[#555555] font-medium max-w-2xl leading-relaxed">
            Explora todos los recursos visuales, imágenes HD y videos cargados por tu organización listos para ser reutilizados en tus publicaciones programadas.
          </p>
        </div>

        {/* Workspace de Galería */}
        <GalleryWorkspace initialItems={galleryItems} />

      </div>
    </div>
  );
}
