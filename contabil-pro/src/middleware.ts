import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { createServerClient } from '@supabase/ssr'

import { resolveTenant } from './lib/tenants'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Excluir rotas públicas e webhooks do matcher
  if (
    pathname.startsWith('/api/webhooks') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // Detectar tenant (subdomínio ou path-based)
  const tenant = await resolveTenant(request)

  // Rotas públicas (landing, auth, etc.)
  if (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname === '/') {
    const response = NextResponse.next()

    // Injetar headers mesmo para rotas públicas (útil para analytics)
    if (tenant) {
      response.headers.set('x-tenant', tenant.slug)
    }

    return response
  }

  // Verificar autenticação para rotas protegidas
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {
          // Não podemos setar cookies no middleware
        },
        remove() {
          // Não podemos remover cookies no middleware
        },
      },
    },
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirecionar para login se não autenticado
  if (!session?.user) {
    const loginUrl = new URL('/login', request.url)
    return NextResponse.redirect(loginUrl)
  }

  // Extrair dados do JWT
  const claims = session.user.app_metadata || {}
  const userTenantId = claims.tenant_id as string
  const userRole = (claims.role as string) || 'user'
  const userRoles = (claims.roles as string[]) || [userRole]

  // Verificar acesso ao tenant
  if (tenant && userTenantId !== tenant.id) {
    const forbiddenUrl = new URL('/forbidden', request.url)
    return NextResponse.redirect(forbiddenUrl)
  }

  // Rewrite /t/[tenant]/... → /(tenant)/...
  if (pathname.startsWith('/t/')) {
    const segments = pathname.split('/')
    const tenantSlug = segments[2]
    const restPath = segments.slice(3).join('/')

    // Verificar se o tenant existe e o usuário tem acesso
    if (!tenant || tenant.slug !== tenantSlug) {
      const notFoundUrl = new URL('/404', request.url)
      return NextResponse.redirect(notFoundUrl)
    }

    // Rewrite para route group (tenant)
    const rewriteUrl = new URL(`/${restPath || 'dashboard'}`, request.url)
    const response = NextResponse.rewrite(rewriteUrl)

    // Injetar headers para Server Actions/BFF
    response.headers.set('x-tenant', tenant.slug)
    response.headers.set('x-tenant-id', tenant.id)
    response.headers.set('x-user', session.user.id)
    response.headers.set('x-user-email', session.user.email || '')
    response.headers.set('x-roles', userRoles.join(','))

    return response
  }

  // Para rotas diretas do (tenant) group
  if (
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/clientes') ||
    pathname.startsWith('/lancamentos') ||
    pathname.startsWith('/bancos') ||
    pathname.startsWith('/fiscal') ||
    pathname.startsWith('/documentos') ||
    pathname.startsWith('/tarefas') ||
    pathname.startsWith('/propostas') ||
    pathname.startsWith('/relatorios') ||
    pathname.startsWith('/copiloto') ||
    pathname.startsWith('/config')
  ) {
    const response = NextResponse.next()

    // Injetar headers de contexto
    if (tenant) {
      response.headers.set('x-tenant', tenant.slug)
      response.headers.set('x-tenant-id', tenant.id)
    }
    response.headers.set('x-user', session.user.id)
    response.headers.set('x-user-email', session.user.email || '')
    response.headers.set('x-roles', userRoles.join(','))

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/webhooks (webhook routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api/webhooks|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
