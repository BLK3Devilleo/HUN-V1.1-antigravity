import { getByodbStatus } from '@/app/actions/byodb';
import ConnectByodbForm from '@/components/ConnectByodbForm';
import WebhookSettingsForm from './WebhookSettingsForm';
import { headers } from 'next/headers';
import Link from 'next/link';

export default async function SettingsPage() {
  const byodbStatus = await getByodbStatus();
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';
  const userRole = headerList.get('x-user-role') ?? 'member';
  const userEmail = headerList.get('x-user-email') ?? '';

  return (
    <div className="min-h-screen bg-[#D9D9D9] text-gray-900 p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-700 hover:text-black bg-white px-5 py-2.5 rounded-full shadow-sm hover:shadow-md transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Dashboard
          </Link>
          <span className="text-xs font-black uppercase tracking-widest bg-black text-white px-4 py-1.5 rounded-full">
            Org: {orgId}
          </span>
        </div>

        {/* Header Estilo Don Emilio */}
        <div className="bg-white rounded-[35px] p-8 shadow-xl border border-white/40">
          <p className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">
            Configuración Central NUH
          </p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Ajustes & Conectividad Multi-Tenant
          </h1>
          <p className="mt-2 text-sm text-gray-600 font-medium">
            Gestiona la infraestructura privada de tu organización (BYODB), configura webhooks de orquestación n8n y verifica el estado de sesión.
          </p>
        </div>

        {/* Card: Información de la Sesión */}
        <div className="bg-white rounded-[30px] p-6 shadow-xl border border-white/50 space-y-4">
          <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">
            Sesión Activa de Usuario
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-100 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Correo Electrónico</p>
              <p className="text-xs font-extrabold text-gray-900 truncate">{userEmail || 'dev-user@example.com'}</p>
            </div>
            <div className="bg-gray-100 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Rol de Acceso</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-extrabold capitalize">
                {userRole}
              </span>
            </div>
            <div className="bg-gray-100 rounded-2xl p-4">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">ID Organización</p>
              <p className="text-xs font-mono font-bold text-gray-700 truncate">{orgId || 'dev-org-00000000'}</p>
            </div>
          </div>
        </div>

        {/* Card: Conexión BYODB */}
        <div className="bg-white rounded-[30px] p-8 shadow-xl border border-white/50 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Base de Datos Local Privada (BYODB)
              </h2>
              <p className="text-xs text-gray-600 font-medium max-w-lg mt-1">
                Conecta tu propia instancia de Supabase. Tu contenido, colas de envío y tokens de redes sociales permanecerán bajo tu control e infraestructura.
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <ellipse cx="12" cy="5" rx="9" ry="3" strokeWidth="2" />
                <path d="M3 5v14a9 3 0 0 0 18 0V5" strokeWidth="2" />
                <path d="M3 12a9 3 0 0 0 18 0" strokeWidth="2" />
              </svg>
            </div>
          </div>

          <ConnectByodbForm
            isConnected={byodbStatus.connected}
            connectedDomain={byodbStatus.url}
          />
        </div>

        {/* Card: Webhooks n8n (Solo Admin/Owner) */}
        {(userRole === 'owner' || userRole === 'admin') ? (
          <div className="bg-white rounded-[30px] p-8 shadow-xl border border-white/50 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-black text-gray-900">
                  Orquestador de Automatización (n8n Webhook)
                </h2>
                <p className="text-xs text-gray-600 font-medium max-w-lg mt-1">
                  Establece el endpoint de webhook que n8n escuchará para procesar y disparar las publicaciones hacia redes sociales.
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center border border-purple-100">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            
            <WebhookSettingsForm />
          </div>
        ) : (
          <div className="bg-white/60 rounded-[30px] p-6 text-center border border-white/40">
            <p className="text-xs font-bold text-gray-500">
              🔒 La configuración de Webhook n8n requiere privilegios de Administrador u Owner.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
