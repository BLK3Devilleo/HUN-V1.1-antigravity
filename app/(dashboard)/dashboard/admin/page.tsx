import { headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, ShieldCheck, Sparkles } from 'lucide-react';
import AdminModerationPanel from './ModerationPanel';

export default async function AdminPage() {
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';
  const userRole = headerList.get('x-user-role') || (process.env.NODE_ENV === 'development' ? 'admin' : 'member');

  if (userRole !== 'owner' && userRole !== 'admin' && userRole !== 'moderator') {
    return (
      <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-6 text-black font-sans">
        <div className="bg-[#D9D9D9] border border-black/10 rounded-[32px] p-8 max-w-md w-full text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto text-rose-600">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Acceso Denegado</h2>
          <p className="text-xs text-[#666666] font-semibold leading-relaxed">
            Esta sección es exclusiva para Administradores y Moderadores autorizados de la Organización.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-black text-white font-black text-xs uppercase tracking-wider hover:bg-neutral-800 transition-all shadow-md active:scale-95"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Dashboard</span>
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
            <ShieldCheck className="w-4 h-4 text-purple-700" />
            <span>Rol: {userRole}</span>
          </div>
        </div>

        {/* Header Principal */}
        <div className="bg-[#D9D9D9] border border-black/5 rounded-[28px] p-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-[#666666] uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-black" />
              Panel de Moderación NUH
            </span>
          </div>

          <h1 className="nuh-title text-4xl sm:text-5xl font-black text-black tracking-tighter leading-none mb-3">
            Moderación y Aprobación de Causas
          </h1>

          <p className="text-sm text-[#666666] font-semibold max-w-2xl leading-relaxed">
            Revisa, aprueba o rechaza los borradores de iniciativas cargados por tu equipo antes de orquestar su difusión masiva hacia las redes sociales.
          </p>
        </div>

        {/* Panel Interactivo de Moderación */}
        <AdminModerationPanel initialCauses={causes || []} />

      </div>
    </div>
  );
}
