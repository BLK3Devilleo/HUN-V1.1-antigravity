import { getByodbStatus } from '@/app/actions/byodb';
import ConnectByodbForm from '@/components/ConnectByodbForm';
import WebhookSettingsForm from './WebhookSettingsForm';
import { headers } from 'next/headers';
import Link from 'next/link';
import {
  ArrowLeft,
  ShieldCheck,
  Database,
  Zap,
  User,
  Mail,
  Lock,
  Building,
  CheckCircle2,
  Server,
  Sparkles
} from 'lucide-react';

export default async function SettingsPage() {
  const byodbStatus = await getByodbStatus();
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';
  const userRole = headerList.get('x-user-role') || (process.env.NODE_ENV === 'development' ? 'admin' : 'member');
  const userEmail = headerList.get('x-user-email') ?? '';

  return (
    <div className="min-h-screen bg-[#F6F6F6] text-black px-4 py-8 sm:px-8 md:px-12 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
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
            <Building className="w-4 h-4 text-black" />
            <span>ORG: {orgId || 'Desarrollo'}</span>
          </div>
        </div>

        {/* Header Principal Bento Box */}
        <div className="bg-white border border-black/10 rounded-[28px] p-6 sm:p-10 shadow-sm relative space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5 bg-[#F0F0F0] px-3 py-1 rounded-full border border-black/5">
              <Sparkles className="w-4 h-4 text-black" />
              Configuración Central NUH
            </span>
            <span className="bg-black text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full">
              Multi-Tenant v2
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tight leading-snug">
            Ajustes & Conectividad Multi-Tenant
          </h1>

          <p className="text-sm text-[#555555] font-medium max-w-2xl leading-relaxed">
            Gestiona la infraestructura privada de tu organización (BYODB), configura webhooks de orquestación n8n y verifica el estado de tu sesión activa.
          </p>
        </div>

        {/* Grid Bento: Sesión Activa de Usuario */}
        <div className="bg-white border border-black/10 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-black" />
              <h2 className="text-sm font-black text-black uppercase tracking-wider">
                Sesión Activa de Usuario
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Autenticado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-[#F8F8F8] rounded-[20px] p-5 border border-black/5 space-y-1.5">
              <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-black/50" /> Correo Electrónico
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-black truncate">
                {userEmail || 'dev-user@example.com'}
              </p>
            </div>

            <div className="bg-[#F8F8F8] rounded-[20px] p-5 border border-black/5 space-y-1.5">
              <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-black/50" /> Rol de Acceso
              </p>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black capitalize bg-blue-100 text-blue-900 border border-blue-200">
                  {userRole}
                </span>
              </div>
            </div>

            <div className="bg-[#F8F8F8] rounded-[20px] p-5 border border-black/5 space-y-1.5">
              <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-black/50" /> ID Organización
              </p>
              <p className="text-xs sm:text-sm font-mono font-bold text-black truncate">
                {orgId || 'dev-org-00000000'}
              </p>
            </div>
          </div>
        </div>

        {/* Bento Box: Conexión BYODB */}
        <div className="bg-white border border-black/10 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-black" />
                <h2 className="text-lg sm:text-xl font-black text-black">
                  Base de Datos Local Privada (BYODB)
                </h2>
              </div>
              <p className="text-xs text-[#555555] font-medium max-w-xl mt-1 leading-relaxed">
                Conecta tu propia instancia de Supabase. Tu contenido, colas de envío y tokens de redes sociales permanecerán 100% bajo tu control e infraestructura.
              </p>
            </div>

            <div className="w-12 h-12 rounded-[18px] bg-[#F4F4F4] flex items-center justify-center border border-black/5 shadow-sm">
              <Server className="w-6 h-6 text-black" />
            </div>
          </div>

          <div className="bg-[#F8F8F8] rounded-[20px] p-6 border border-black/5 shadow-sm">
            <ConnectByodbForm
              isConnected={byodbStatus.connected}
              connectedDomain={byodbStatus.url}
            />
          </div>
        </div>

        {/* Bento Box: Webhooks n8n (Solo Admin/Owner) */}
        {(userRole === 'owner' || userRole === 'admin') ? (
          <div className="bg-white border border-black/10 rounded-[28px] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-700 fill-purple-700" />
                  <h2 className="text-lg sm:text-xl font-black text-black">
                    Orquestador de Automatización (n8n Webhook)
                  </h2>
                </div>
                <p className="text-xs text-[#555555] font-medium max-w-xl mt-1 leading-relaxed">
                  Establece el endpoint de webhook que n8n escuchará para procesar y disparar las publicaciones hacia redes sociales.
                </p>
              </div>

              <div className="w-12 h-12 rounded-[18px] bg-purple-50 flex items-center justify-center border border-purple-200 shadow-sm">
                <Zap className="w-6 h-6 text-purple-700" />
              </div>
            </div>

            <div className="bg-[#F8F8F8] rounded-[20px] p-6 border border-black/5 shadow-sm">
              <WebhookSettingsForm />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[28px] p-6 text-center border border-black/10 flex items-center justify-center gap-2 shadow-sm">
            <Lock className="w-4 h-4 text-black/50" />
            <p className="text-xs font-bold text-[#666666]">
              La configuración de Webhook n8n requiere privilegios de Administrador u Owner.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
