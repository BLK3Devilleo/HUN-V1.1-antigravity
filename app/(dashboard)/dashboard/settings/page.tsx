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
  Layers
} from 'lucide-react';

export default async function SettingsPage() {
  const byodbStatus = await getByodbStatus();
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id') ?? '';
  const userRole = headerList.get('x-user-role') ?? 'member';
  const userEmail = headerList.get('x-user-email') ?? '';

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Header Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-slate-950 bg-white hover:bg-slate-50 border border-slate-200/80 px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all group w-fit"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al Dashboard</span>
          </Link>

          <div className="flex items-center gap-2 bg-slate-900 text-white px-3.5 py-2 rounded-xl shadow-sm border border-slate-800 w-fit">
            <Building className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[11px] font-mono font-bold tracking-tight text-slate-300">
              ORG: <span className="text-white">{orgId || 'Desarrollo'}</span>
            </span>
          </div>
        </div>

        {/* Hero Banner Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 -mb-8 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-400/20 text-blue-400 text-[10px] font-extrabold uppercase tracking-widest">
                <ShieldCheck className="w-3.5 h-3.5" />
                Configuración Central NUH
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-extrabold uppercase tracking-widest">
                Multi-Tenant v2
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Ajustes & Conectividad de Organización
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Administra la infraestructura aislada (BYODB), configura tus endpoints de orquestación de contenido con n8n y verifica las credenciales de tu sesión activa.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-[11px] font-semibold text-slate-400">
              <span className="flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-blue-400" /> Supabase BYODB
              </span>
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-purple-400" /> n8n Webhooks
              </span>
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-400" /> Aislamiento RLS
              </span>
            </div>
          </div>
        </div>

        {/* Card: Active User Session */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Sesión Activa de Usuario
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Autenticado
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" /> Correo Electrónico
              </p>
              <p className="text-xs font-extrabold text-slate-900 truncate">
                {userEmail || 'dev-user@example.com'}
              </p>
            </div>

            {/* Role */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-slate-400" /> Rol de Acceso
              </p>
              <div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-extrabold capitalize ${
                    userRole === 'owner' || userRole === 'admin'
                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {userRole}
                </span>
              </div>
            </div>

            {/* Org ID */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <Building className="w-3 h-3 text-slate-400" /> ID de Organización
              </p>
              <p className="text-xs font-mono font-bold text-slate-700 truncate">
                {orgId || 'dev-org-00000000'}
              </p>
            </div>
          </div>
        </div>

        {/* Card: BYODB Connection */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Base de Datos Local Privada (BYODB)
                </h2>
              </div>
              <p className="text-xs text-slate-600 font-medium max-w-xl leading-relaxed">
                Conecta tu propia instancia de Supabase. Tu contenido, colas de envío y credenciales de redes sociales permanecerán 100% bajo tu control e infraestructura privada.
              </p>
            </div>

            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 flex-shrink-0">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
          </div>

          <ConnectByodbForm
            isConnected={byodbStatus.connected}
            connectedDomain={byodbStatus.url}
          />
        </div>

        {/* Card: n8n Automation Webhooks */}
        {(userRole === 'owner' || userRole === 'admin') ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-purple-600 fill-purple-600/10" />
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Orquestador de Automatización (n8n Webhook)
                  </h2>
                </div>
                <p className="text-xs text-slate-600 font-medium max-w-xl leading-relaxed">
                  Establece el endpoint de webhook que escucha n8n para procesar, programar y publicar automáticamente el contenido multimedia hacia las redes sociales.
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100 flex-shrink-0">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
            </div>

            <WebhookSettingsForm />
          </div>
        ) : (
          <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200/80 flex items-center justify-center gap-3">
            <Lock className="w-4 h-4 text-slate-400" />
            <p className="text-xs font-bold text-slate-600">
              La configuración del Webhook de n8n requiere privilegios de Administrador u Owner de la Organización.
            </p>
          </div>
        )}

        {/* Footer Security Note */}
        <div className="text-center py-4 text-[11px] font-medium text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Infraestructura protegida con aislamiento Multi-Tenant y encriptación de credenciales AES-256.</span>
        </div>

      </div>
    </div>
  );
}
