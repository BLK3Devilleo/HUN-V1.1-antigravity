import { createClient } from '@supabase/supabase-js';
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

const centralUrl = process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL || '';
const centralAnonKey = process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY || '';

/**
 * Crea un cliente Supabase Central optimizado para el navegador (Client Components),
 * sincronizándose de forma transparente con las cookies manejadas por el Middleware.
 */
export function createBrowserClient() {
  return createSupabaseBrowserClient(centralUrl, centralAnonKey);
}

/**
 * Crea un cliente Supabase Central estático del lado del servidor.
 * NOTA: Úsalo únicamente en contextos sin estado (scripts aislados) o Server Actions
 * donde creas la instancia fresca por petición para evitar fugas de sesión en SSR.
 */
export function createCentralClient() {
  return createClient(centralUrl, centralAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  });
}

/**
 * Crea una instancia dinámica del cliente Supabase local para la base de datos de la organización.
 * Esto nos permite ejecutar consultas e inserciones locales en la infraestructura del propio cliente (BYODB).
 */
export function createLocalClient(url: string, key: string, orgId?: string) {
  if (!url || !key) {
    throw new Error('Las credenciales del Supabase local de la organización no están configuradas.');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false, // La sesión de autenticación principal corre sobre supabaseCentral
    },
    global: {
      // Inyectar el org_id como un parámetro de sesión de PostgreSQL para que el RLS local funcione
      headers: orgId ? {
        'x-org-id': orgId
      } : {},
    }
  });
}
