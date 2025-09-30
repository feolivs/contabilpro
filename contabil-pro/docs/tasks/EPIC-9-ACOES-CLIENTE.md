# EPIC 9: Ações de Cliente Individual

## 📋 Objetivo

Implementar funcionalidades de **Ver Detalhes** e **Editar** para cada cliente através do menu de ações na tabela.

---

## 🎯 Escopo

### Funcionalidades:
1. ✅ **Ver Detalhes** - Página dedicada com todas as informações do cliente
2. ✅ **Editar Cliente** - Formulário multi-step para edição
3. ✅ **Menu de Ações** - Dropdown com opções na tabela

---

## 📝 Tasks Detalhadas

### **Task 9.1: Criar Página de Detalhes do Cliente**

**Arquivo:** `src/app/(tenant)/clientes/[id]/page.tsx`

**Estrutura:**
```typescript
export default async function ClientDetailsPage({ params }: { params: { id: string } }) {
  const result = await getClientById(params.id)
  
  if (!result.success || !result.data) {
    return <EmptyState type="custom" title="Cliente não encontrado" />
  }

  return (
    <div className="space-y-6">
      {/* Header com nome e ações */}
      <ClientDetailsHeader client={result.data} />
      
      {/* Cards de informações */}
      <div className="grid gap-6 md:grid-cols-2">
        <ClientDetailsCard title="Dados Fiscais" data={...} />
        <ClientDetailsCard title="Contato" data={...} />
        <ClientDetailsCard title="Financeiro" data={...} />
        <ClientDetailsCard title="Atividade" data={...} />
      </div>
      
      {/* Histórico de atividades (futuro) */}
      <ClientActivityTimeline clientId={params.id} />
    </div>
  )
}
```

**Componentes necessários:**
- `ClientDetailsHeader` - Cabeçalho com nome, status e botões de ação
- `ClientDetailsCard` - Card reutilizável para exibir informações
- `ClientActivityTimeline` - Timeline de atividades (placeholder)

---

### **Task 9.2: Criar Página de Edição do Cliente**

**Arquivo:** `src/app/(tenant)/clientes/[id]/editar/page.tsx`

**Estrutura:**
```typescript
export default async function EditClientPage({ params }: { params: { id: string } }) {
  const result = await getClientById(params.id)
  
  if (!result.success || !result.data) {
    return <EmptyState type="custom" title="Cliente não encontrado" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1>Editar Cliente</h1>
        <p className="text-muted-foreground">{result.data.name}</p>
      </div>
      
      {/* Formulário de edição */}
      <ClientEditForm initialData={result.data} />
    </div>
  )
}
```

**Componente necessário:**
- `ClientEditForm` - Formulário multi-step adaptado do `ClientModal`

---

### **Task 9.3: Adicionar Ações no Menu Dropdown**

**Arquivo:** `src/components/clients-table/columns.tsx`

