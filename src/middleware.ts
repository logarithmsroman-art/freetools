import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 1. Maintain session (Auth)
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 2. VISIBILITY GUARD: Check if the current tool path is disabled
  // Skip check if accessing maintenance page, admin, or API
  const isExcluded = ['/tool-unavailable', '/admin', '/control-panel', '/api', '/_next'].some(path => request.nextUrl.pathname.startsWith(path))
  
  if (!isExcluded) {
    const { data: config } = await supabase
      .from('tool_configs')
      .select('is_enabled')
      .eq('id', request.nextUrl.pathname)
      .single()

    if (config && config.is_enabled === false) {
      // If it's disabled, redirect to the maintenance page
      return NextResponse.redirect(new URL('/tool-unavailable', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
