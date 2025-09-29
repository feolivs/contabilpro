Vou usar o MCP do Context7 para buscar as melhores práticas e padrões de implementação para os componentes necessários. Deixe-me buscar informações sobre Next.js, React, formulários multi-step, tabelas avançadas e validação.



Agora vou buscar documentação específica sobre os padrões e melhores práticas:



Perfeito! Agora vou buscar mais informações sobre React Hook Form e padrões de multi-step forms:



Excelente! Agora tenho todas as informações necessárias. Vou criar um plano detalhado dividido em tasks para implementação:

---

# 📋 Plano de Implementação - Página de Clientes (ContabilPRO)

Baseado nas melhores práticas do **Next.js App Router**, **TanStack Table**, **Zod**, **cmdk** e no componente **data-table** já existente no projeto.

---

## 🎯 **SPRINT 1: Fundação e UX Funcional** (2 semanas)

### **EPIC 1: Migração do Schema e Validação** 
**Objetivo:** Preparar banco de dados e validações para novos campos

#### **Task 1.1: Migração do Banco de Dados**
**Descrição:** Adicionar novos campos à tabela `clients`
**Arquivos:** `infra/migrations/YYYYMMDD_add_client_fields.sql`

```sql
-- Adicionar novos campos
ALTER TABLE clients 
  ADD COLUMN tipo_pessoa VARCHAR(2) CHECK (tipo_pessoa IN ('PF', 'PJ')),
  ADD COLUMN regime_tributario VARCHAR(20) CHECK (regime_tributario IN ('MEI', 'Simples', 'Presumido', 'Real')),
  ADD COLUMN inscricao_estadual VARCHAR(20),
  ADD COLUMN inscricao_municipal VARCHAR(20),
  ADD COLUMN status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'inadimplente', 'onboarding', 'inativo')),
  ADD COLUMN dia_vencimento INTEGER CHECK (dia_vencimento BETWEEN 1 AND 31),
  ADD COLUMN valor_plano DECIMAL(10,2),
  ADD COLUMN forma_cobranca VARCHAR(20),
  ADD COLUMN tags JSONB DEFAULT '[]',
  ADD COLUMN cep VARCHAR(9),
  ADD COLUMN responsavel_nome VARCHAR(255),
  ADD COLUMN responsavel_telefone VARCHAR(20),
  ADD COLUMN ultima_atividade TIMESTAMP DEFAULT NOW(),
  ADD COLUMN score_risco INTEGER CHECK (score_risco BETWEEN 0 AND 100);

-- Índices para performance
CREATE INDEX idx_clients_regime ON clients(regime_tributario);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_document ON clients(document);
CREATE UNIQUE INDEX idx_clients_document_tenant ON clients(tenant_id, document);

-- Atualizar RLS policies (se necessário)
```

**Critérios de Aceitação:**
- [ ] Migração roda sem erros
- [ ] Índices criados corretamente
- [ ] Constraint UNIQUE em (tenant_id, document) funciona
- [ ] RLS policies continuam funcionando

---

#### **Task 1.2: Validadores de CPF/CNPJ**
**Descrição:** Criar funções de validação de documentos brasileiros
**Arquivos:** `packages/domain/src/validators/document.ts`

```typescript
// Baseado em Zod custom validators
export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '')
  if (cleaned.length !== 11) return false
  
  // Algoritmo de validação de CPF
  // ... implementação completa
  return true
}

export function validateCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, '')
  if (cleaned.length !== 14) return false
  
  // Algoritmo de validação de CNPJ
  // ... implementação completa
  return true
}

export function validateDocument(doc: string): boolean {
  const cleaned = doc.replace(/\D/g, '')
  if (cleaned.length === 11) return validateCPF(cleaned)
  if (cleaned.length === 14) return validateCNPJ(cleaned)
  return false
}
```

**Critérios de Aceitação:**
- [ ] Valida CPF corretamente (com dígitos verificadores)
- [ ] Valida CNPJ corretamente
- [ ] Rejeita documentos inválidos
- [ ] Testes unitários passando

