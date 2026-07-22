import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import AdminModerationPanel from './ModerationPanel';

export default async function AdminPage() {
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';
  const userRole = headerList.get('x-user-role') ?? 'member';

  if (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'moderator') {
    return (
      <div className="min-h-screen bg-[#D9D9D9] flex items-center justify-center p-6 text-gray-900">
        <div className="bg-white border border-red-200 rounded-3xl p-8 max-w-md text-center shadow-2xl">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-2xl font-black mb-2 text-gray-900">Acceso Denegado</h2>
          <p className="text-sm text-gray-600 font-medium">Esta área es exclusiva para Administradores y Moderadores autorizados.</p>
          <div className="mt-6">
            <Link href="/dashboard" className="inline-flex items-center px-6 py-2.5 rounded-full bg-black text-white font-bold text-xs uppercase tracking-wider hover:bg-gray-800 transition-transform hover:scale-105">
              Volver al Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Cargar causas pendientes
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
    .select('id, title, description, media_url, created_at, status')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-gray-900 p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-black bg-white px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
          <span className="text-xs font-black uppercase tracking-widest bg-black text-white px-4 py-1.5 rounded-full">
            Rol: {userRole}
          </span>
        </div>

        {/* Header Estilo Don Emilio */}
        <div className="bg-white rounded-[35px] p-8 shadow-xl border border-white/40">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
            Panel de Administración NUH
          </p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Moderación de Contenido & Causas
          </h1>
          <p className="mt-2 text-sm text-gray-600 font-medium max-w-2xl">
            Revisa, aprueba o rechaza publicaciones y causas globales. Al aprobar un elemento, el sistema notificará automáticamente a n8n para su difusión multi-canal.
          </p>
        </div>

        {/* Panel Interactivo de Moderación */}
        <AdminModerationPanel initialCauses={causes || []} />
      </div>
    </div>
  );
}
