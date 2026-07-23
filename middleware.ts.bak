import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // Solo interceptamos las rutas protegidas (dashboard y api)
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname === '/';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/auth');

  if (!isDashboardRoute && !isApiRoute) {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Inicializar el cliente del servidor de Supabase (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Recuperar sesión: Se utiliza getUser para validación real contra el servidor
  const { data: { user } } = await supabase.auth.getUser();

  // Función auxiliar para generar URLs de redirección seguras
  const getSafeRedirectUrl = (pathname: string, errorParam?: string) => {
    const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL;
    let targetUrl: URL;

    if (appUrlEnv && appUrlEnv.startsWith('http')) {
      targetUrl = new URL(pathname, appUrlEnv);
    } else {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      const proto = request.headers.get('x-forwarded-proto') || 'https';
      
      const isInternalDockerHost = !host || host.includes('0.0.0.0') || /^[a-f0-9]{12}/i.test(host.split(':')[0]);

      if (host && !isInternalDockerHost) {
        targetUrl = new URL(pathname, `${proto}://${host}`);
      } else {
        targetUrl = new URL(pathname, request.url);
      }
    }

    if (errorParam) {
      targetUrl.searchParams.set('error', errorParam);
    }
    return targetUrl;
  };

  // Si no está autenticado, redirigir al login
  if (!user) {
    return NextResponse.redirect(getSafeRedirectUrl('/login'));
  }

  // Validación de base de datos usando Service Role Key
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    process.env.SUPABASE_CENTRAL_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const { data: profile, error } = await adminClient
    .from('profiles')
    .select('org_id, role')
    .eq('id', user.id)
    .single();

  if (error || !profile) {
    console.error('[Middleware Auth Error] Whitelist check failed:', error);
    await supabase.auth.signOut();
    return NextResponse.redirect(getSafeRedirectUrl('/login', 'access_denied'));
  }

  // Inyectar de forma segura en las cabeceras de la PETICIÓN ENTRANTE (request.headers)
  requestHeaders.set('x-user-org-id', profile.org_id);
  requestHeaders.set('x-user-role', profile.role);
  requestHeaders.set('x-user-email', user.email || '');

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
