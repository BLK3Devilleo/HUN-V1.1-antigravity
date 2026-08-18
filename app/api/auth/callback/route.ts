import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSafeOrigin(request: Request): string {
  const requestUrl = new URL(request.url);
  if (requestUrl.hostname === 'localhost' || requestUrl.hostname === '127.0.0.1') {
    return requestUrl.origin;
  }

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const proto = request.headers.get('x-forwarded-proto') || 'http';
    return `${proto}://${host}`;
  }

  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrlEnv && appUrlEnv.startsWith('http')) {
    return appUrlEnv;
  }

  if (host) {
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    return `${proto}://${host}`;
  }

  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const safeOrigin = getSafeOrigin(request);

  // Sanitizar el destino `next`: solo rutas internas relativas (evita open redirect).
  const rawNext = searchParams.get('next') ?? '/dashboard';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Si se invoca desde Server Component, se ignora
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${safeOrigin}${next}`);
    }
  }

  // Si ocurre un error, redirigir a login con un parámetro de error
  return NextResponse.redirect(`${safeOrigin}/login?error=auth_callback_failed`);
}
