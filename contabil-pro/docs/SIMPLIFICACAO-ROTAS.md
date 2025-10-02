# 🗺️ PLANO DE SIMPLIFICAÇÃO DE ROTAS

## 📋 ESTRUTURA ATUAL

```
src/app/
├── (public)/          # Rotas públicas
│   ├── (auth)/
│   │   ├── login/
│   │   ├── register/
│   │   └── forgot-password/
│   ├── about/
│   └── pricing/
├── (tenant)/          # Rotas com tenant (REMOVER)
│   ├── dashboard/
│   ├── clientes/
│   ├── documentos/
│   ├── lancamentos/
│   ├── bancos/
│   ├── fiscal/
│   ├── tarefas/
│   ├── propostas/
│   ├── relatorios/
│   ├── copiloto/
│   └── config/
└── api/
    └── bff/
```

## 🎯 ESTRUTURA DESEJADA

```
src/app/
├── (auth)/            # Rotas de autenticação
│   ├── login/
│   ├── register/
│   └── forgot-password/
├── (public)/          # Rotas públicas
│   ├── about/
│   └── pricing/
├── (app)/             # Rotas da aplicação (protegidas)
│   ├── dashboard/
│   ├── clientes/
│   ├── documentos/
│   ├── lancamentos/
│   ├── bancos/
│   ├── fiscal/
│   ├── tarefas/
│   ├── propostas/
│   ├── relatorios/
│   ├── copiloto/
│   └── config/
└── api/
    └── bff/
```

## 🔄 MUDANÇAS NECESSÁRIAS

### 1. Mover Rotas de `(tenant)` para `(app)`
```bash
# Renomear diretório
mv src/app/(tenant) src/app/(app)
```

### 2. Atualizar Layout da Aplicação
**Arquivo:** `src/app/(app)/layout.tsx`
- Remover lógica de tenant
- Simplificar verificação de autenticação
- Atualizar links de navegação

### 3. Atualizar Middleware
**Arquivo:** `src/middleware.ts`
- Remover validação de tenant_slug
- Simplificar redirecionamentos
- Manter apenas verificação de autenticação

### 4. Atualizar Links na Interface
**Arquivos a atualizar:**
- `src/components/layout/sidebar.tsx`
- `src/components/layout/header.tsx`
- `src/components/layout/nav-links.tsx`
- Todos os componentes com links internos

**Mudanças:**
```typescript
// ANTES:
href="/t/[tenant_slug]/dashboard"
href={`/t/${tenantSlug}/clientes`}

// DEPOIS:
href="/dashboard"
href="/clientes"
```

### 5. Atualizar Redirecionamentos
**Arquivos:**
- `src/app/login/page.tsx`
- `src/actions/auth.ts`
- Qualquer lugar que redireciona após login

**Mudanças:**
```typescript
// ANTES:
redirect(`/t/${tenantSlug}/dashboard`)

// DEPOIS:
redirect('/dashboard')
```

### 6. Atualizar `revalidatePath`
**Arquivos de actions:**
- `src/actions/clients.ts`
- `src/actions/documents.ts`
- `src/actions/entries.ts`
- etc.

**Mudanças:**
```typescript
// ANTES:
revalidatePath(`/t/${tenantSlug}/clientes`)

// DEPOIS:
revalidatePath('/clientes')
```

## 📝 CHECKLIST DE EXECUÇÃO

### Fase 1: Preparação
- [ ] Criar backup do código atual
- [ ] Documentar rotas atuais
- [ ] Identificar todos os arquivos que usam rotas com tenant

### Fase 2: Mover Estrutura
- [ ] Renomear `(tenant)` para `(app)`
- [ ] Atualizar imports nos arquivos movidos

### Fase 3: Atualizar Código
- [ ] Atualizar middleware
- [ ] Atualizar layout da aplicação
- [ ] Atualizar componentes de navegação
- [ ] Atualizar links em todos os componentes
- [ ] Atualizar redirecionamentos
- [ ] Atualizar revalidatePath

### Fase 4: Testes
- [ ] Testar login e redirecionamento
- [ ] Testar navegação entre páginas
- [ ] Testar todas as rotas principais
- [ ] Verificar se não há links quebrados

## 🔍 ARQUIVOS PRINCIPAIS A ATUALIZAR

### 1. Middleware
```typescript
// src/middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Verificar autenticação para rotas protegidas
  if (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/clientes') ||
      pathname.startsWith('/documentos') ||
      // ... outras rotas protegidas
  ) {
    const supabase = createMiddlewareClient({ req: request, res: response })
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}
```

### 2. Layout da Aplicação
```typescript
// src/app/(app)/layout.tsx
export default async function AppLayout({ children }: { children: React.Node }) {
  const session = await verifySession()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Header user={session.user} />
        {children}
      </main>
    </div>
  )
}
```

### 3. Componente de Navegação
```typescript
// src/components/layout/nav-links.tsx
const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/clientes', label: 'Clientes', icon: UsersIcon },
  { href: '/documentos', label: 'Documentos', icon: DocumentIcon },
  { href: '/lancamentos', label: 'Lançamentos', icon: BookIcon },
  { href: '/bancos', label: 'Bancos', icon: BankIcon },
  { href: '/fiscal', label: 'Fiscal', icon: FileTextIcon },
  { href: '/tarefas', label: 'Tarefas', icon: CheckIcon },
  { href: '/propostas', label: 'Propostas', icon: FileIcon },
  { href: '/relatorios', label: 'Relatórios', icon: ChartIcon },
  { href: '/copiloto', label: 'Copiloto', icon: SparklesIcon },
  { href: '/config', label: 'Configurações', icon: SettingsIcon },
]
```

## ⚠️ PONTOS DE ATENÇÃO

1. **Não quebrar rotas públicas** - `/about`, `/pricing` devem continuar funcionando
2. **Manter rotas de autenticação** - `/login`, `/register`, `/forgot-password`
3. **Atualizar todos os links** - Buscar por `/t/` em todo o código
4. **Testar redirecionamentos** - Especialmente após login
5. **Verificar middleware** - Garantir que protege rotas corretas

## 🚀 COMANDOS ÚTEIS

### Buscar referências a rotas com tenant:
```bash
# PowerShell
Get-ChildItem -Path src -Recurse -Include *.tsx,*.ts | Select-String "/t/" | Select-Object Path, LineNumber, Line

# Ou
grep -r "/t/" src/
```

### Buscar uso de tenantSlug:
```bash
grep -r "tenantSlug" src/
```

### Buscar revalidatePath com tenant:
```bash
grep -r "revalidatePath.*\/t\/" src/
```

