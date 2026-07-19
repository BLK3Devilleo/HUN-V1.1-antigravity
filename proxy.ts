import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';


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

  // Función auxiliar para generar URLs de redirección seguras, evitando el bug de host "0.0.0.0" o IDs de contenedor
  const getSafeRedirectUrl = (pathname: string, errorParam?: string) => {
    if (process.env.NODE_ENV === 'development') {
      const targetUrl = request.nextUrl.clone();
      targetUrl.pathname = pathname;
      if (errorParam) {
        targetUrl.searchParams.set('error', errorParam);
      }
      return targetUrl;
    }

    const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL;
    let targetUrl: URL;

    if (appUrlEnv && appUrlEnv.startsWith('http')) {
      targetUrl = new URL(pathname, appUrlEnv);
    } else {
      const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
      const proto = request.headers.get('x-forwarded-proto') || 'https';

      // Filtrar hosts inválidos de Docker (0.0.0.0 o IDs hexadecimales de contenedor de 12 caracteres como 640865ac143b)
      const isInternalDockerHost = !host || host.includes('0.0.0.0') || /^[a-f0-9]{12}/i.test(host.split(':')[0]);

      if (host && !isInternalDockerHost) {
        targetUrl = new URL(pathname, `${proto}://${host}`);
      } else {
        // Fallback definitivo al dominio de producción personalizado si el host de la petición es interno de Docker
        targetUrl = new URL(pathname, 'https://autom.filocentraldemando.site');
      }
    }

    if (errorParam) {
      targetUrl.searchParams.set('error', errorParam);
    }
    return targetUrl;
  };

  // Si no está autenticado, redirigir al login
  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      // Bypass para desarrollo local: Inyecta un usuario mock directamente
      response.headers.set('x-user-org-id', 'dev-org-00000000');
      response.headers.set('x-user-role', 'owner');
      response.headers.set('x-user-email', 'dev-user@example.com');
      return response;
    }
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
    // Validación de base de datos para entornos reales usando Service Role Key (bypassea RLS en el servidor)
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

    const { data: dbProfile, error } = await adminClient
      .from('profiles')
      .select('org_id, role')
      .eq('email', userEmail)
      .single();

    if (error || !dbProfile) {
      console.error('[Middleware Auth Error] Whitelist check failed:', error);
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