---

#### **Task 1.3: Atualizar Schema Zod**
**Descrição:** Expandir `clientSchema` com novos campos e validações
**Arquivos:** `contabil-pro/src/lib/validations.ts`

```typescript
import { z } from 'zod'
import { validateDocument } from '@/lib/validators/document'

export const clientSchema = z.object({
  id: z.string().uuid().optional(),
  tenant_id: z.string().uuid(),
  
  // Campos existentes
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido').optional(),
  document: z.string()
    .min(11, 'Documento deve ter pelo menos 11 caracteres')
    .refine(validateDocument, 'CPF ou CNPJ inválido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  
  // Novos campos
  tipo_pessoa: z.enum(['PF', 'PJ']).optional(),
  regime_tributario: z.enum(['MEI', 'Simples', 'Presumido', 'Real']).optional(),
  inscricao_estadual: z.string().optional(),
  inscricao_municipal: z.string().optional(),
  status: z.enum(['ativo', 'inadimplente', 'onboarding', 'inativo']).default('ativo'),
  dia_vencimento: z.number().min(1).max(31).optional(),
  valor_plano: z.number().positive().optional(),
  forma_cobranca: z.string().optional(),
  tags: z.array(z.string()).default([]),
  cep: z.string().length(9).optional(),
  responsavel_nome: z.string().optional(),
  responsavel_telefone: z.string().optional(),
  ultima_atividade: z.date().optional(),
  score_risco: z.number().min(0).max(100).optional(),
  
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
})

export type Client = z.infer<typeof clientSchema>
```

**Critérios de Aceitação:**
- [ ] Schema compila sem erros
- [ ] Validação de documento funciona
- [ ] Tipos TypeScript corretos
- [ ] Testes de validação passando

---

### **EPIC 2: Command Palette (Busca Global)**
**Objetivo:** Implementar busca global com atalho Cmd/Ctrl+K

#### **Task 2.1: Componente CommandPalette**
**Descrição:** Criar busca global usando `cmdk`
**Arquivos:** `contabil-pro/src/components/command-palette.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Command } from 'cmdk'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { searchClients } from '@/actions/clients'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const router = useRouter()

  // Atalho Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Debounce search (300ms)
  useEffect(() => {
    if (!search) {
      setResults([])
      return
    }

    const timer = setTimeout(async () => {
      const data = await searchClients(search)
      setResults(data)
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0">
        <Command label="Busca Global">
          <Command.Input 
            placeholder="Buscar clientes, documentos, lançamentos..." 
            value={search}
            onValueChange={setSearch}
          />
          <Command.List>
            <Command.Empty>Nenhum resultado encontrado.</Command.Empty>
            
            <Command.Group heading="Clientes">
              {results.map((client) => (
                <Command.Item
                  key={client.id}
                  onSelect={() => {
                    router.push(`/clientes/${client.id}`)
                    setOpen(false)
                  }}
                >
                  {client.name} • {client.document}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
}
```

**Critérios de Aceitação:**
- [ ] Abre com Cmd/Ctrl+K
- [ ] Busca com debounce de 300ms
- [ ] Navega para cliente ao selecionar
- [ ] Fecha ao pressionar Esc
- [ ] Acessível (ARIA labels)

---

#### **Task 2.2: Server Action de Busca**
**Descrição:** Criar busca server-side com Full-Text Search
**Arquivos:** `contabil-pro/src/actions/clients.ts`

```typescript
'use server'

import { requireAuth, setRLSContext } from '@/lib/auth'

export async function searchClients(query: string) {
  const session = await requireAuth()
  const supabase = await setRLSContext(session)

  const { data, error } = await supabase
    .from('clients')
    .select('id, name, document, email, status')
    .or(`name.ilike.%${query}%,document.ilike.%${query}%,email.ilike.%${query}%`)
    .limit(10)

  if (error) throw error
  return data
}
```

