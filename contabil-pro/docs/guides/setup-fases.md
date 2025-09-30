# 🚀 ContabilPRO - Guia de Setup Completo

Este documento detalha as 3 fases de instalação e configuração do ContabilPRO,
um SaaS contábil multi-tenant construído com Next.js e Supabase.

## 📋 Visão Geral

O setup foi dividido em 3 fases principais:

- **Fase 1**: Base do projeto (Next.js + Supabase + Validação)
- **Fase 2**: Interface (shadcn/ui + Componentes + Blocks)
- **Fase 3**: Funcionalidades (TanStack + Server Actions + Utilitários)

---

## 🏗️ **Fase 1: Base do Projeto**

### Objetivo

Criar a fundação tecnológica do ContabilPRO com Next.js, Supabase e validação de
dados.

### Comandos Executados

```bash
# 1. Criar projeto Next.js
npx create-next-app@latest contabil-pro --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-git

# 2. Entrar no diretório
cd contabil-pro

# 3. Instalar Supabase
npm install @supabase/supabase-js @supabase/ssr

# 4. Instalar validação e formulários
npm install zod react-hook-form @hookform/resolvers
```

### Tecnologias Instaladas

- ✅ **Next.js 15.5.4** - Framework React com App Router
- ✅ **TypeScript 5** - Tipagem estática
- ✅ **Tailwind CSS 4** - Framework CSS utilitário
- ✅ **ESLint 9** - Linting de código
- ✅ **Supabase** - Backend-as-a-Service
  - `@supabase/supabase-js@2.58.0` - Cliente JavaScript
  - `@supabase/ssr@0.7.0` - Server-Side Rendering
- ✅ **Zod 4.1.11** - Validação de schemas TypeScript-first
- ✅ **React Hook Form 7.63.0** - Gerenciamento de formulários
- ✅ **@hookform/resolvers 5.2.2** - Integração Zod + React Hook Form

### Estrutura Criada

```
contabil-pro/
├── src/
│   └── app/
│       ├── favicon.ico
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── public/
├── package.json
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### Resultado

- ✅ Servidor funcionando em http://localhost:3000
- ✅ Turbopack habilitado para desenvolvimento rápido
- ✅ Zero erros de compilação
- ✅ Base sólida para desenvolvimento

---

## 🎨 **Fase 2: Interface com shadcn/ui**

### Objetivo

Implementar uma interface profissional e moderna usando shadcn/ui com
componentes prontos e blocks complexos.

### Comandos Executados

```bash
# 1. Inicializar shadcn/ui
npx shadcn@latest init

# 2. Instalar componentes básicos
npx shadcn@latest add form table button input select card dialog badge sidebar

# 3. Instalar componentes avançados
npx shadcn@latest add chart calendar tabs dropdown-menu pagination

# 4. Instalar blocks prontos
npx shadcn@latest add dashboard-01
npx shadcn@latest add sidebar-01 login-01
```

### Componentes Instalados (26 total)

#### Componentes Base

- **Formulários**: Form, Input, Label, Select, Checkbox
- **Navegação**: Sidebar, Breadcrumb, Tabs, Dropdown Menu
- **Layout**: Card, Sheet, Dialog, Drawer, Separator
- **Dados**: Table, Pagination, Badge, Avatar
- **Feedback**: Skeleton, Sonner (toasts), Tooltip
- **Interação**: Button, Toggle, Toggle Group
- **Visualização**: Chart, Calendar

#### Blocks Complexos

- **dashboard-01**: Dashboard completo com sidebar, tabelas e gráficos
- **sidebar-01**: Navegação lateral com busca e versioning
- **login-01**: Formulário de autenticação

### Dependências Adicionadas Automaticamente

- **Radix UI**: 18 primitivos de componentes
- **Ícones**: Lucide React + Tabler Icons
- **Gráficos**: Recharts
- **Drag & Drop**: DnD Kit completo
- **Temas**: next-themes
- **Utilitários**: clsx, tailwind-merge, date-fns, class-variance-authority

### Estrutura Final

```
contabil-pro/src/
├── app/
│   ├── dashboard/page.tsx    # Dashboard principal
│   ├── login/page.tsx        # Página de login
│   └── ...
├── components/
│   ├── ui/                   # 26 componentes base
│   ├── app-sidebar.tsx       # Sidebar principal
│   ├── data-table.tsx        # Tabela de dados
│   ├── login-form.tsx        # Form de login
│   └── ...
├── hooks/
│   └── use-mobile.ts         # Hook para mobile
└── lib/
    └── utils.ts              # Utilitários
