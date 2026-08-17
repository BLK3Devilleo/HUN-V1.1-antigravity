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
    <div className="w-full space-y-4">
      {/* Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4.5 rounded-[20px] bg-white border border-black/10 shadow-2xs gap-3">
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
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#666666]">Estado BYODB</span>
              <span
                className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isConnected
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                {isConnected ? 'Activo y Vinculado' : 'Sin Conexión'}
              </span>
            </div>
            <p className="text-xs font-semibold text-black mt-0.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#666666]" />
              {isConnected && connectedDomain
                ? `Instancia Supabase: ${connectedDomain}`
                : 'Ninguna base de datos privada conectada.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowForm((v) => !v)}
          className={`px-4.5 py-2.5 rounded-full text-xs font-extrabold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-2xs active:scale-95 ${
            showForm
              ? 'bg-[#EFEFEF] text-black hover:bg-black/10'
              : isConnected
              ? 'bg-black text-white hover:bg-neutral-800'
              : 'bg-[#267bb0] text-white hover:bg-[#1f6693]'
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-3">
              {/* Supabase URL */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-[#444444] uppercase tracking-wider flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-[#267bb0]" />
                  URL del Proyecto Supabase
                </label>
                <input
                  type="url"
                  placeholder="https://xxxxxxxxxxx.supabase.co"
                  {...register('supabase_url')}
                  className="w-full px-4.5 py-3 rounded-2xl bg-white border border-black/15 text-black placeholder:text-[#999999] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#267bb0]/20 focus:border-[#267bb0] transition-all shadow-2xs"
                />
                {errors.supabase_url && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.supabase_url.message}
                  </p>
                )}
              </div>

              {/* Supabase Anon Key */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-[#444444] uppercase tracking-wider flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#267bb0]" />
                  Clave Pública Anon Key (JWT)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  {...register('supabase_anon_key')}
                  className="w-full px-4.5 py-3 rounded-2xl bg-white border border-black/15 text-black placeholder:text-[#999999] text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#267bb0]/20 focus:border-[#267bb0] transition-all shadow-2xs"
                />
                {errors.supabase_anon_key && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.supabase_anon_key.message}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[#666666] font-medium">
                  Copiar desde tu dashboard de Supabase: <span className="font-bold text-black">Project Settings → API → Project API Keys</span>
                </p>
              </div>

              {/* Server Result Banner */}
              {serverResult && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl text-xs font-bold flex items-start gap-2.5 ${
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
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-black hover:bg-neutral-800 disabled:opacity-50 text-white text-xs font-extrabold uppercase tracking-wider transition-all duration-200 shadow-2xs cursor-pointer active:scale-95"
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
                  className="px-5 py-3 rounded-full bg-white hover:bg-black/5 border border-black/15 text-black text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-2xs active:scale-95"
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
