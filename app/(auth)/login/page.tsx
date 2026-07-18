'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { createBrowserClient } from '@/lib/supabase';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createBrowserClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/callback`;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Redirige al callback de auth de Next.js para procesar la whitelist en el middleware
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
    <div className="flex min-h-screen items-center justify-center bg-[#0d0e12] p-4 text-white relative overflow-hidden">
      {/* Luces de fondo estilo Nebula */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 p-8 rounded-2xl shadow-2xl text-center relative z-10"
      >
        {/* Pastilla Build For Venezuela */}
        <div className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs text-blue-400 font-medium tracking-wide mb-6 uppercase">
          Build For Venezuela
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight mb-2 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
          NUH
        </h1>
        <p className="text-sm text-gray-400 mb-8 font-light">
          Central de Mando - Control de Publicación Masiva
        </p>

        {error && (
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-left font-light"
          >
            {error}
          </motion.div>
        )}

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-white text-black hover:bg-gray-100 disabled:bg-gray-400 font-medium rounded-xl transition-all duration-300 shadow-lg shadow-white/5 hover:scale-[1.02]"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <>
              {/* Icono de Google svg */}
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
            </>
          )}
        </button>

        <div className="mt-8 text-xs text-gray-500 font-light">
          Al acceder aceptas los Términos de Uso y Políticas de Privacidad.
        </div>
      </motion.div>
    </div>
  );
}
