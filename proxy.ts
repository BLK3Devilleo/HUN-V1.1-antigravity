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

  // Si no está autenticado, redirigir al login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
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
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'access_denied');
      return NextResponse.redirect(url);
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
