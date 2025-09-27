import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'

import { extractTenantFromPath, resolveTenantSlug } from './lib/tenants'

interface PendingCookie {
  name: string
  value: string
  options?: Parameters<ReturnType<typeof NextResponse>['cookies']['set']>[2]
}

const PUBLIC_ROUTES = new Set<string>([
  '/',
  '/pricing',
  '/about',
  '/login',
  '/register',
  '/forgot-password',
])

const PUBLIC_PREFIXES = [
  '/_next',
  '/favicon',
  '/sitemap',
  '/robots',
  '/manifest',
  '/assets',
  '/static',
  '/api/webhooks',
]

const PRIVATE_SEGMENTS = [
  '/dashboard',
  '/clientes',
  '/lancamentos',
  '/bancos',
  '/fiscal',
  '/documentos',
  '/tarefas',
  '/propostas',
  '/relatorios',
  '/copiloto',
  '/config',
  '/api/bff',
]

function isBypassed(pathname: string): boolean {
  if (pathname.includes('.')) {
    return true
  }

  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }

  return false
}

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) {
    return true
  }

  return (
    pathname === '/' ||
    pathname.startsWith('/pricing') ||
    pathname.startsWith('/about') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/forgot-password')
  )
}

function requiresPrivateAccess(pathname: string): boolean {
  if (pathname.startsWith('/t/')) {
    return true
  }

  for (const segment of PRIVATE_SEGMENTS) {
    if (pathname.startsWith(segment)) {
      return true
    }
  }

  return false
}

export async function middleware(request: NextRequest) {
  const { pathname, host } = request.nextUrl

  if (isBypassed(pathname)) {
    return NextResponse.next()
  }

  const tenantSlug = resolveTenantSlug(host, pathname)
  const hasTenantContext = tenantSlug !== null

  const protectRoute = hasTenantContext || requiresPrivateAccess(pathname)

  if (!protectRoute && isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  if (!tenantSlug) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const pendingCookies: PendingCookie[] = []
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookies) {
          cookies.forEach(cookie => pendingCookies.push(cookie))
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-tenant', tenantSlug)

  const metadata = (session.user.app_metadata ?? {}) as Record<string, unknown>
  const tenantId = typeof metadata.tenant_id === 'string' ? metadata.tenant_id : null
  if (tenantId) {
    requestHeaders.set('x-tenant-id', tenantId)
  }

  requestHeaders.set('x-user', session.user.id)
  if (session.user.email) {
    requestHeaders.set('x-user-email', session.user.email)
  }

  const rolesClaim = metadata.roles
  const roleList =
    Array.isArray(rolesClaim) && rolesClaim.length
      ? rolesClaim.map(value => String(value))
      : [typeof metadata.role === 'string' ? metadata.role : 'user']
  requestHeaders.set('x-roles', roleList.join(','))

  const isApiRoute = pathname.startsWith('/api')
  const tenantFromPath = extractTenantFromPath(pathname)

  let response: NextResponse

  if (!isApiRoute && tenantFromPath) {
    const segments = pathname.split('/').filter(Boolean)
    const rest = segments.slice(2)
    const targetPath = `/${rest.join('/') || 'dashboard'}`

    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = targetPath
    response = NextResponse.rewrite(rewriteUrl, {
      request: {
        headers: requestHeaders,
      },
    })
  } else {
    response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
  }

  pendingCookies.forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value, cookie.options)
  })

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)',
  ],
}



