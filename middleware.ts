import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin') || ''
  const allowed = (process.env.ALLOWED_ORIGIN || '').split(',').map(o => o.trim())
  // Also accept www/non-www variant automatically
  const allVariants = new Set<string>()
  for (const o of allowed) {
    allVariants.add(o)
    if (o.startsWith('https://www.')) allVariants.add(o.replace('https://www.', 'https://'))
    else if (o.startsWith('https://')) allVariants.add(o.replace('https://', 'https://www.'))
  }
  if (allVariants.has(origin)) return origin
  return allowed[0] || '*'
}

export async function middleware(request: NextRequest) {
  // --- CORS for public API routes ---
  if (request.nextUrl.pathname.startsWith('/api/v1/')) {
    const corsOrigin = getAllowedOrigin(request)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': corsOrigin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key',
          'Access-Control-Max-Age': '86400',
        },
      })
    }
    const apiKey = request.headers.get('x-api-key')
    if (apiKey !== process.env.PUBLIC_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const response = NextResponse.next()
    response.headers.set('Access-Control-Allow-Origin', corsOrigin)
    return response
  }

  // --- Supabase session refresh + admin auth guard ---
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'public' },
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isAuthRoute = request.nextUrl.pathname.startsWith('/login')

    if (!user && !isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch {
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/api/v1/:path*'],
}
