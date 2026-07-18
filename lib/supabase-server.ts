import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Fábrica segura del cliente Supabase Central para Server Components y Server Actions.
 * Crea una instancia fresca por petición (sin singleton) para evitar leaks de sesión
 * en entornos SSR multi-usuario (Fix E5 del informe de auditoría).
 */
export async function createCentralServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},    // Solo lectura — el middleware gestiona las cookies
        remove: () => {},
      },
    }
  );
}
