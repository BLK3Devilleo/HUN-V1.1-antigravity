'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { connectByodb, type ConnectByodbInput } from '@/app/actions/byodb';

// ============================================================
// Schema de validación frontend (espejo del schema del Server Action)
// ============================================================
const formSchema = z.object({
  supabase_url: z
    .string()
    .url('La URL debe ser válida')
    .startsWith('https://', 'Debe usar HTTPS')
    .includes('.supabase.co', 'Debe ser una URL de Supabase'),
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
  const [serverResult, setServerResult] = useState<{ success: boolean; message: string } | null>(null);
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
      {/* Estado actual de conexión */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]'}`}
          />
          <span className="text-sm font-medium text-white/80">
            {isConnected
              ? `Conectado a ${connectedDomain}`
              : 'Sin base de datos local conectada'}
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
        >
          {isConnected ? 'Cambiar' : 'Conectar'}
        </button>
      </div>

      {/* Formulario colapsable */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
              {/* URL del Supabase */}
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 tracking-wide uppercase">
                  URL del Proyecto Supabase
                </label>
                <input
                  type="url"
                  placeholder="https://xxxxxxxxxxx.supabase.co"
                  {...register('supabase_url')}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all duration-200"
                />
                {errors.supabase_url && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.supabase_url.message}</p>
                )}
              </div>

              {/* Anon Key */}
              <div>
                <label className="block text-xs font-medium text-white/60 mb-1.5 tracking-wide uppercase">
                  Anon Key (Public)
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  {...register('supabase_anon_key')}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 text-sm focus:outline-none focus:border-blue-500/60 focus:bg-white/8 transition-all duration-200 font-mono"
                />
                {errors.supabase_anon_key && (
                  <p className="mt-1.5 text-xs text-red-400">{errors.supabase_anon_key.message}</p>
                )}
                <p className="mt-1.5 text-xs text-white/30">
                  Encuéntrala en Project Settings → API → Project API Keys
                </p>
              </div>

              {/* Resultado del servidor */}
              <AnimatePresence>
                {serverResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-4 rounded-xl text-sm ${
                      serverResult.success
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border border-red-500/30 text-red-400'
                    }`}
                  >
                    {serverResult.message}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botones */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Verificando conexión…
                    </>
                  ) : (
                    'Conectar base de datos'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setServerResult(null); }}
                  className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm hover:text-white hover:bg-white/10 transition-all duration-200"
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
