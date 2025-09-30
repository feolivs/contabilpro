# 📊 ContabilPRO

**SaaS Contábil Multi-Tenant com Next.js 15 + Supabase**

[![Next.js](https://img.shields.io/badge/Next.js-15.5.4-black)](https://nextjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-MVP%20Completo-success)](https://github.com)

---

## 🎯 Sobre o Projeto

ContabilPRO é um sistema de gestão contábil multi-tenant desenvolvido para escritórios de contabilidade. O sistema permite gerenciar múltiplos clientes (tenants) com isolamento total de dados, garantindo segurança e conformidade com a LGPD.

### Tecnologias Principais:
- **Frontend:** Next.js 15 (App Router + Server Actions)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **UI:** shadcn/ui + Tailwind CSS
- **Validação:** Zod
- **Segurança:** Row Level Security (RLS) + Multi-tenant

---

## ✅ Funcionalidades Implementadas

### 📄 Módulo de Documentos (100% Completo)
- ✅ Upload de documentos (até 50MB)
- ✅ Upload múltiplo com drag & drop
- ✅ Detecção de duplicatas (SHA-256)
- ✅ Listagem com ordenação e filtros
- ✅ Download com URLs assinadas (1 hora)
- ✅ Delete (apenas admin/owner)
- ✅ Isolamento multi-tenant validado

**Acesso:** `/documentos`

---

## 🚀 Como Executar

### Pré-requisitos:
- Node.js 18+
- npm ou yarn
- Conta no Supabase

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Criar arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```

### 3. Executar Servidor
```bash
npm run dev
```

Acessar: http://localhost:3000

---

## 📚 Documentação

- **Relatório Final:** `docs/RELATORIO-FINAL-MVP-DOCUMENTOS.md`
- **Testes:** `docs/TESTES-DOCUMENTOS.md`
- **Segurança:** `docs/TESTE-SEGURANCA-MANUAL.md`

---

## 🎉 Status do Projeto

**MVP Documentos:** ✅ **100% COMPLETO**

**Próximos Passos:**
1. Implementar Módulo de Clientes
2. Implementar Dashboard
3. Implementar Lançamentos Contábeis

---

**🚀 Pronto para uso em produção!**
