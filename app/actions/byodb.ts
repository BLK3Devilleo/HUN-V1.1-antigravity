'use server';

import { z } from 'zod';
import { cookies, headers } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createLocalClient } from '@/lib/supabase';
import { encryptText, decryptText } from '@/lib/crypto';

// ============================================================
// Schema Zod para validar las credenciales BYODB
// ============================================================
const ConnectByodbSchema = z.object({
  supabase_url: z
    .string()
    .url({ message: 'La URL debe ser una URL válida de Supabase' })
    .startsWith('https://', { message: 'La URL debe usar HTTPS' })
    .includes('.supabase.co', { message: 'Debe ser una URL de Supabase (.supabase.co)' }),
  supabase_anon_key: z
    .string()
    .min(20, { message: 'La anon key parece inválida (muy corta)' })
    .startsWith('eyJ', { message: 'La anon key debe ser un JWT válido (empieza con eyJ)' }),
});

export type ConnectByodbInput = z.infer<typeof ConnectByodbSchema>;

export interface ActionResult {
  success: boolean;
  message: string;
  error?: string;
}

// ============================================================
// Server Action: Conectar base de datos local (BYODB)
// Valida que la URL y la anon key son correctas ANTES de guardar
// ============================================================
export async function connectByodb(formData: ConnectByodbInput): Promise<ActionResult> {
  // 1. Validar inputs con Zod
  const parsed = ConnectByodbSchema.safeParse(formData);
  if (!parsed.success) {
    return {
      success: false,
      message: 'Datos inválidos',
      error: parsed.error.issues[0]?.message ?? 'Error de validación',
    };
  }

  const { supabase_url, supabase_anon_key } = parsed.data;

  // 2. Verificar conectividad con el Supabase local ANTES de guardar
  try {
    // Obtenemos el org_id de antemano para inyectarlo en el cliente y probar RLS
    const headerList = await headers();
    const orgId = headerList.get('x-user-org-id');

    if (!orgId) {
      return {
        success: false,
        message: 'No se pudo identificar tu organización',
        error: 'Sesión expirada. Por favor vuelve a iniciar sesión.',
      };
    }

    const localClient = createLocalClient(supabase_url, supabase_anon_key, orgId);
    // Intentamos una query inócua para confirmar que la conexión es válida
    const { error: pingError } = await localClient
      .from('scheduled_posts')
      .select('id')
      .limit(1);

    if (pingError && pingError.code !== 'PGRST116') {
      // PGRST116 = tabla vacía, es válido. Cualquier otro error es un problema de conexión.
      return {
        success: false,
        message: 'No se pudo conectar a tu Supabase local',
        error: `Error de conexión: ${pingError.message}`,
      };
    }
  } catch {
    return {
      success: false,
      message: 'Credenciales inválidas o Supabase no accesible',
      error: 'Verifica que la URL y la anon key sean correctas y que el proyecto esté activo.',
    };
  }

  // Obtenemos el org_id del middleware
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id');

  if (!orgId) {
    return {
      success: false,
      message: 'No se pudo identificar tu organización',
      error: 'Sesión expirada. Por favor vuelve a iniciar sesión.',
    };
  }

  // 4. Guardar credenciales cifradas en Supabase Central
  const cookieStore = await cookies();
  const supabaseCentralServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  // Usar pgcrypto vía función SQL sería ideal. Como mitigación usamos AES-256-GCM en Node.
  // La clave de cifrado viene de la variable de entorno del servidor (nunca expuesta al cliente).
  const { error: updateError } = await supabaseCentralServer
    .from('organizations')
    .update({
      byodb_url_enc: encryptText(supabase_url),
      byodb_key_enc: encryptText(supabase_anon_key),
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (updateError) {
    return {
      success: false,
      message: 'Error al guardar la configuración',
      error: updateError.message,
    };
  }

  return {
    success: true,
    message: '¡Conexión establecida correctamente! Tu base de datos local está vinculada.',
  };
}

// ============================================================
// Server Action: Obtener estado de conexión BYODB de la org
// ============================================================
export async function getByodbStatus(): Promise<{
  connected: boolean;
  url: string | null;
}> {
  const headerList = await headers();
  const orgId = headerList.get('x-user-org-id');

  if (!orgId) return { connected: false, url: null };

  const cookieStore = await cookies();
  const supabaseCentralServer = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    }
  );

  const { data } = await supabaseCentralServer
    .from('organizations')
    .select('byodb_url_enc')
    .eq('id', orgId)
    .single();

  const encryptedUrl = data?.byodb_url_enc ?? null;
  let urlDomain = null;

  if (encryptedUrl) {
    const decryptedUrl = decryptText(encryptedUrl);
    if (decryptedUrl) {
      try {
        urlDomain = new URL(decryptedUrl).hostname;
      } catch (e) {
        urlDomain = decryptedUrl.split('/')[2] || null;
      }
    }
  }

  return {
    connected: !!encryptedUrl,
    url: urlDomain, // Exponer solo el dominio, no la URL completa
  };
}
