'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase';
import { Sparkles, ShieldCheck, ArrowRight, AlertTriangle } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  useEffect(() => {
    const err = searchParams?.get('error');
    if (err === 'access_denied') {
      setError('Acceso denegado: Tu cuenta de correo no se encuentra en la Whitelist de organizaciones autorizadas.');
    }
  }, [searchParams]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const isLocalHost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
      if (isLocalHost) {
        window.location.href = '/dashboard';
        return;
      }

      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const redirectUrl = `${origin}/api/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      if (error) throw error;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al iniciar sesión con Google.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-md bg-[#D9D9D9] border border-black/10 p-8 sm:p-10 rounded-[36px] shadow-2xl text-center relative z-10 space-y-6"
    >
      {/* Header Badge */}
      <div className="flex items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-xs font-black uppercase tracking-widest shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-black" />
          Build 4 Venezuela
        </span>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <h1 className="nuh-title text-5xl sm:text-6xl font-black tracking-tighter text-black leading-none">
          NUH
        </h1>
        <p className="text-xs font-extrabold text-[#555555] uppercase tracking-wider">
          Central de Mando Multi-Tenant & Publicación Masiva
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-4 rounded-2xl bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold text-left flex items-start gap-2.5 shadow-sm"
        >
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </motion.div>
      )}

      {/* Action Button con el estilo Don Emilio */}
      <div className="pt-2">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full btn-crear flex items-center justify-center gap-3 px-6 py-4 text-black disabled:opacity-50 font-black text-xs uppercase tracking-wider rounded-full transition-all duration-200 shadow-md active:scale-95 cursor-pointer group"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Acceder con Google</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Security Footer Notice */}
      <div className="pt-4 border-t border-black/10 flex items-center justify-center gap-1.5 text-[11px] font-bold text-[#666666]">
        <ShieldCheck className="w-4 h-4 text-black" />
        <span>Acceso reservado para organizaciones autorizadas en Whitelist.</span>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F2F2F2] flex items-center justify-center p-4 sm:p-6 md:p-10 font-sans relative overflow-hidden">
      {/* Elementos flotantes 3D de fondo */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-12 left-12 w-32 h-32 rounded-3xl bg-[#D9D9D9]/50 border border-black/5 shadow-sm -z-0 blur-[1px]"
      />
      <motion.div
        animate={{ y: [0, 15, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-16 right-16 w-48 h-48 rounded-[36px] bg-[#D9D9D9]/40 border border-black/5 shadow-sm -z-0 blur-[1px]"
      />

      <Suspense fallback={
        <div className="w-full max-w-md bg-[#D9D9D9] p-10 rounded-[36px] shadow-2xl text-center space-y-4">
          <div className="h-6 w-24 bg-white/60 rounded-full mx-auto animate-pulse" />
          <div className="h-10 w-32 bg-white/60 rounded-xl mx-auto animate-pulse" />
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  );
}
