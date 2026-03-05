import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

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
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/v1/:path*',
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
