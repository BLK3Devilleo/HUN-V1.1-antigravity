import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import AdminModerationPanel from './ModerationPanel';

export default async function AdminPage() {
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';
  const userRole = headerList.get('x-user-role') ?? 'member';

  if (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'moderator') {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center p-6 text-white">
        <div className="backdrop-blur-xl bg-white/5 border border-red-500/20 rounded-2xl p-8 max-w-md text-center shadow-xl">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-sm text-white/50">Esta área es exclusiva para Administradores y Moderadores.</p>
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
    .eq('status', 'draft')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white p-6 md:p-10">
      {/* Fondo Glassmorphism */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[140px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[160px]" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-medium text-blue-400/80 uppercase tracking-widest mb-2">
            Panel de Control
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Moderación de Contenido
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Revisa, aprueba o rechaza los borradores subidos por los miembros. Las causas aprobadas dispararán el webhook configurado.
          </p>
        </div>

        {/* Panel Interactivo de Moderación */}
        <AdminModerationPanel initialCauses={causes || []} />
      </div>
    </div>
  );
}
