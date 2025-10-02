import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

interface PendingCookie {
  name: string
  value: string
  options?: Parameters<ReturnType<typeof NextResponse>['cookies']['set']>[2]
}

// Rotas públicas (não requerem autenticação)
const PUBLIC_ROUTES = new Set<string>([
  '/',
  '/pricing',
  '/about',
  '/login',
  '/register',
  '/forgot-password',
])

// Prefixos que devem ser ignorados pelo middleware
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

// Rotas protegidas (requerem autenticação)
const PROTECTED_ROUTES = [
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

// Verificar se a rota deve ser ignorada pelo middleware
function shouldBypass(pathname: string): boolean {
  // Ignorar arquivos estáticos
  if (pathname.includes('.')) {
    return true
  }

  // Ignorar prefixos públicos
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }

  return false
}

// Verificar se é uma rota pública
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

// Verificar se é uma rota protegida
function isProtectedRoute(pathname: string): boolean {
  for (const route of PROTECTED_ROUTES) {
    if (pathname.startsWith(route)) {
      return true
    }
  }
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Ignorar rotas que não precisam de middleware
  if (shouldBypass(pathname)) {
    return NextResponse.next()
  }

  // 2. Permitir rotas públicas sem autenticação
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // 3. Verificar autenticação para rotas protegidas
  if (isProtectedRoute(pathname)) {
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
      }
    )

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    // Se não autenticado, redirecionar para login
    if (error || !user) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Adicionar headers com informações do usuário
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user', user.id)
    if (user.email) {
      requestHeaders.set('x-user-email', user.email)
    }

    // Criar resposta com headers atualizados
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })

    // Aplicar cookies pendentes
    pendingCookies.forEach(cookie => {
      response.cookies.set(cookie.name, cookie.value, cookie.options)
    })

    return response
  }

  // 4. Permitir outras rotas
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest).*)',
  ],
}
