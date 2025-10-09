# ContabilPRO 

> Sistema inteligente de gestão contábil com importação automatizada de documentos fiscais e extratos bancários.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black.svg)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)

##  Visão Geral

ContabilPRO é uma plataforma moderna de gestão contábil desenvolvida para contadores brasileiros, automatizando a importação e processamento de documentos fiscais (NF-e, NFSe, NFC-e) e extratos bancários (OFX).

###  Principais Funcionalidades

-  **Autenticação Segura** - Sistema multi-tenant com isolamento completo de dados
-  **Gestão de Clientes** - CRUD completo com validação de CNPJ
-  **Importação Automática** - Upload com drag-and-drop de XML e OFX
-  **Processamento Inteligente** - Edge Functions para parsing e validação
-  **Dashboard Completo** - Estatísticas, filtros e histórico de uploads
-  **Reprocessamento** - Retry automático para documentos com falha
-  **Exclusão Segura** - Cascade delete com cleanup de storage
-  **Testes Automatizados** - Suite completa com Jest e Testing Library

##  Começando

### Pré-requisitos

- **Node.js** 20.x ou superior
- **npm** ou **pnpm**
- **Supabase CLI** (para desenvolvimento local)
- **Git**

### Instalação

1. **Clone o repositório**
   `ash
   git clone https://github.com/feolivs/contabilpro.git
   cd contabilpro
   `

2. **Instale as dependências**
   `ash
   npm install
   `

3. **Configure as variáveis de ambiente**
   `ash
   cp .env.local.example .env.local
   `

4. **Aplique as migrations**
   `ash
   npx supabase db push
   `

5. **Inicie o servidor de desenvolvimento**
   `ash
   npm run dev
   `

##  Scripts Disponíveis

`ash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção

# Qualidade de Código
npm run lint             # Executa ESLint
npm run type-check       # Verifica tipos TypeScript

# Testes
npm test                 # Executa todos os testes
npm run test:coverage    # Com cobertura

# Supabase
npm run deploy_functions # Deploy Edge Functions
`

##  Stack Tecnológica

- **Next.js 15.5** - React framework
- **TypeScript 5.7** - Type safety
- **Supabase** - Backend (PostgreSQL + Auth + Storage + Edge Functions)
- **Tailwind CSS** + **shadcn/ui** - Styling
- **TanStack Query** - Data fetching
- **Zustand** - State management

##  Documentação

- [Testes](tests/README.md) - Guia de testes
- [Arquitetura](.agent/wiki/architecture.md) - Arquitetura do sistema
- [Segurança](.agent/security/policy.md) - Políticas de segurança

---

**Desenvolvido com  para contadores brasileiros**
