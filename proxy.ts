import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Solo interceptamos las rutas protegidas (dashboard y api)
  const isDashboardRoute = request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname === '/';
  const isApiRoute = request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/auth');

  if (!isDashboardRoute && !isApiRoute) {
    return response;
  }

  // Inicializar el cliente del servidor de Supabase (SSR)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // Recuperar sesión: Se reemplaza getSession por getUser para validación real contra el servidor
  const { data: { user } } = await supabase.auth.getUser();

  // Función auxiliar para generar URLs de redirección seguras, evitando el bug de host "0.0.0.0" de Next.js
  const getSafeRedirectUrl = (pathname: string, errorParam?: string) => {
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
    const proto = request.headers.get('x-forwarded-proto') || 'https';
    let targetUrl: URL;
    if (host && !host.includes('0.0.0.0')) {
      targetUrl = new URL(pathname, `${proto}://${host}`);
    } else {
      targetUrl = request.nextUrl.clone();
      targetUrl.pathname = pathname;
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

  const userEmail = user.email;

  let profile;

  // DEV MODE BYPASS: Para pruebas de desarrollo, saltamos la validación de Supabase
  if (process.env.NODE_ENV === 'development') {
    profile = {
      org_id: 'dev-org-00000000',
      role: 'owner'
    };
  } else {
    // Validación de base de datos para entornos reales
    const { data: dbProfile, error } = await supabase
      .from('profiles')
      .select('org_id, role')
      .eq('email', userEmail)
      .single();

    if (error || !dbProfile) {
      await supabase.auth.signOut();
      return NextResponse.redirect(getSafeRedirectUrl('/login', 'access_denied'));
    }
    profile = dbProfile;
  }

  // Inyectar de forma segura en las cabeceras (headers) la información validada
  response.headers.set('x-user-org-id', profile.org_id);
  response.headers.set('x-user-role', profile.role);
  response.headers.set('x-user-email', userEmail || '');

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
