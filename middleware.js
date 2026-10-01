import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';

const OWNER_EMAIL = 'fabian.ibanez@gmail.com';

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(list) {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Proteger el panel: solo el dueño entra; el resto va al login.
  if (path.startsWith('/admin') && path !== '/admin/login') {
    if (!user || user.email !== OWNER_EMAIL) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
  }
  return response;
}

export const config = { matcher: ['/admin/:path*', '/auth/:path*'] };