**Critérios de Aceitação:**
- [ ] Busca por nome, documento e email
- [ ] Respeita RLS (tenant_id)
- [ ] Retorna máximo 10 resultados
- [ ] Performance < 200ms

---

### **EPIC 3: Modal Multi-Step de Cadastro**
**Objetivo:** Substituir formulário inline por modal com 3 etapas

#### **Task 3.1: Componente Stepper**
**Descrição:** Criar indicador visual de progresso
**Arquivos:** `contabil-pro/src/components/ui/stepper.tsx`

```typescript
'use client'

import { cn } from '@/lib/utils'

interface StepperProps {
  steps: string[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full border-2",
              index < currentStep && "border-primary bg-primary text-primary-foreground",
              index === currentStep && "border-primary text-primary",
              index > currentStep && "border-muted text-muted-foreground"
            )}
          >
            {index + 1}
          </div>
          <span className="ml-2 text-sm">{step}</span>
          {index < steps.length - 1 && (
            <div className="mx-4 h-0.5 w-12 bg-muted" />
          )}
        </div>
      ))}
    </div>
  )
}
```

**Critérios de Aceitação:**
- [ ] Mostra 3 steps
- [ ] Destaca step atual
- [ ] Marca steps completos
- [ ] Responsivo

---

#### **Task 3.2: Modal ClientModal (Step 1: Dados Fiscais)**
**Descrição:** Primeiro step do formulário
**Arquivos:** `contabil-pro/src/components/client-modal.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Stepper } from '@/components/ui/stepper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { createClientMultiStep } from '@/actions/clients'

const STEPS = ['Dados Fiscais', 'Contato', 'Financeiro']

export function ClientModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [step, setStep] = useState(0)
  const [formData, setFormData] = useState({})
  const [state, action, isPending] = useActionState(createClientMultiStep, { status: 'idle' })

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>

        <Stepper steps={STEPS} currentStep={step} />

        <form action={action} className="space-y-4">
          {step === 0 && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
                <Select name="tipo_pessoa" required>
                  <option value="PF">Pessoa Física</option>
                  <option value="PJ">Pessoa Jurídica</option>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="document">CPF/CNPJ</Label>
                <Input 
                  id="document" 
                  name="document" 
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  required 
                />
                {state.fieldErrors?.document && (
                  <p className="text-sm text-destructive">{state.fieldErrors.document}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="name">Razão Social / Nome</Label>
                <Input id="name" name="name" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="inscricao_estadual">Inscrição Estadual</Label>
                  <Input id="inscricao_estadual" name="inscricao_estadual" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="inscricao_municipal">Inscrição Municipal</Label>
                  <Input id="inscricao_municipal" name="inscricao_municipal" />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="regime_tributario">Regime Tributário</Label>
                <Select name="regime_tributario">
                  <option value="">Selecione...</option>
                  <option value="MEI">MEI</option>
                  <option value="Simples">Simples Nacional</option>
                  <option value="Presumido">Lucro Presumido</option>
                  <option value="Real">Lucro Real</option>
                </Select>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              {/* Step 2: Contato - implementar na próxima task */}
            </>
          )}

          {step === 2 && (
            <>
              {/* Step 3: Financeiro - implementar na próxima task */}
            </>
          )}

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={handleBack} disabled={step === 0}>
              Voltar
            </Button>
            {step < STEPS.length - 1 ? (
              <Button type="button" onClick={handleNext}>
                Próximo
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Salvando...' : 'Salvar Cliente'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Critérios de Aceitação:**
- [ ] Modal abre/fecha corretamente
- [ ] Step 1 com campos fiscais
- [ ] Validação de CPF/CNPJ em tempo real
- [ ] Botões Voltar/Próximo funcionam
- [ ] Responsivo

---

#### **Task 3.3: Steps 2 e 3 do Modal**
**Descrição:** Completar steps de Contato e Financeiro
**Arquivos:** `contabil-pro/src/components/client-modal.tsx` (continuação)

```typescript
// Step 2: Contato
{step === 1 && (
  <>
    <div className="grid gap-2">
      <Label htmlFor="email">E-mail</Label>
      <Input id="email" name="email" type="email" />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="phone">Telefone</Label>
        <Input id="phone" name="phone" placeholder="(11) 99999-9999" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="responsavel_telefone">Tel. Responsável</Label>
        <Input id="responsavel_telefone" name="responsavel_telefone" />
      </div>
    </div>

    <div className="grid gap-2">
      <Label htmlFor="responsavel_nome">Nome do Responsável</Label>
      <Input id="responsavel_nome" name="responsavel_nome" />
    </div>

    <div className="grid gap-2">
      <Label htmlFor="cep">CEP</Label>
      <Input 
        id="cep" 
        name="cep" 
        placeholder="00000-000"
        onBlur={async (e) => {
          // Autopreencher endereço via ViaCEP
          const cep = e.target.value.replace(/\D/g, '')
          if (cep.length === 8) {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
            const data = await res.json()
            // Preencher campos de endereço
          }
        }}
      />
    </div>

    <div className="grid gap-2">
      <Label htmlFor="address">Endereço Completo</Label>
      <Input id="address" name="address" />
    </div>
  </>
)}