**Modificação no DropdownMenu:**
```typescript
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" className="h-8 w-8 p-0">
      <MoreHorizontal className="h-4 w-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuLabel>Ações</DropdownMenuLabel>
    <DropdownMenuSeparator />
    
    {/* NOVO: Ver Detalhes */}
    <DropdownMenuItem onClick={() => router.push(`/clientes/${client.id}`)}>
      <Eye className="mr-2 h-4 w-4" />
      Ver Detalhes
    </DropdownMenuItem>
    
    {/* NOVO: Editar */}
    <DropdownMenuItem onClick={() => router.push(`/clientes/${client.id}/editar`)}>
      <Pencil className="mr-2 h-4 w-4" />
      Editar
    </DropdownMenuItem>
    
    <DropdownMenuSeparator />
    
    {/* Existente: Copiar ID */}
    <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.id)}>
      <Copy className="mr-2 h-4 w-4" />
      Copiar ID
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Ícones necessários:**
- `Eye` (lucide-react) - Ver detalhes
- `Pencil` (lucide-react) - Editar

---

### **Task 9.4: Implementar Server Action getClientById**

**Arquivo:** `src/actions/clients.ts`

**Verificar implementação existente:**
```typescript
export async function getClientById(id: string) {
  try {
    const session = await requireAuth()
    const { createServerClient } = await import('@/lib/supabase')
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', session.tenant_id) // Segurança multi-tenant
      .single()

    if (error) {
      throw new Error(`Erro ao buscar cliente: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
```

**Testes:**
- ✅ Buscar cliente existente
- ✅ Buscar cliente de outro tenant (deve falhar)
- ✅ Buscar cliente inexistente (deve retornar erro)

---

### **Task 9.5: Criar Componente ClientDetailsCard**

**Arquivo:** `src/components/client-details-card.tsx`

**Estrutura:**
```typescript
interface ClientDetailsCardProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  data: Array<{
    label: string
    value: string | number | null
    format?: 'currency' | 'date' | 'document' | 'phone'
  }>
}

export function ClientDetailsCard({ title, icon: Icon, data }: ClientDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5" />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          {data.map((item) => (
            <div key={item.label} className="flex justify-between">
              <dt className="text-sm text-muted-foreground">{item.label}</dt>
              <dd className="text-sm font-medium">
                {formatValue(item.value, item.format)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
```

**Formatadores:**
- `currency` - R$ 1.234,56
- `date` - 29/09/2025
- `document` - 123.456.789-09 ou 12.345.678/0001-90
- `phone` - (11) 98765-4321

---

### **Task 9.6: Adaptar ClientModal para Modo Edição**

**Arquivo:** `src/components/client-modal.tsx`

**Modificações:**
```typescript
interface ClientModalProps {
  mode?: 'create' | 'edit'
  initialData?: Client
  onSuccess?: () => void
}

export function ClientModal({ mode = 'create', initialData, onSuccess }: ClientModalProps) {
  // Preencher formulário com initialData se mode === 'edit'
  const form = useForm({
    defaultValues: initialData || defaultValues
  })
  
  // Alterar título e botão baseado no mode
  const title = mode === 'create' ? 'Novo Cliente' : 'Editar Cliente'
  const submitLabel = mode === 'create' ? 'Cadastrar' : 'Salvar Alterações'
  
  // Usar createClient ou updateClient baseado no mode
  const handleSubmit = async (data) => {
    if (mode === 'create') {
      await createClient(data)
    } else {
      await updateClient(initialData.id, data)
    }
    onSuccess?.()
  }
}
```

**Alterações necessárias:**
- ✅ Prop `mode` para diferenciar criação/edição
- ✅ Prop `initialData` para preencher formulário
- ✅ Lógica condicional para título e botões
- ✅ Chamar `updateClient` em vez de `createClient` no modo edição

---

## 🎨 Design e UX

### **Página de Detalhes:**
```
┌─────────────────────────────────────────────────────────┐
│ ← Voltar                                                │
│                                                         │
│ João Silva                                    [Editar]  │
│ ● Ativo                                                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────────────────┐  ┌──────────────────┐            │
│ │ 📋 Dados Fiscais │  │ 📞 Contato       │            │
│ │                  │  │                  │            │
│ │ CPF: 123...      │  │ Email: ...       │            │
│ │ Tipo: PF         │  │ Telefone: ...    │            │
│ │ Regime: MEI      │  │ Endereço: ...    │            │
│ └──────────────────┘  └──────────────────┘            │
│                                                         │
│ ┌──────────────────┐  ┌──────────────────┐            │
│ │ 💰 Financeiro    │  │ 📊 Atividade     │            │
│ │                  │  │                  │            │
│ │ Plano: R$ 150    │  │ Última: 29/09    │            │
│ │ Vencimento: 10   │  │ Score: 85        │            │
│ └──────────────────┘  └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

### **Menu de Ações na Tabela:**
```
┌─────────────────┐
│ Ações        ⋮  │
├─────────────────┤
│ 👁 Ver Detalhes │
│ ✏️ Editar       │
│ ─────────────── │
│ 📋 Copiar ID    │
└─────────────────┘
```

---

## 🔄 Fluxo de Navegação

```
/clientes (Tabela)
    │
    ├─→ [Ver Detalhes] → /clientes/[id]
    │                         │
    │                         └─→ [Editar] → /clientes/[id]/editar
    │                                             │
    │                                             └─→ [Salvar] → /clientes/[id]
    │
    └─→ [Editar] → /clientes/[id]/editar
                        │
                        └─→ [Salvar] → /clientes
```

---

## 📦 Componentes Shadcn Necessários

Todos já instalados:
- ✅ `Card`, `CardHeader`, `CardTitle`, `CardContent`
- ✅ `DropdownMenu`, `DropdownMenuItem`
- ✅ `Button`
- ✅ `Badge` (para status)

---

## 🧪 Testes

### **Cenários de Teste:**

1. **Ver Detalhes:**
   - ✅ Clicar em "Ver Detalhes" abre página correta
   - ✅ Todas as informações são exibidas
   - ✅ Botão "Editar" funciona
   - ✅ Botão "Voltar" retorna à tabela

2. **Editar Cliente:**
   - ✅ Formulário é preenchido com dados existentes
   - ✅ Validações funcionam (CPF/CNPJ, email)
   - ✅ Salvar atualiza dados no banco
   - ✅ Redirecionamento após salvar

3. **Segurança:**
   - ✅ Não é possível ver/editar cliente de outro tenant
   - ✅ Apenas usuários autenticados têm acesso

---

## 📊 Estimativa

| Task | Tempo Estimado | Complexidade |
|------|----------------|--------------|
| 9.1 - Página Detalhes | 30 min | Média |
| 9.2 - Página Edição | 20 min | Baixa |
| 9.3 - Menu Ações | 10 min | Baixa |
| 9.4 - Server Action | 10 min | Baixa |
| 9.5 - ClientDetailsCard | 25 min | Média |
| 9.6 - Adaptar Modal | 30 min | Média |
| **TOTAL** | **~2h** | **Média** |

---

## ✅ Critérios de Aceitação

- [ ] Menu de ações tem opções "Ver Detalhes" e "Editar"
- [ ] Página de detalhes exibe todas as informações do cliente
- [ ] Página de edição permite alterar dados do cliente
- [ ] Validações funcionam corretamente
- [ ] Navegação entre páginas é fluida
- [ ] Segurança multi-tenant é mantida
- [ ] Feedback visual (toasts) após ações

---

## 🚀 Ordem de Execução

1. **Task 9.4** - Verificar/corrigir `getClientById` (base para tudo)
2. **Task 9.3** - Adicionar menu de ações (UI básica)
3. **Task 9.5** - Criar `ClientDetailsCard` (componente reutilizável)
4. **Task 9.1** - Criar página de detalhes (usar componente)
5. **Task 9.6** - Adaptar modal para edição (lógica)
6. **Task 9.2** - Criar página de edição (integração final)

---

**Pronto para começar a implementação!** 🎯

