'use server';

import { z } from 'zod';
import { createLocalClient } from '@/lib/supabase';
import { createSessionClient } from '@/lib/supabase-server';
import { encryptText, decryptText } from '@/lib/crypto';
import { authorize } from '@/lib/authz';
import { logger } from '@/lib/logger';

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

  // 2. Autorización centralizada: owner/admin, resuelto contra `profiles`.
  const auth = await authorize('action.byodb_connect', 'admin');
  if (!auth.ok) {
    return {
      success: false,
      message:
        auth.reason === 'insufficient_permissions'
          ? 'Permisos insuficientes'
          : 'No se pudo identificar tu organización',
      error: auth.error,
    };
  }
  const { user, orgId, role } = auth.context;

  logger.info('action.byodb_connect.start', { user: user.email || user.id, org: orgId, role });

  // 3. Verificar conectividad con el Supabase local ANTES de guardar
  try {
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

  // 4. Guardar credenciales cifradas en Supabase Central.
  //    El RLS (`org_admin_update`) ya restringe la escritura a owner/admin de
  //    la propia organización, así que basta con el cliente de sesión.
  const supabaseCentralServer = await createSessionClient(true);

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

  logger.info('action.byodb_connect.ok', { user: user.email || user.id, org: orgId });

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
  const auth = await authorize('action.byodb_status');
  if (!auth.ok) return { connected: false, url: null };

  const { orgId } = auth.context;

  // Solo lectura: esta acción se invoca durante el render de la página de
  // ajustes, donde Next.js no permite escribir cookies.
  const supabaseCentralServer = await createSessionClient();

  const { data } = await supabaseCentralServer
    .from('organizations')
    .select('byodb_url_enc')
    .eq('id', orgId)
    .maybeSingle();

  const encryptedUrl = data?.byodb_url_enc ?? null;
  let urlDomain = null;

  if (encryptedUrl) {
    const decryptedUrl = decryptText(encryptedUrl);
    if (decryptedUrl) {
      try {
        urlDomain = new URL(decryptedUrl).hostname;
      } catch {
        urlDomain = decryptedUrl.split('/')[2] || null;
      }
    }
  }

  return {
    connected: !!encryptedUrl,
    url: urlDomain, // Exponer solo el dominio, no la URL completa
  };
}