// Step 3: Financeiro
{step === 2 && (
  <>
    <div className="grid grid-cols-2 gap-4">
      <div className="grid gap-2">
        <Label htmlFor="dia_vencimento">Dia de Vencimento</Label>
        <Input 
          id="dia_vencimento" 
          name="dia_vencimento" 
          type="number" 
          min="1" 
          max="31" 
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="valor_plano">Valor do Plano (R$)</Label>
        <Input 
          id="valor_plano" 
          name="valor_plano" 
          type="number" 
          step="0.01" 
        />
      </div>
    </div>

    <div className="grid gap-2">
      <Label htmlFor="forma_cobranca">Forma de Cobrança</Label>
      <Select name="forma_cobranca">
        <option value="">Selecione...</option>
        <option value="boleto">Boleto</option>
        <option value="pix">PIX</option>
        <option value="cartao">Cartão de Crédito</option>
      </Select>
    </div>

    <div className="grid gap-2">
      <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
      <Input 
        id="tags" 
        name="tags" 
        placeholder="mei, ecommerce, startup" 
      />
    </div>
  </>
)}
```

**Critérios de Aceitação:**
- [ ] Step 2 com campos de contato
- [ ] Autopreencher endereço via CEP funciona
- [ ] Step 3 com campos financeiros
- [ ] Validação de valores numéricos
- [ ] Tags parseadas corretamente

---

#### **Task 3.4: Server Action Multi-Step**
**Descrição:** Processar dados dos 3 steps
**Arquivos:** `contabil-pro/src/actions/clients.ts`

```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { requireAuth, setRLSContext } from '@/lib/auth'
import { clientSchema } from '@/lib/validations'

