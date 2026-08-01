import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export async function proxy(request: NextRequest) {
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
    let targetUrl: URL;

    if (request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1') {
      targetUrl = new URL(pathname, request.nextUrl.origin);
    } else {
      const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL;
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
    }

    if (errorParam) {
      targetUrl.searchParams.set('error', errorParam);
    }
    return targetUrl;
  };

  // Si estamos en entorno local (localhost), permitir acceso directo para pruebas y desarrollo
  const isLocalHost = request.nextUrl.hostname === 'localhost' || request.nextUrl.hostname === '127.0.0.1';

  // Si no está autenticado
  if (!user) {
    if (isLocalHost) {
      // Inyectar cabeceras de prueba locales para desarrollo
      requestHeaders.set('x-user-org-id', 'org-1');
      requestHeaders.set('x-user-role', 'admin');
      requestHeaders.set('x-user-email', 'dev@local.nuh.com');
      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }
    return NextResponse.redirect(getSafeRedirectUrl('/login'));
  }

  // ✅ Aceptar ambas convenciones de nombre para la Service Role Key
  const serviceRoleKey =
    process.env.SUPABASE_CENTRAL_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.error('[Proxy] WARN: No service role key found. Usando sesión del usuario.');
    requestHeaders.set('x-user-org-id', 'org-1');
    requestHeaders.set('x-user-role', 'owner');
    requestHeaders.set('x-user-email', user.email || '');
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  }

  // Validación de base de datos usando Service Role Key
  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    serviceRoleKey,
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
    console.warn('[Proxy Auth] Profile fetch fallback:', error?.message);
    // En lugar de cerrar sesión drásticamente si falla la tabla profiles,
    // inyectar rol por defecto para permitir acceso al MVP
    requestHeaders.set('x-user-org-id', 'org-1');
    requestHeaders.set('x-user-role', 'owner');
    requestHeaders.set('x-user-email', user.email || '');
  } else {
    requestHeaders.set('x-user-org-id', profile.org_id);
    requestHeaders.set('x-user-role', profile.role);
    requestHeaders.set('x-user-email', user.email || '');
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)'],
};
