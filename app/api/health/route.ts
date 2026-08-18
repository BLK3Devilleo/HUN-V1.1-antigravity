import { NextResponse } from 'next/server';

/**
 * Health/readiness check.
 *
 * Distingue dos conceptos que antes se mezclaban en un único 200:
 *
 *   - **liveness**: el proceso responde.
 *   - **readiness**: además tiene la configuración mínima para operar.
 *
 * Sin esa distinción, un contenedor arrancado sin variables de entorno pasaba
 * el healthcheck y el balanceador le mandaba tráfico real, que fallaba en la
 * primera petición. Ahora devuelve 503 si falta configuración crítica, de modo
 * que el orquestador no lo dé por sano.
 *
 * Nunca expone valores de secretos: solo si están presentes o no.
 */

export const dynamic = 'force-dynamic';

const startedAt = Date.now();

/** Sin estas variables la aplicación no puede autenticar a nadie. */
const CRITICAL_KEYS = ['supabase_url', 'supabase_anon_key'] as const;

export async function GET() {
  const config = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL,
    supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY,
    supabase_service_role_key: !!(
      process.env.SUPABASE_CENTRAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
    ),
    r2_storage: !!(
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME
    ),
    r2_public_url: !!process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    n8n_webhook: !!process.env.N8N_WEBHOOK_URL,
    byodb_encryption_key: !!(
      process.env.BYODB_ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET
    ),
    app_url: !!process.env.NEXT_PUBLIC_APP_URL,
  };

  const missing = Object.entries(config)
    .filter(([, present]) => !present)
    .map(([key]) => key);

  const missingCritical = CRITICAL_KEYS.filter((key) => !config[key]);
  const ready = missingCritical.length === 0;

  return NextResponse.json(
    {
      status: ready ? 'ok' : 'degraded',
      ready,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
      environment: process.env.NODE_ENV || 'unknown',
      config,
      missing_config: missing,
      missing_critical: missingCritical,
    },
    { status: ready ? 200 : 503 }
  );
}