export async function createClientMultiStep(
  _prevState: any,
  formData: FormData
) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    // Parse tags
    const tagsString = formData.get('tags')?.toString() || ''
    const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean)

    const input = {
      tipo_pessoa: formData.get('tipo_pessoa')?.toString(),
      document: formData.get('document')?.toString() || '',
      name: formData.get('name')?.toString() || '',
      inscricao_estadual: formData.get('inscricao_estadual')?.toString(),
      inscricao_municipal: formData.get('inscricao_municipal')?.toString(),
      regime_tributario: formData.get('regime_tributario')?.toString(),
      email: formData.get('email')?.toString(),
      phone: formData.get('phone')?.toString(),
      responsavel_nome: formData.get('responsavel_nome')?.toString(),
      responsavel_telefone: formData.get('responsavel_telefone')?.toString(),
      cep: formData.get('cep')?.toString(),
      address: formData.get('address')?.toString(),
      dia_vencimento: formData.get('dia_vencimento') ? Number(formData.get('dia_vencimento')) : undefined,
      valor_plano: formData.get('valor_plano') ? Number(formData.get('valor_plano')) : undefined,
      forma_cobranca: formData.get('forma_cobranca')?.toString(),
      tags,
      status: 'onboarding' as const,
    }

    const validated = clientSchema.omit({ id: true, tenant_id: true, created_at: true, updated_at: true }).parse(input)

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...validated,
        tenant_id: session.tenant_id,
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/clientes')
    return { status: 'success', message: 'Cliente criado com sucesso!', data }
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro ao criar cliente',
    }
  }
}
```

**Critérios de Aceitação:**
- [ ] Valida todos os campos
- [ ] Parse de tags funciona
- [ ] Insere no banco com RLS
- [ ] Revalida cache
- [ ] Retorna erros específicos

---

### **EPIC 4: Tabela Avançada com TanStack Table**
**Objetivo:** Substituir tabela simples por versão com filtros, ordenação e ações

#### **Task 4.1: Definir Colunas da Tabela**
**Descrição:** Criar definições de colunas com TanStack Table
**Arquivos:** `contabil-pro/src/app/(tenant)/clientes/columns.tsx`

```typescript
'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { IconDotsVertical } from '@tabler/icons-react'
import { format } from 'date-fns'
import type { Client } from '@/lib/validations'

export const clientColumns: ColumnDef<Client>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: 'Cliente',
    cell: ({ row }) => {
      const initials = row.original.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()

      return (
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.email}</div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'document',
    header: 'Documento',
    cell: ({ row }) => {
      const doc = row.original.document
      // Formatar CPF/CNPJ
      if (doc.length === 11) {
        return doc.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      }
      return doc.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
    },
  },
  {
    accessorKey: 'regime_tributario',
    header: 'Regime',
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.regime_tributario || '-'}</Badge>
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const statusMap = {
        ativo: { label: 'Ativo', variant: 'default' },
        inadimplente: { label: 'Inadimplente', variant: 'destructive' },
        onboarding: { label: 'Onboarding', variant: 'secondary' },
        inativo: { label: 'Inativo', variant: 'outline' },
      }
      const status = statusMap[row.original.status as keyof typeof statusMap]
      return <Badge variant={status.variant as any}>{status.label}</Badge>
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    id: 'pendencias',
    header: 'Pendências',
    cell: () => {
      // TODO: Implementar contagem de pendências
      return <Badge variant="secondary">0</Badge>
    },
  },
  {
    accessorKey: 'ultima_atividade',
    header: 'Última Atividade',
    cell: ({ row }) => {
      if (!row.original.ultima_atividade) return '-'
      return format(new Date(row.original.ultima_atividade), 'dd/MM/yyyy HH:mm')
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <IconDotsVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => window.location.href = `/clientes/${row.original.id}`}>
            Ver detalhes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.location.href = `/clientes/${row.original.id}/editar`}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
```

**Critérios de Aceitação:**
- [ ] Avatar com iniciais
- [ ] Formatação de CPF/CNPJ
- [ ] Badges de regime e status
- [ ] Dropdown de ações funciona
- [ ] Seleção de linhas funciona

---

#### **Task 4.2: Componente ClientsDataTable**
**Descrição:** Tabela completa com filtros e paginação
**Arquivos:** `contabil-pro/src/app/(tenant)/clientes/clients-data-table.tsx`

```typescript
'use client'

import { useState } from 'react'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { clientColumns } from './columns'
import type { Client } from '@/lib/validations'

interface ClientsDataTableProps {
  data: Client[]
}

