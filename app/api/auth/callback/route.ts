import { NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getSafeOrigin(request: Request): string {
  const appUrlEnv = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrlEnv && appUrlEnv.startsWith('http')) {
    return appUrlEnv;
  }

  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  
  // Filtrar hosts inválidos de Docker (0.0.0.0 o IDs hexadecimales de contenedor de 12 caracteres como f457a25992bd)
  const isInternalDockerHost = !host || host.includes('0.0.0.0') || /^[a-f0-9]{12}/i.test(host.split(':')[0]);

  if (host && !isInternalDockerHost) {
    return `${proto}://${host}`;
  }

  return 'https://autom.filocentraldemando.site';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  const safeOrigin = getSafeOrigin(request);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_CENTRAL_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch {
              // Si se invoca desde Server Component, se ignora
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
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
