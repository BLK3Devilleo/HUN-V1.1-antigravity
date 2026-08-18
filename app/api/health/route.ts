import { NextResponse } from 'next/server';
const startedAt = Date.now();
export async function GET() {
  const config = {
    supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL,
    supabase_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY,
    supabase_service_role_key: !!(process.env.SUPABASE_CENTRAL_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    r2_storage: !!(process.env.R2_ACCOUNT_ID && process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET_NAME),
    r2_public_url: !!process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    n8n_webhook: !!process.env.N8N_WEBHOOK_URL,
    byodb_encryption_key: !!(process.env.BYODB_ENCRYPTION_KEY || process.env.ENCRYPTION_SECRET),
    app_url: !!process.env.NEXT_PUBLIC_APP_URL,
  };
  const missing = Object.entries(config).filter(([, v]) => !v).map(([k]) => k);
  return NextResponse.json({
    status: 'ok', timestamp: new Date().toISOString(),
    uptime_seconds: Math.round((Date.now() - startedAt) / 1000),
    environment: process.env.NODE_ENV || 'unknown', config, missing_config: missing,
  });
}