```

### Resultado

- ✅ Interface profissional e moderna
- ✅ 26 componentes UI prontos para uso
- ✅ Dashboard completo funcional
- ✅ Sistema de temas dark/light
- ✅ Componentes acessíveis (ARIA)
- ✅ Responsividade mobile-first

---

## ⚡ **Fase 3: Funcionalidades Avançadas**

### Objetivo

Implementar funcionalidades avançadas com TanStack Query, Server Actions e
utilitários para um sistema contábil completo.

### Comandos Executados

```bash
# 1. Instalar TanStack Query
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### Arquivos Criados

#### Configuração e Utilitários

- **src/lib/supabase.ts** - Cliente Supabase configurado
- **src/lib/validations.ts** - Schemas Zod para todas as entidades
- **src/lib/query-client.ts** - Configuração do TanStack Query
- **src/components/providers.tsx** - Provider centralizado

#### Server Actions

- **src/actions/clients.ts** - CRUD de clientes
- **src/actions/entries.ts** - CRUD de lançamentos + classificação IA

#### Configuração

- **.env.local.example** - Template de variáveis de ambiente

### Schemas Zod Implementados

```typescript
// Principais entidades do sistema contábil
;-clientSchema - // Validação de clientes
  entrySchema - // Validação de lançamentos contábeis
  accountSchema - // Validação de contas contábeis
  documentSchema - // Validação de documentos
  bankTransactionSchema // Validação de transações bancárias
```

### Server Actions Implementadas

```typescript
// CRUD Clientes
;-createClient() - // Criar cliente com validação Zod
  getClients() - // Listar clientes
  updateClient() - // Atualizar cliente
  // CRUD Lançamentos
  createEntry() - // Criar lançamento contábil
  getEntries() - // Listar lançamentos com joins
  classifyEntry() // Classificação IA (placeholder)
```

### TanStack Query Features

- ✅ **Query Client** configurado com retry logic
- ✅ **Stale time** de 1 minuto para performance
- ✅ **Cache time** de 5 minutos
- ✅ **Retry policy** inteligente (não retry em 4xx)
- ✅ **SSR-safe** query client
- ✅ **DevTools** habilitadas para desenvolvimento

### Provider System

- ✅ **QueryClientProvider** - Estado do servidor
- ✅ **ThemeProvider** - Temas dark/light
- ✅ **Toaster** - Notificações globais
- ✅ **ReactQueryDevtools** - Debug em desenvolvimento

---

## 📊 **Resumo Final**

### Stack Tecnológica Completa

- **Frontend**: Next.js 15.5.4 + React 19.1.0 + TypeScript 5
- **Styling**: Tailwind CSS 4 + shadcn/ui + Radix UI
- **Backend**: Supabase (Auth + Postgres + Storage + RLS)
- **Estado**: TanStack Query 5.90.2 + TanStack Table 8.21.3
- **Validação**: Zod 4.1.11 + React Hook Form 7.63.0
- **UI/UX**: 26 componentes + 3 blocks + temas + ícones

### Dependências Totais

- **Runtime**: 35 dependências principais
- **Dev**: 8 dependências de desenvolvimento
- **Total**: 528 pacotes auditados
- **Vulnerabilidades**: 0 encontradas

### Status do Projeto

- ✅ **Servidor**: http://localhost:3001 (funcionando)
- ✅ **Turbopack**: Habilitado para desenvolvimento rápido
- ✅ **Hot Reload**: Funcionando perfeitamente
- ✅ **TypeScript**: Configurado e sem erros
- ✅ **ESLint**: Configurado e sem warnings
- ✅ **Build**: Pronto para produção

---

## 🎯 **Próximos Passos**

Com o setup completo, o ContabilPRO está pronto para:

1. **Configurar Supabase** - Criar projeto e configurar RLS
2. **Implementar Autenticação** - JWT + multi-tenancy
3. **Criar Banco de Dados** - Tabelas + políticas RLS
4. **Desenvolver Features** - Módulos contábeis específicos
5. **Integrar APIs** - NFe, NFS-e, Open Finance
6. **Implementar IA** - Classificação e conciliação
7. **Testes** - Unit, integration e E2E
8. **Deploy** - Vercel + Supabase

O projeto tem uma base sólida e profissional, seguindo as melhores práticas de
desenvolvimento moderno e está alinhado com a especificação técnica do
ContabilPRO.

---

## 🔧 **Comandos Úteis**

### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm start

# Linting
npm run lint
```

### shadcn/ui

```bash
# Adicionar novos componentes
npx shadcn@latest add [component-name]

# Listar componentes disponíveis
npx shadcn@latest add

# Adicionar blocks
npx shadcn@latest add [block-name]
```

### Supabase (quando configurado)

```bash
# Instalar CLI do Supabase
npm install -D supabase

# Inicializar projeto local
npx supabase init

# Iniciar Supabase local
npx supabase start

# Aplicar migrations
npx supabase db push
```

---

## 📁 **Estrutura de Arquivos Detalhada**

```text
contabil-pro/
├── docs/
│   └── setup-fases.md           # Este documento
├── src/
│   ├── actions/                 # Server Actions do Next.js
│   │   ├── clients.ts          # CRUD de clientes
│   │   └── entries.ts          # CRUD de lançamentos
│   ├── app/                    # Next.js App Router
│   │   ├── dashboard/
│   │   │   ├── page.tsx        # Dashboard principal
│   │   │   └── data.json       # Dados de exemplo
│   │   ├── login/
│   │   │   └── page.tsx        # Página de login
│   │   ├── favicon.ico
│   │   ├── globals.css         # Estilos globais + Tailwind
│   │   ├── layout.tsx          # Layout raiz
│   │   └── page.tsx            # Página inicial
│   ├── components/             # Componentes React
│   │   ├── ui/                 # Componentes shadcn/ui (26 arquivos)
│   │   │   ├── button.tsx
│   │   │   ├── form.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── app-sidebar.tsx     # Sidebar principal
│   │   ├── data-table.tsx      # Tabela com TanStack Table
│   │   ├── login-form.tsx      # Formulário de login
│   │   ├── providers.tsx       # Providers centralizados
│   │   └── ...
│   ├── hooks/                  # Custom React Hooks
│   │   └── use-mobile.ts       # Hook para detecção mobile
│   └── lib/                    # Utilitários e configurações
│       ├── query-client.ts     # Configuração TanStack Query
│       ├── supabase.ts         # Cliente Supabase
│       ├── utils.ts            # Utilitários gerais (cn, etc.)
│       └── validations.ts      # Schemas Zod
├── public/                     # Arquivos estáticos
├── .env.local.example          # Template de variáveis de ambiente
├── components.json             # Configuração shadcn/ui
├── next.config.ts              # Configuração Next.js
├── package.json                # Dependências e scripts
├── tailwind.config.ts          # Configuração Tailwind CSS
└── tsconfig.json               # Configuração TypeScript
```

---

## 🚨 **Troubleshooting**

### Problemas Comuns

#### 1. Porta 3000 ocupada

```bash
# O Next.js automaticamente usa a próxima porta disponível
# Geralmente 3001, 3002, etc.
```

#### 2. Erro de importação de componentes

```bash
# Verificar se o componente foi instalado
npx shadcn@latest add [component-name]

# Verificar imports no arquivo
import { Button } from "@/components/ui/button"
```

#### 3. Erro de TypeScript

```bash
# Verificar se os tipos estão instalados
npm install -D @types/node @types/react @types/react-dom
```

#### 4. Erro de Tailwind CSS

```bash
# Verificar se o Tailwind está configurado
# Arquivo: tailwind.config.ts deve existir
```

### Logs Úteis

```bash
# Ver logs detalhados do Next.js
npm run dev -- --debug