export function ClientsDataTable({ data }: ClientsDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const table = useReactTable({
    data,
    columns: clientColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por nome..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(e) => table.getColumn('name')?.setFilterValue(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={(table.getColumn('regime_tributario')?.getFilterValue() as string) ?? 'all'}
          onValueChange={(value) => 
            table.getColumn('regime_tributario')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Regime" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="MEI">MEI</SelectItem>
            <SelectItem value="Simples">Simples</SelectItem>
            <SelectItem value="Presumido">Presumido</SelectItem>
            <SelectItem value="Real">Real</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn('status')?.getFilterValue() as string) ?? 'all'}
          onValueChange={(value) => 
            table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inadimplente">Inadimplente</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={clientColumns.length} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} de{' '}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Anterior
          </Button>
          <span className="text-sm">
            Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Próxima
          </Button>
        </div>
      </div>
    </div>
  )
}
```

**Critérios de Aceitação:**
- [ ] Filtros funcionam (nome, regime, status)
- [ ] Ordenação por colunas
- [ ] Paginação funciona
- [ ] Seleção múltipla
- [ ] Responsivo

---

#### **Task 4.3: Integrar Tabela na Página**
**Descrição:** Substituir ClientsTable por ClientsDataTable
**Arquivos:** `contabil-pro/src/app/(tenant)/clientes/page.tsx`

```typescript
import { headers } from 'next/headers'
import { getClients } from '@/actions/clients'
import { Button } from '@/components/ui/button'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'
import { requirePermission } from '@/lib/rbac'
import { ClientsDataTable } from './clients-data-table'
import { ClientModal } from '@/components/client-modal'

export default async function ClientesPage() {
  await requirePermission('clientes.read')

  const result = await getClients()
  const clients = result.success && Array.isArray(result.data) ? result.data : []

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Clientes</h1>
          <p className='text-muted-foreground'>Gerencie cadastros e documentos por cliente.</p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='sm'>
            Importar clientes
          </Button>
          <ClientModal />
        </div>
      </div>

      <ClientsDataTable data={clients} />
    </div>
  )
}
```

**Critérios de Aceitação:**
- [ ] Tabela renderiza corretamente
- [ ] Modal abre ao clicar "Novo cliente"
- [ ] Dados carregam do servidor
- [ ] Performance adequada

---

### **EPIC 5: Mini-KPIs e Estado Vazio**
**Objetivo:** Adicionar métricas e melhorar UX quando não há dados

#### **Task 5.1: Server Action de Estatísticas**
**Descrição:** Buscar métricas agregadas
**Arquivos:** `contabil-pro/src/actions/clients.ts`

```typescript
'use server'

import { requireAuth, setRLSContext } from '@/lib/auth'

export async function getClientStats() {
  const session = await requireAuth()
  const supabase = await setRLSContext(session)

  const [ativos, inadimplentes, onboarding] = await Promise.all([
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'ativo'),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'inadimplente'),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('status', 'onboarding'),
  ])

  return {
    ativos: ativos.count || 0,
    inadimplentes: inadimplentes.count || 0,
    onboarding: onboarding.count || 0,
    pendencias: 0, // TODO: implementar
  }
}
```

**Critérios de Aceitação:**
- [ ] Retorna contagens corretas
- [ ] Respeita RLS
- [ ] Performance < 500ms

---

#### **Task 5.2: Componente ClientKPIs**
**Descrição:** Exibir métricas compactas
**Arquivos:** `contabil-pro/src/components/client-kpis.tsx`

```typescript
import { getClientStats } from '@/actions/clients'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export async function ClientKPIs() {
  const stats = await getClientStats()

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Ativos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.ativos}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Inadimplentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{stats.inadimplentes}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Onboarding</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.onboarding}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Pendências</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendencias}</div>
        </CardContent>
      </Card>
    </div>
  )
}
```

**Critérios de Aceitação:**
- [ ] Exibe 4 KPIs
- [ ] Cores adequadas (vermelho para inadimplentes)
- [ ] Responsivo (2 colunas em mobile)
- [ ] Carrega rápido (< 1s)

---

#### **Task 5.3: Estado Vazio**
**Descrição:** Melhorar UX quando não há clientes
**Arquivos:** `contabil-pro/src/components/empty-state.tsx`

```typescript
import { Button } from '@/components/ui/button'
import { IconUsers } from '@tabler/icons-react'

