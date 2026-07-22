'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { connectByodb, type ConnectByodbInput } from '@/app/actions/byodb';
import { Database, Key, CheckCircle2, AlertCircle, RefreshCw, Globe, ChevronDown, ChevronUp } from 'lucide-react';

const formSchema = z.object({
  supabase_url: z
    .string()
    .url('La URL debe ser una URL válida')
    .startsWith('https://', 'Debe usar HTTPS')
    .includes('.supabase.co', 'Debe ser una URL de Supabase (.supabase.co)'),
  supabase_anon_key: z
    .string()
    .min(20, 'La anon key parece inválida')
    .startsWith('eyJ', 'Debe ser un JWT válido (empieza con eyJ)'),
});

type FormValues = z.infer<typeof formSchema>;

interface Props {
  isConnected: boolean;
  connectedDomain: string | null;
  onSuccess?: () => void;
}

export default function ConnectByodbForm({ isConnected, connectedDomain, onSuccess }: Props) {
  const [serverResult, setServerResult] = useState<{ success: boolean; message: string; error?: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setServerResult(null);
    const result = await connectByodb(data as ConnectByodbInput);
    setServerResult(result);
    if (result.success) {
      reset();
      setShowForm(false);
      onSuccess?.();
    }
  };

  return (
    <div className="w-full">
      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-900/5 border border-slate-900/10 gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span
              className={`w-3.5 h-3.5 rounded-full ${
                isConnected ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
            />
            {isConnected && (
              <span className="absolute w-3.5 h-3.5 rounded-full bg-emerald-500 animate-ping opacity-75" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Estado BYODB</span>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isConnected ? 'Activo y Vinculado' : 'Sin Conexión'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              {isConnected && connectedDomain
                ? `Instancia Supabase: ${connectedDomain}`
                : 'Ninguna base de datos privada conectada.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
            showForm
              ? 'bg-slate-200 text-slate-800 hover:bg-slate-300'
              : isConnected
              ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm'
              : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20'
          }`}
        >
          <span>{showForm ? 'Cerrar Formulario' : isConnected ? 'Reconfigurar Credenciales' : 'Conectar Supabase'}</span>
          {showForm ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Form Area */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-5">
              {/* Supabase URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-blue-600" />
                  URL del Proyecto Supabase
                </label>
                <input
                  type="url"
                  placeholder="https://xxxxxxxxxxx.supabase.co"
                  {...register('supabase_url')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                />
                {errors.supabase_url && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.supabase_url.message}
                  </p>
                )}
              </div>

              {/* Supabase Anon Key */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  Clave Pública Anon Key (JWT)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  {...register('supabase_anon_key')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 placeholder:text-slate-400 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:bg-white transition-all shadow-sm"
                />
                {errors.supabase_anon_key && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.supabase_anon_key.message}
                  </p>
                )}
                <p className="mt-1.5 text-[11px] text-slate-500 font-medium">
                  Copiar desde tu dashboard de Supabase: <span className="font-semibold text-slate-700">Project Settings → API → Project API Keys</span>
                </p>
              </div>

              {/* Server Result Banner */}
              {serverResult && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl text-xs font-bold flex items-start gap-2.5 ${
                    serverResult.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {serverResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p>{serverResult.message}</p>
                    {serverResult.error && (
                      <p className="mt-1 font-normal opacity-80">{serverResult.error}</p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider transition-all duration-200 shadow-md cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>Verificando y Guardando...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Guardar Conexión BYODB</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setServerResult(null);
                  }}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
