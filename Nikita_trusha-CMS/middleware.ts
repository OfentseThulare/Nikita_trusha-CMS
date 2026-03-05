import { NextResponse, type NextRequest } from 'next/server'

export const runtime = 'edge'

export async function middleware(request: NextRequest) {
  try {
    // --- CORS for public API routes ---
    if (request.nextUrl.pathname.startsWith('/api/v1/')) {
      if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
          status: 200,
          headers: {
            'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
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
      response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*')
      return response
    }

    // --- Auth for admin routes only ---
    if (!request.nextUrl.pathname.startsWith('/admin')) {
      return NextResponse.next()
    }

    // Check for Supabase auth cookie — if no cookie, redirect to login
    const hasAuthCookie = request.cookies.getAll().some(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )

    if (!hasAuthCookie) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  } catch (e) {
    console.error('Middleware error:', e)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/admin/:path*', '/api/v1/:path*'],
}