export function EmptyState({ onNewClient }: { onNewClient: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
      <IconUsers className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">Nenhum cliente cadastrado</h3>
      <p className="text-sm text-muted-foreground mt-2 mb-6">
        Comece adicionando seu primeiro cliente ou importe uma lista existente.
      </p>
      <div className="flex gap-2">
        <Button onClick={onNewClient}>Novo Cliente</Button>
        <Button variant="outline">Importar do Excel</Button>
        <Button variant="ghost">Ver exemplo preenchido</Button>
      </div>
    </div>
  )
}
```

**Critérios de Aceitação:**
- [ ] Mostra quando lista vazia
- [ ] CTAs claros
- [ ] Ícone ilustrativo
- [ ] Acessível

---

## 🎯 **SPRINT 2: Produtividade e IA Leve** (2 semanas)

### **EPIC 6: Importação Avançada**
**Objetivo:** Preview, deduplicação e relatório detalhado

#### **Task 6.1: Preview de Importação**
**Descrição:** Mostrar primeiras 20 linhas antes de confirmar
**Arquivos:** `contabil-pro/src/app/(tenant)/clientes/importar/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Table } from '@/components/ui/table'
import { previewCSV, confirmImport } from '@/actions/clients'

export default function ImportarPage() {
  const [preview, setPreview] = useState(null)
  const [file, setFile] = useState(null)

  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    setFile(file)
    
    const formData = new FormData()
    formData.append('file', file)
    
    const result = await previewCSV(formData)
    setPreview(result)
  }

  const handleConfirm = async () => {
    const formData = new FormData()
    formData.append('file', file)
    
    const result = await confirmImport(formData)
    // Mostrar relatório
  }

  return (
    <div className="space-y-6">
      <input type="file" accept=".csv,.xlsx" onChange={handleFileChange} />
      
      {preview && (
        <>
          <div className="text-sm text-muted-foreground">
            Mostrando {preview.rows.length} de {preview.total} linhas
          </div>
          
          <Table>
            {/* Renderizar preview */}
          </Table>

          <div className="flex gap-2">
            <Button onClick={handleConfirm}>Confirmar Importação</Button>
            <Button variant="outline" onClick={() => setPreview(null)}>Cancelar</Button>
          </div>
        </>
      )}
    </div>
  )
}
```

**Critérios de Aceitação:**
- [ ] Preview mostra 20 linhas
- [ ] Detecta colunas automaticamente
- [ ] Valida formato antes de preview
- [ ] Botão confirmar só aparece após preview

---

#### **Task 6.2: Deduplicação por CNPJ/CPF**
**Descrição:** Detectar duplicatas e oferecer merge
**Arquivos:** `contabil-pro/src/actions/clients.ts`

```typescript
'use server'

export async function confirmImport(formData: FormData) {
  // ... parse CSV

  const duplicates = []
  const toInsert = []

  for (const row of rows) {
    const existing = await supabase
      .from('clients')
      .select('id, name')
      .eq('document', row.document)
      .single()

    if (existing.data) {
      duplicates.push({
        existing: existing.data,
        new: row,
      })
    } else {
      toInsert.push(row)
    }
  }

  // Se houver duplicatas, retornar para usuário decidir
  if (duplicates.length > 0) {
    return {
      status: 'duplicates',
      duplicates,
      toInsert,
    }
  }

  // Inserir novos
  const { data, error } = await supabase.from('clients').insert(toInsert)

  return {
    status: 'success',
    created: toInsert.length,
    duplicates: 0,
  }
}
```

**Critérios de Aceitação:**
- [ ] Detecta duplicatas por documento
- [ ] Oferece opções: pular, sobrescrever, criar novo
- [ ] Relatório mostra duplicatas encontradas
- [ ] Performance adequada (< 5s para 100 linhas)

---

### **EPIC 7: Ações em Massa**
**Objetivo:** Permitir operações em múltiplos clientes

#### **Task 7.1: Barra de Ações em Massa**
**Descrição:** Mostrar ações quando linhas selecionadas
**Arquivos:** `contabil-pro/src/app/(tenant)/clientes/clients-data-table.tsx`

```typescript
// Adicionar ao ClientsDataTable
{table.getFilteredSelectedRowModel().rows.length > 0 && (
  <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4">
    <span className="text-sm font-medium">
      {table.getFilteredSelectedRowModel().rows.length} selecionado(s)
    </span>
    
    <Button size="sm" variant="outline">
      Solicitar Documentos
    </Button>
    
    <Button size="sm" variant="outline">
      Marcar como Inativo
    </Button>
    
    <Button size="sm" variant="outline">
      Gerar Proposta
    </Button>
    
    <Button size="sm" variant="ghost" onClick={() => table.resetRowSelection()}>
      Cancelar
    </Button>
  </div>
)}
```

**Critérios de Aceitação:**
- [ ] Aparece quando há seleção
- [ ] Mostra contagem de selecionados
- [ ] Ações funcionam em lote
- [ ] Confirmação antes de ações destrutivas

---

### **EPIC 8: Filtros Salvos**
**Objetivo:** Salvar combinações de filtros favoritas

#### **Task 8.1: Componente SavedFilters**
**Descrição:** Chips de filtros pré-definidos
**Arquivos:** `contabil-pro/src/components/saved-filters.tsx`

```typescript
'use client'

