import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * Contexto de autenticación resuelto de forma segura en el servidor.
 * Es la ÚNICA fuente de verdad de org_id y role para las Server Actions.
 */
export interface AuthContext {
  user: { id: string; email: string | undefined } | null;
  orgId: string | null;
  role: string | null;
}

/**
 * Resuelve el contexto del usuario autenticado sin confiar en cabeceras
 * `x-user-*` ni en datos provistos por el cliente:
 *
 * 1. Valida la sesión real contra el servidor con `supabase.auth.getUser()`.
 * 2. Obtiene `org_id` y `role` exclusivamente desde la tabla `profiles`
 *    (fuente de verdad, protegida por RLS `profile_self_select`).
 *
 * Si el usuario no está autenticado o no tiene perfil, devuelve valores
 * `null` para que cada acción pueda DENEGAR el acceso (fail-closed).
 */
export async function getAuthContext(): Promise<AuthContext> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // Modo solo-lectura: no se refrescan cookies durante la resolución.
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, orgId: null, role: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  return {
    user: { id: user.id, email: user.email ?? undefined },
    orgId: profile?.org_id ?? null,
    role: profile?.role ?? null,
  };
}