# Ver informações do build
npm run build -- --debug
```

---

## 📚 **Recursos e Documentação**

### Documentação Oficial

- [Next.js 15](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Supabase](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Zod](https://zod.dev/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Recursos Específicos do ContabilPRO

- [Especificação Técnica](../sistema.md)
- [Roadmap de Desenvolvimento](../sistema.md#roadmap)
- [Arquitetura Multi-tenant](../sistema.md#rls)

---

## ✅ **Checklist de Verificação**

Após executar as 3 fases, verifique:

- [ ] Servidor Next.js rodando sem erros
- [ ] shadcn/ui componentes funcionando
- [ ] TanStack Query configurado
- [ ] TypeScript sem erros
- [ ] ESLint sem warnings
- [ ] Tailwind CSS aplicando estilos
- [ ] Temas dark/light funcionando
- [ ] Componentes responsivos
- [ ] Server Actions criadas
- [ ] Schemas Zod validando
- [ ] Estrutura de pastas organizada

**Status**: ✅ **Setup Completo e Funcional**

---

## 🔧 **Fase 4: Qualidade de Código (CONCLUÍDA)**

### **ESLint Flat Config (v9)**

- ✅ **Configuração moderna** com flat config format
- ✅ **Regras TypeScript** rigorosas com type checking
- ✅ **React Hooks** e JSX accessibility
- ✅ **Import sorting** automático e organização
- ✅ **Prettier integration** para formatação consistente
- ✅ **UTF-8 encoding** configurado em todos os arquivos

#### **Arquivos de Configuração**

```text
├── eslint.config.js          # ESLint flat config principal
├── .prettierrc.js           # Configuração Prettier com UTF-8
├── .prettierignore          # Arquivos ignorados pelo Prettier
├── .editorconfig            # Encoding UTF-8 universal
└── .vscode/
    ├── settings.json        # UTF-8 e formatação automática
    └── extensions.json      # Extensões recomendadas
```

#### **Scripts de Qualidade**

```bash
# Linting e formatação
npm run lint              # ESLint com correção automática
npm run lint:check        # Verificar sem corrigir
npm run format            # Prettier em todos os arquivos
npm run format:check      # Verificar formatação

# Verificação completa
npm run quality           # Lint + format + type check
```

### **Configurações UTF-8**

- ✅ **EditorConfig** com `charset = utf-8`
- ✅ **VSCode settings** com `"files.encoding": "utf8"`
- ✅ **Prettier** com `endOfLine: 'lf'`
- ✅ **Git** configurado para LF line endings

---

## 🎯 **Fase 5: Infraestrutura Completa (CONCLUÍDA)**

### **🗄️ Banco de Dados e RLS**

- ✅ **11 tabelas núcleo** criadas com migrações SQL
- ✅ **Políticas RLS** implementadas para multi-tenancy
- ✅ **Scripts de teste** para validar isolamento de dados
- ✅ **Dados de exemplo** para desenvolvimento

### **🧪 Stack de Testes Completa**

- ✅ **Vitest** - Testes unitários e de integração
- ✅ **Testing Library** - Testes de componentes React
- ✅ **Playwright** - Testes E2E automatizados
- ✅ **Cucumber/BDD** - Testes comportamentais em português
- ✅ **13 testes unitários** passando
- ✅ **5 .feature files** com cenários reais

### **📊 Cobertura de Testes**

- ✅ **Validações Zod** - 13 testes unitários
- ✅ **Autenticação** - Cenários BDD completos
- ✅ **Gestão de Clientes** - Fluxos de CRUD
- ✅ **Lançamentos Contábeis** - Partidas dobradas
- ✅ **Importação NFe** - Validação e processamento
- ✅ **Conciliação Bancária** - Matching automático

### **🔧 Scripts Disponíveis**

```bash
# Testes
npm run test              # Testes unitários
npm run test:watch        # Testes em modo watch
npm run test:coverage     # Cobertura de código
npm run test:e2e          # Testes E2E Playwright
npm run test:bdd          # Testes BDD Cucumber
npm run test:all          # Todos os testes

# Supabase
npm run db:migrate        # Aplicar migrações
npm run db:seed           # Inserir dados exemplo
npm run db:types          # Gerar tipos TypeScript

# Scripts auxiliares
./scripts/setup-supabase.sh  # Configurar Supabase completo
./scripts/run-tests.sh       # Executar todos os testes
```

## **O ContabilPRO está pronto para desenvolvimento! 🚀**