import { Button } from '@/components/ui/button'

const SAVED_FILTERS = [
  { id: 'all', label: 'Todos', filters: {} },
  { id: 'mei', label: 'MEI', filters: { regime_tributario: 'MEI' } },
  { id: 'simples', label: 'Simples', filters: { regime_tributario: 'Simples' } },
  { id: 'inadimplentes', label: 'Inadimplentes', filters: { status: 'inadimplente' } },
  { id: 'onboarding', label: 'Onboarding', filters: { status: 'onboarding' } },
]

export function SavedFilters({ onFilterChange }: { onFilterChange: (filters: any) => void }) {
  const [active, setActive] = useState('all')

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {SAVED_FILTERS.map((filter) => (
        <Button
          key={filter.id}
          variant={active === filter.id ? 'default' : 'outline'}
          size="sm"
          onClick={() => {
            setActive(filter.id)
            onFilterChange(filter.filters)
          }}
        >
          {filter.label}
        </Button>
      ))}
    </div>
  )
}
```

**Critérios de Aceitação:**
- [ ] Filtros aplicam corretamente
- [ ] Visual indica filtro ativo
- [ ] Scroll horizontal em mobile
- [ ] Persiste seleção (localStorage)

---

## 📊 **Resumo de Esforço**

| Epic | Tasks | Estimativa | Prioridade |
|------|-------|------------|------------|
| 1. Migração Schema | 3 | 3 dias | 🔴 Crítica |
| 2. Command Palette | 2 | 2 dias | 🔴 Crítica |
| 3. Modal Multi-Step | 4 | 5 dias | 🔴 Crítica |
| 4. Tabela Avançada | 3 | 4 dias | 🔴 Crítica |
| 5. KPIs e Empty State | 3 | 2 dias | 🟡 Alta |
| 6. Importação Avançada | 2 | 3 dias | 🟡 Alta |
| 7. Ações em Massa | 1 | 2 dias | 🟢 Média |
| 8. Filtros Salvos | 1 | 1 dia | 🟢 Média |

**Total Sprint 1:** ~16 dias (2 semanas com 2 devs)  
**Total Sprint 2:** ~6 dias (1 semana)

---

## ✅ **Checklist de Qualidade**

Cada task deve passar por:

- [ ] **Code Review:** Outro dev revisa o código
- [ ] **Testes:** Unit tests para validações e Server Actions
- [ ] **Acessibilidade:** ARIA labels, tab order, contraste
- [ ] **Performance:** Lighthouse score > 90
- [ ] **Mobile:** Testado em viewport 375px
- [ ] **RLS:** Políticas testadas (não vaza dados entre tenants)
- [ ] **Documentação:** README atualizado com novos componentes


