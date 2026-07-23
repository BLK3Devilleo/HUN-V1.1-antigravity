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
    <div className="min-h-screen bg-[#F2F2F2] text-black p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
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
            <Building className="w-4 h-4 text-black" />
            <span>ORG: {orgId || 'Desarrollo'}</span>
          </div>
        </div>

        {/* Header Principal Bento Box (Estilo Don Emilio) */}
        <div className="bg-[#D9D9D9] border border-black/5 rounded-[28px] p-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-black text-[#666666] uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-black" />
              Configuración Central NUH
            </span>
            <span className="bg-black text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">
              Multi-Tenant v2
            </span>
          </div>

          <h1 className="nuh-title text-4xl sm:text-5xl font-black text-black tracking-tighter leading-none mb-3">
            Ajustes & Conectividad Multi-Tenant
          </h1>

          <p className="text-sm text-[#666666] font-semibold max-w-2xl leading-relaxed">
            Gestiona la infraestructura privada de tu organización (BYODB), configura webhooks de orquestación n8n y verifica el estado de tu sesión activa.
          </p>
        </div>

        {/* Grid Bento: Sesión Activa de Usuario */}
        <div className="bg-[#D9D9D9] border border-black/5 rounded-[28px] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-black/10 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-black" />
              <h2 className="text-xs font-black text-black uppercase tracking-wider">
                Sesión Activa de Usuario
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Autenticado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/80 rounded-[20px] p-4 border border-black/5">
              <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-black/40" /> Correo Electrónico
              </p>
              <p className="text-xs font-extrabold text-black truncate">
                {userEmail || 'dev-user@example.com'}
              </p>
            </div>

            <div className="bg-white/80 rounded-[20px] p-4 border border-black/5">
              <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-black/40" /> Rol de Acceso
              </p>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black capitalize bg-blue-100 text-blue-900 border border-blue-200">
                  {userRole}
                </span>
              </div>
            </div>

            <div className="bg-white/80 rounded-[20px] p-4 border border-black/5">
              <p className="text-[10px] font-bold text-[#666666] uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-black/40" /> ID Organización
              </p>
              <p className="text-xs font-mono font-bold text-black truncate">
                {orgId || 'dev-org-00000000'}
              </p>
            </div>
          </div>
        </div>

        {/* Bento Box: Conexión BYODB */}
        <div className="bg-[#D9D9D9] border border-black/5 rounded-[28px] p-8 shadow-sm space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-black" />
                <h2 className="text-xl font-black text-black">
                  Base de Datos Local Privada (BYODB)
                </h2>
              </div>
              <p className="text-xs text-[#666666] font-medium max-w-xl mt-1 leading-relaxed">
                Conecta tu propia instancia de Supabase. Tu contenido, colas de envío y tokens de redes sociales permanecerán 100% bajo tu control e infraestructura.
              </p>
            </div>

            <div className="w-12 h-12 rounded-[18px] bg-white flex items-center justify-center border border-black/5 shadow-sm">
              <Server className="w-6 h-6 text-black" />
            </div>
          </div>

          <div className="bg-white/90 rounded-[20px] p-6 border border-black/5 shadow-sm">
            <ConnectByodbForm
              isConnected={byodbStatus.connected}
              connectedDomain={byodbStatus.url}
            />
          </div>
        </div>

        {/* Bento Box: Webhooks n8n (Solo Admin/Owner) */}
        {(userRole === 'owner' || userRole === 'admin') ? (
          <div className="bg-[#D9D9D9] border border-black/5 rounded-[28px] p-8 shadow-sm space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-700 fill-purple-700" />
                  <h2 className="text-xl font-black text-black">
                    Orquestador de Automatización (n8n Webhook)
                  </h2>
                </div>
                <p className="text-xs text-[#666666] font-medium max-w-xl mt-1 leading-relaxed">
                  Establece el endpoint de webhook que n8n escuchará para procesar y disparar las publicaciones hacia redes sociales.
                </p>
              </div>

              <div className="w-12 h-12 rounded-[18px] bg-white flex items-center justify-center border border-black/5 shadow-sm">
                <Zap className="w-6 h-6 text-purple-700" />
              </div>
            </div>

            <div className="bg-white/90 rounded-[20px] p-6 border border-black/5 shadow-sm">
              <WebhookSettingsForm />
            </div>
          </div>
        ) : (
          <div className="bg-[#D9D9D9] rounded-[28px] p-6 text-center border border-black/5 flex items-center justify-center gap-2">
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
