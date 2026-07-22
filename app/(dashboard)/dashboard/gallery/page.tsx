import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import GalleryWorkspace from '@/components/dashboard/GalleryWorkspace';

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
          <span className="text-xs font-black uppercase tracking-widest bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-sm">
            Cloudflare R2 Storage
          </span>
        </div>

        {/* Header Estilo Don Emilio */}
        <div className="bg-white rounded-[35px] p-8 shadow-xl border border-white/40">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
            Biblioteca Multimedia NUH
          </p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Mi Galería de Archivos Subidos
          </h1>
          <p className="mt-2 text-sm text-gray-600 font-medium max-w-2xl">
            Visualiza, gestiona y selecciona las imágenes y videos cargados por tu organización para utilizarlos inmediatamente en campañas y publicaciones automáticas.
          </p>
        </div>

        {/* Gallery Interactive Component */}
        <GalleryWorkspace initialItems={galleryItems} />
      </div>
    </div>
  );
}
