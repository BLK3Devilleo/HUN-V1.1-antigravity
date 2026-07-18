import { getByodbStatus } from '@/app/actions/byodb';
import ConnectByodbForm from '@/components/ConnectByodbForm';
import { headers } from 'next/headers';

export default async function SettingsPage() {
  const byodbStatus = await getByodbStatus();
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';
  const userRole = headerList.get('x-user-role') ?? 'member';
  const userEmail = headerList.get('x-user-email') ?? '';

  return (
    <div className="min-h-screen bg-[#0d0e12] text-white p-6 md:p-10">
      {/* Fondo Glassmorphism */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/6 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/6 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <p className="text-xs font-medium text-blue-400/80 uppercase tracking-widest mb-2">
            Configuración del Sistema
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Central de Mando — Ajustes
          </h1>
          <p className="mt-2 text-sm text-white/40">
            Gestiona tu base de datos local y las configuraciones de la organización
          </p>
        </div>

        {/* Card: Información de la Sesión */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">
            Sesión Activa
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Correo</p>
              <p className="text-sm text-white font-mono truncate">{userEmail}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Rol</p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-400 text-xs font-medium capitalize">
                {userRole}
              </span>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Org ID</p>
              <p className="text-xs text-white/60 font-mono truncate">{orgId}</p>
            </div>
          </div>
        </div>

        {/* Card: Conexión BYODB */}
        <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 shadow-xl">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-sm font-semibold text-white/80 uppercase tracking-wide mb-1">
                Base de Datos Local (BYODB)
              </h2>
              <p className="text-xs text-white/40 max-w-sm">
                Conecta tu propio proyecto de Supabase. Tu contenido y tokens de redes sociales
                se almacenarán en tu infraestructura privada.
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              {/* Icono de base de datos */}
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="1.5" />
                  <path d="M3 5v14a9 3 0 0 0 18 0V5" strokeWidth="1.5" />
                  <path d="M3 12a9 3 0 0 0 18 0" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>

          <ConnectByodbForm
            isConnected={byodbStatus.connected}
            connectedDomain={byodbStatus.url}
          />

          {/* Instrucciones */}
          {!byodbStatus.connected && (
            <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <p className="text-xs font-medium text-amber-400 mb-2">📋 Cómo obtener tus credenciales</p>
              <ol className="text-xs text-white/50 space-y-1 list-decimal list-inside">
                <li>Crea un proyecto en <span className="text-blue-400">supabase.com</span></li>
                <li>Ve a Project Settings → API</li>
                <li>Copia la &ldquo;Project URL&rdquo; y la &ldquo;anon public key&rdquo;</li>
                <li>Ejecuta el script SQL en <code className="text-blue-300">supabase/migrations/002_schema_local_byodb.sql</code></li>
              </ol>
            </div>
          )}
        </div>

        {/* Card: Próximas Configuraciones (bloqueadas) */}
        <div className="backdrop-blur-xl bg-white/3 border border-white/5 rounded-2xl p-6 shadow-xl opacity-50">
          <h2 className="text-sm font-semibold text-white/50 uppercase tracking-wide mb-4">
            Cuentas de Redes Sociales
          </h2>
          <div className="flex items-center gap-3 text-xs text-white/30">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth="1.5"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="1.5"/>
            </svg>
            Disponible después de conectar la base de datos local
          </div>
        </div>
      </div>
    </div>
  );
}
