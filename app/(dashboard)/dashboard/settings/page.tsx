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
  Building,
  CheckCircle2,
  Server,
  Sparkles,
  Lock
} from 'lucide-react';

export default async function SettingsPage() {
  const byodbStatus = await getByodbStatus();
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';
  const userRole = headerList.get('x-user-role') || (process.env.NODE_ENV === 'development' ? 'admin' : 'member');
  const userEmail = headerList.get('x-user-email') ?? '';

  return (
    <div
      className="min-h-screen bg-[#F6F6F6] text-black font-sans select-none flex flex-col items-center justify-center"
      style={{
        paddingTop: '6vh',
        paddingBottom: '6vh',
        paddingLeft: '3vw',
        paddingRight: '3vw',
      }}
    >
      <div
        className="w-full max-w-5xl mx-auto"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '4.5vh',
        }}
      >
        
        {/* Barra Superior de Navegación */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-black bg-white hover:bg-black/5 border border-black/15 px-4.5 py-2.5 rounded-full shadow-2xs transition-all w-fit cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 text-black" />
            <span>Volver al Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 bg-white border border-black/10 text-black px-4.5 py-2.5 rounded-full text-xs font-extrabold uppercase tracking-wider shadow-2xs w-fit">
            <Building className="w-4 h-4 text-[#666666]" />
            <span>ORG: {orgId || 'Desarrollo'}</span>
          </div>
        </div>

        {/* 1. Header Principal: Tarjeta Bento Hero */}
        <div className="bg-white border border-black/10 rounded-[32px] p-7 sm:p-10 shadow-xs relative overflow-hidden space-y-3.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-[11px] font-extrabold text-[#555555] uppercase tracking-wider flex items-center gap-1.5 bg-[#F4F4F4] px-3.5 py-1 rounded-full border border-black/5">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              Configuración Central NUH
            </span>
            <span className="bg-black text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
              Multi-Tenant v2
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-black tracking-tight leading-tight">
            Ajustes & Conectividad Multi-Tenant
          </h1>

          <p className="text-xs sm:text-sm text-[#666666] font-medium max-w-2xl leading-relaxed">
            Gestiona la infraestructura privada de tu organización (BYODB), configura webhooks de orquestación n8n y verifica el estado de tu sesión activa.
          </p>
        </div>

        {/* 2. Tarjeta Bento: Sesión Activa de Usuario */}
        <div className="bg-white border border-black/10 rounded-[32px] p-7 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center">
                <User className="w-4.5 h-4.5 text-black" />
              </div>
              <h2 className="text-xs font-black text-black uppercase tracking-wider">
                Sesión Activa de Usuario
              </h2>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/60 shadow-2xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Autenticado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#F8F8F8] rounded-[22px] p-5 border border-black/5 space-y-2">
              <p className="text-[10px] font-extrabold text-[#777777] uppercase tracking-wider flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-black/40" /> Correo Electrónico
              </p>
              <p className="text-xs sm:text-sm font-extrabold text-black truncate">
                {userEmail || 'dev-user@example.com'}
              </p>
            </div>

            <div className="bg-[#F8F8F8] rounded-[22px] p-5 border border-black/5 space-y-2">
              <p className="text-[10px] font-extrabold text-[#777777] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-black/40" /> Rol de Acceso
              </p>
              <div>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black capitalize bg-black/10 text-black border border-black/10">
                  {userRole}
                </span>
              </div>
            </div>

            <div className="bg-[#F8F8F8] rounded-[22px] p-5 border border-black/5 space-y-2">
              <p className="text-[10px] font-extrabold text-[#777777] uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-black/40" /> ID Organización
              </p>
              <p className="text-xs sm:text-sm font-mono font-extrabold text-black truncate">
                {orgId || 'dev-org-00000000'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Tarjeta Bento: Conexión BYODB (Supabase) */}
        <div className="bg-white border border-black/10 rounded-[32px] p-7 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#267bb0]/10 flex items-center justify-center">
                  <Database className="w-4.5 h-4.5 text-[#267bb0]" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-black">
                  Base de Datos Local Privada (BYODB)
                </h2>
              </div>
              <p className="text-xs text-[#666666] font-medium max-w-xl leading-relaxed pt-1">
                Conecta tu propia instancia de Supabase. Tu contenido, colas de envío y tokens de redes sociales permanecerán 100% bajo tu control e infraestructura.
              </p>
            </div>

            <div className="w-11 h-11 rounded-[18px] bg-[#F4F4F4] flex items-center justify-center border border-black/10 shadow-2xs shrink-0">
              <Server className="w-5 h-5 text-black" />
            </div>
          </div>

          <div className="bg-[#F8F8F8] rounded-[24px] p-6 border border-black/5 shadow-2xs">
            <ConnectByodbForm
              isConnected={byodbStatus.connected}
              connectedDomain={byodbStatus.url}
            />
          </div>
        </div>

        {/* 4. Tarjeta Bento: Orquestador de Automatización n8n */}
        {(userRole === 'owner' || userRole === 'admin') ? (
          <div className="bg-white border border-black/10 rounded-[32px] p-7 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-black/10 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center border border-purple-200">
                    <Zap className="w-4.5 h-4.5 text-purple-600 fill-purple-600" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-black">
                    Orquestador de Automatización (n8n Webhook)
                  </h2>
                </div>
                <p className="text-xs text-[#666666] font-medium max-w-xl leading-relaxed pt-1">
                  Establece el endpoint de webhook que n8n escuchará para procesar y disparar las publicaciones hacia redes sociales.
                </p>
              </div>

              <div className="w-11 h-11 rounded-[18px] bg-purple-50 flex items-center justify-center border border-purple-200 shadow-2xs shrink-0">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
            </div>

            <div className="bg-[#F8F8F8] rounded-[24px] p-6 border border-black/5 shadow-2xs">
              <WebhookSettingsForm />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-[32px] p-6 text-center border border-black/10 flex items-center justify-center gap-2.5 shadow-xs">
            <Lock className="w-4.5 h-4.5 text-black/50" />
            <p className="text-xs font-bold text-[#666666]">
              La configuración de Webhook n8n requiere privilegios de Administrador u Owner.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
