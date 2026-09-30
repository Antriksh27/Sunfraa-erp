import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { ROLE_NAV_CONFIG, isRouteAllowedForRole } from '@/lib/navigation';
import { UserRole } from '@/types/database';

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse(
      'Deployment Error: Missing Supabase Environment Variables (NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY) in Vercel settings. Please configure them in Project Settings -> Environment Variables.',
      { status: 503, headers: { 'content-type': 'text/plain' } }
    );
  }

  try {
    let supabaseResponse = NextResponse.next({
      request,
    });

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isLoginPage = pathname.startsWith('/login');
  const isSetupProfilePage = pathname.startsWith('/setup-profile');

  // 1. Unauthenticated users trying to access protected routes
  if (!user && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // 2. Authenticated user trying to access /login
  if (user && isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // 3. If authenticated, check profile active status and role protection
  if (user && !isLoginPage && !isSetupProfilePage) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, active')
      .eq('id', user.id)
      .single();

    // If no profile exists yet, allow /setup-profile
    if (!profile) {
      const url = request.nextUrl.clone();
      url.pathname = '/setup-profile';
      return NextResponse.redirect(url);
    }

    // If deactivated, block access
    if (profile.active === false) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('error', 'deactivated');
      return NextResponse.redirect(url);
    }

    const role = profile.role as UserRole;
    const roleConfig = ROLE_NAV_CONFIG[role];

    // Root path (Home Dashboard) is allowed for all authenticated roles
    if (pathname === '/') {
      return supabaseResponse;
    }

    // Route guard: if current route is not allowed for this role, redirect to home / default module
    if (!isRouteAllowedForRole(role, pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = roleConfig?.defaultRoute || '/';
      return NextResponse.redirect(url);
    }
  }

    return supabaseResponse;
  } catch (error) {
    console.error('Middleware execution error:', error);
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/svg assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
