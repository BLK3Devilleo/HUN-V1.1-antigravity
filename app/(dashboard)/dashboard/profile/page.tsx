import Link from 'next/link';
import {
  ArrowLeft,
  User,
  Mail,
  ShieldCheck,
  Building,
  Key,
  Calendar,
  CheckCircle2,
  Sparkles,
  Settings,
  Shield,
} from 'lucide-react';
import { getAuthContext } from '@/lib/auth';

export default async function ProfilePage() {
  // Datos del perfil resueltos contra la sesión real, no contra cabeceras.
  // Se retira también el email ficticio 'dev-user@example.com': mostraba una
  // identidad inventada en lugar de la del usuario autenticado.
  const { user, orgId, role } = await getAuthContext();
  const userRole = role ?? 'member';
  const userEmail = user?.email ?? '';
  const userName = userEmail ? userEmail.split('@')[0].replace('.', ' ') : 'Usuario';

  return (
    <div className="min-h-screen bg-[#F6F6F6] text-black px-4 py-8 sm:px-8 md:px-12 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
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
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Perfil Autenticado</span>
          </div>
        </div>

        {/* Hero Card Perfil */}
        <div className="bg-white border border-black/10 rounded-[28px] p-6 sm:p-10 shadow-sm relative space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-black/10 pb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-black via-zinc-800 to-zinc-600 text-white flex items-center justify-center font-black text-2xl uppercase shadow-md border-2 border-white">
              {userName.slice(0, 2)}
            </div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-black capitalize tracking-tight">
                  {userName}
                </h1>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black capitalize bg-blue-100 text-blue-900 border border-blue-200">
                  {userRole}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-[#666666] flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-black/40" />
                {userEmail}
              </p>
            </div>

            <Link
              href="/dashboard/settings"
              className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-black bg-[#F0F0F0] hover:bg-[#E4E4E4] px-5 py-2.5 rounded-full border border-black/10 transition-all shadow-sm"
            >
              <Settings className="w-4 h-4" />
              <span>Ajustes de Cuenta</span>
            </Link>
          </div>

          {/* Detalles Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 pt-2">
            <div className="bg-[#F8F8F8] rounded-[22px] p-5 border border-black/5 space-y-2">
              <div className="flex items-center gap-2 text-[#666666]">
                <Building className="w-4 h-4 text-black" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Organización</span>
              </div>
              <p className="text-xs font-mono font-bold text-black truncate">
                {orgId || 'org-1 (Default)'}
              </p>
            </div>

            <div className="bg-[#F8F8F8] rounded-[22px] p-5 border border-black/5 space-y-2">
              <div className="flex items-center gap-2 text-[#666666]">
                <Shield className="w-4 h-4 text-black" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Permisos</span>
              </div>
              <p className="text-xs font-bold text-black capitalize">
                Acceso {userRole === 'owner' || userRole === 'admin' ? 'Total (Administrador)' : 'Miembro Estándar'}
              </p>
            </div>

            <div className="bg-[#F8F8F8] rounded-[22px] p-5 border border-black/5 space-y-2">
              <div className="flex items-center gap-2 text-[#666666]">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Estado de Cuenta</span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700">
                Verificado & Activo
              </span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
