import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Fábrica única de clientes Supabase del lado servidor.
 *
 * Antes, cada Server Action repetía ~25 líneas de `createServerClient` con su
 * propio manejo de cookies (6 copias divergentes). Esa duplicación provocaba
 * dos clases de bug reales:
 *
 *   1. Unas copias usaban `process.env.X!` (non-null assertion) y otras
 *      `|| ''`. Las primeras lanzaban excepción cuando faltaba configuración,
 *      convirtiendo un problema de entorno en un error 500 opaco.
 *   2. Unas implementaban `setAll` (refresco de cookies de sesión) y otras
 *      `get/set/remove` de la API antigua, así que el refresco de token
 *      funcionaba de forma inconsistente según qué acción se invocara.
 *
 * Este módulo centraliza ese comportamiento en un solo sitio.
 */

export const SUPABASE_URL_ENV = 'NEXT_PUBLIC_SUPABASE_CENTRAL_URL';
export const SUPABASE_ANON_KEY_ENV = 'NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY';

/** Nombres de las variables de configuración pública que faltan (para diagnóstico). */
export function getMissingPublicConfig(): string[] {
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL) missing.push(SUPABASE_URL_ENV);
  if (!process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY) missing.push(SUPABASE_ANON_KEY_ENV);
  return missing;
}

/** `true` cuando la configuración pública mínima de Supabase está presente. */
export function isSupabaseConfigured(): boolean {
  return getMissingPublicConfig().length === 0;
}

/**
 * Cliente Supabase ligado a la sesión del usuario (respeta RLS).
 *
 * @param writeCookies - Si es `true`, permite que Supabase refresque las
 *   cookies de sesión. Debe usarse SOLO desde Server Actions y Route Handlers;
 *   en el render de páginas Next.js prohíbe escribir cookies. Por eso el
 *   valor por defecto es `false` (solo lectura, siempre seguro).
 */
export async function createSessionClient(writeCookies = false): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          if (!writeCookies) return;
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Next.js lanza si se escriben cookies durante el render de una
            // página. Es esperable y no debe romper la petición.
          }
        },
      },
    }
  );
}

/**
 * Cliente con Service Role Key (omite RLS). Devuelve `null` si no está
 * configurada, para que quien lo llame decida el fallback de forma explícita
 * en lugar de reventar.
 *
 * Acepta las dos convenciones de nombre presentes en el despliegue.
 */
export function createAdminClient(): SupabaseClient | null {
  const serviceRoleKey =
    process.env.SUPABASE_CENTRAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  const url = process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL;
  if (!serviceRoleKey || !url) return null;

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
