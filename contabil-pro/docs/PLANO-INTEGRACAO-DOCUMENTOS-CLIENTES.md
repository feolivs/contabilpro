# 📋 Plano de Implementação: Integração Documentos ↔ Clientes

**Data:** 02/10/2025  
**Status:** 📝 Planejamento  
**Objetivo:** Conectar documentos aos clientes na página de detalhes do cliente

---

## 🔍 1. Análise da Estrutura Atual

### 1.1 Arquivos e Componentes Existentes

#### **Página de Clientes**
```
contabil-pro/src/app/(app)/clientes/
├── page.tsx                          # Listagem de clientes
├── [id]/page.tsx                     # Detalhes do cliente ✅ ALVO PRINCIPAL
├── [id]/editar/page.tsx              # Edição do cliente
├── clients-page-content.tsx          # Conteúdo da listagem
└── client-form.tsx                   # Formulário de cliente
```

#### **Componentes de Clientes**
```
contabil-pro/src/components/clients/
├── details-card.tsx                  # Card reutilizável ✅ USAR
├── edit-form.tsx                     # Formulário de edição
├── modal.tsx                         # Modal de cadastro
├── stats.tsx                         # Estatísticas
└── table/                            # Tabela de clientes
```

#### **Componentes de Documentos**
```
contabil-pro/src/components/documents/
├── documents-table.tsx               # Tabela de documentos ✅ REUTILIZAR
├── document-details-dialog.tsx       # Dialog de detalhes ✅ REUTILIZAR
├── documents-filters.tsx             # Filtros de documentos
├── link-client-dialog.tsx            # Dialog para vincular cliente ✅ JÁ EXISTE
├── upload-dialog.tsx                 # Dialog de upload ✅ REUTILIZAR
└── pdf-preview-dialog.tsx            # Preview de PDF
```

#### **Actions e Hooks**
```
contabil-pro/src/actions/
├── clients.ts                        # Actions de clientes
├── clients-improved.ts               # Actions melhoradas
└── documents.ts                      # Actions de documentos ✅ USAR

contabil-pro/src/hooks/
└── use-documents.ts                  # React Query hooks ✅ USAR
```

---

## 🗄️ 2. Relacionamento Banco de Dados

### 2.1 Schema Atual

**Tabela `documents`:**
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  path TEXT NOT NULL,
  size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  type VARCHAR(50),                    -- nfe, nfse, receipt, invoice, contract, other
  entry_id UUID REFERENCES entries(id),
  client_id UUID REFERENCES clients(id), -- ✅ RELACIONAMENTO JÁ EXISTE
  metadata JSONB DEFAULT '{}',
  ocr_text TEXT,
  ocr_confidence DECIMAL(3,2),
  processed BOOLEAN DEFAULT false,
  uploaded_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices relevantes
CREATE INDEX idx_documents_client_id ON documents(client_id); -- ✅ JÁ EXISTE
```

**Tabela `clients`:**
```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  name VARCHAR(255) NOT NULL,
  document VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  -- ... outros campos
);
```

### 2.2 Queries Necessárias

**✅ Query já implementada em `getDocuments()`:**
```typescript
// Filtrar documentos por client_id
const documents = await getDocuments({ client_id: clientId });
```

**✅ Relacionamento já carregado:**
```typescript
// DocumentWithRelations já inclui:
interface DocumentWithRelations extends Document {
  client?: { id: string; name: string; } | null;
  entry?: { id: string; description: string; } | null;
  uploader?: { id: string; name: string; } | null;
}
```

---

## 🏗️ 3. Proposta de Arquitetura

### 3.1 Estrutura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│ /clientes/[id]/page.tsx (Server Component)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Header (nome, badges, botões)                      │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Grid de Cards (2 colunas)                          │    │
│  │  • Dados Básicos                                   │    │
│  │  • Dados Fiscais                                   │    │
│  │  • Dados de Contato                                │    │
│  │  • Endereço                                        │    │
│  │  • Dados Financeiros                               │    │
│  │  • Gestão                                          │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 🆕 ClientDocumentsSection (Client Component)       │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ Card Header                                  │ │    │
│  │  │  • Título: "Documentos do Cliente"          │ │    │
│  │  │  • Badge: contador de documentos            │ │    │
│  │  │  • Botão: "Upload Documento"                │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ Tabs                                         │ │    │
│  │  │  • Todos (badge com total)                  │ │    │
│  │  │  • NFe (badge com count)                    │ │    │
│  │  │  • NFSe (badge com count)                   │ │    │
│  │  │  • Contratos (badge com count)              │ │    │
│  │  │  • Outros (badge com count)                 │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  ┌──────────────────────────────────────────────┐ │    │
│  │  │ DocumentsTable (reutilizado)                │ │    │
│  │  │  • Colunas: nome, tipo, tamanho, data      │ │    │
│  │  │  • Ações: ver, baixar, desvincular         │ │    │
│  │  │  • Paginação simplificada                  │ │    │
│  │  └──────────────────────────────────────────────┘ │    │
│  │                                                     │    │
│  │  🔗 Dialogs (reutilizados):                        │    │
│  │    • UploadDialog (com client_id pré-preenchido)  │    │
│  │    • DocumentDetailsDialog                         │    │
│  │    • PDFPreviewDialog                              │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ Observações (se existir)                           │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Fluxo de Dados

```
┌──────────────────┐
│ Server Component │ /clientes/[id]/page.tsx
│  getClientById() │
└────────┬─────────┘
         │
         ├─> Passa clientId para ClientDocumentsSection
         │
         v
┌──────────────────────────────────────────────────┐
│ Client Component: ClientDocumentsSection         │
│                                                   │
│  useDocuments({ client_id: clientId })           │
│    ↓                                              │
│  React Query                                     │
│    ↓                                              │
│  getDocuments(filters) [Server Action]           │
│    ↓                                              │
│  Supabase Query com RLS                          │
│    ↓                                              │
│  Retorna DocumentWithRelations[]                 │
└──────────────────────────────────────────────────┘
```

---

## 📦 4. Componentes a Criar/Modificar

### 4.1 CRIAR: `ClientDocumentsSection`

**Arquivo:** `contabil-pro/src/components/clients/client-documents-section.tsx`

**Responsabilidades:**
- Buscar documentos do cliente via `useDocuments({ client_id })`
- Exibir tabs por tipo de documento
- Renderizar `DocumentsTable` com documentos filtrados
- Gerenciar estados de upload, visualização e exclusão
- Integrar dialogs existentes

**Props:**
```typescript
interface ClientDocumentsSectionProps {
  clientId: string;
  clientName: string;
}
```

**Features:**
- ✅ Tabs com badges de contagem por tipo
- ✅ Botão de upload com `client_id` pré-preenchido
- ✅ Tabela simplificada (sem coluna de cliente)
- ✅ Ações: ver detalhes, baixar, desvincular
- ✅ Empty state customizado
- ✅ Loading states
- ✅ Paginação (10 itens por página)

### 4.2 MODIFICAR: `/clientes/[id]/page.tsx`

**Mudanças:**
```typescript
// Adicionar após o grid de cards existente:
<ClientDocumentsSection 
  clientId={client.id} 
  clientName={client.name} 
/>
```

**Localização:** Após linha 199 (depois do card de Observações)

### 4.3 REUTILIZAR (sem modificação):

- ✅ `DocumentsTable` - Já aceita filtros
- ✅ `DocumentDetailsDialog` - Já funciona standalone
- ✅ `UploadDialog` - Já aceita `client_id` opcional
- ✅ `PDFPreviewDialog` - Já funciona
- ✅ `useDocuments` hook - Já aceita filtros
- ✅ `getDocuments` action - Já filtra por `client_id`

---

## 🔄 5. Fluxo de Implementação (Ordem Sugerida)

### **Fase 1: Componente Base** (30 min)
1. ✅ Criar `client-documents-section.tsx`
2. ✅ Implementar estrutura básica (Card + Header)
3. ✅ Integrar `useDocuments` hook com filtro `client_id`
4. ✅ Adicionar loading e empty states

### **Fase 2: Tabs e Filtros** (20 min)
5. ✅ Implementar tabs por tipo de documento
6. ✅ Calcular contadores por tipo
7. ✅ Filtrar documentos por tab ativa

### **Fase 3: Tabela e Ações** (30 min)
8. ✅ Integrar `DocumentsTable` (versão simplificada)
9. ✅ Remover coluna "Cliente" (redundante)
10. ✅ Adicionar ação "Desvincular" (remove `client_id`)
11. ✅ Integrar dialogs existentes

### **Fase 4: Upload** (15 min)
12. ✅ Integrar `UploadDialog`
13. ✅ Pré-preencher `client_id` no upload
14. ✅ Invalidar cache após upload

### **Fase 5: Integração** (15 min)
15. ✅ Adicionar componente na página de detalhes
16. ✅ Testar fluxo completo
17. ✅ Ajustar espaçamentos e responsividade

**Tempo Total Estimado:** ~2 horas

---

## 🎨 6. Considerações de UX

### 6.1 Posicionamento
- **Localização:** Após todos os cards de informações do cliente
- **Largura:** Full width (não em grid 2 colunas)
- **Espaçamento:** `space-y-6` consistente com o resto da página

### 6.2 Tabs de Tipo
```
┌─────────────────────────────────────────────────────────┐
│ [Todos 12] [NFe 5] [NFSe 3] [Contratos 2] [Outros 2]  │
└─────────────────────────────────────────────────────────┘
```

**Comportamento:**
- Badge com contador ao lado do nome
- Tab "Todos" sempre visível
- Tabs de tipos específicos só aparecem se houver documentos
- Filtro client-side (dados já carregados)

### 6.3 Ações Disponíveis

**Menu de Ações (⋮):**
1. 👁️ **Ver Detalhes** → Abre `DocumentDetailsDialog`
2. 📥 **Baixar** → Download direto
3. 🔗 **Desvincular** → Remove `client_id` (com confirmação)
4. 🗑️ **Excluir** → Deleta documento (com confirmação)

**Botão Principal:**
- 📤 **Upload Documento** → Abre `UploadDialog` com `client_id` pré-preenchido

### 6.4 Empty States

**Sem documentos:**
```
┌─────────────────────────────────────────────────┐
│              📄                                  │
│                                                  │
│     Nenhum documento vinculado                  │
│                                                  │
│  Faça upload de documentos para este cliente    │
│                                                  │
│         [📤 Upload Documento]                   │
└─────────────────────────────────────────────────┘
```

**Tab vazia:**
```
Nenhum documento do tipo [Tipo] encontrado
```

### 6.5 Feedback Visual

**Loading:**
- Skeleton na tabela durante carregamento inicial
- Spinner no botão durante ações

**Sucesso:**
- Toast: "Documento vinculado com sucesso"
- Toast: "Documento desvinculado"
- Toast: "Upload concluído"

**Erro:**
- Toast com mensagem de erro específica
- Retry button quando aplicável

---

## ⚠️ 7. Considerações Técnicas

### 7.1 Performance
- ✅ Usar React Query para cache automático
- ✅ Paginação de 10 itens (menos que a página principal)
- ✅ Filtros client-side (dados já carregados)
- ✅ Lazy loading de dialogs

### 7.2 Segurança
- ✅ RLS já implementado (filtra por tenant automaticamente)
- ✅ Validação de `client_id` no backend
- ✅ Apenas documentos do tenant atual são visíveis

### 7.3 Responsividade
- ✅ Tabs com scroll horizontal em mobile
- ✅ Tabela responsiva (stack em mobile)
- ✅ Botões adaptam tamanho

### 7.4 Acessibilidade
- ✅ Labels adequados em todos os controles
- ✅ Navegação por teclado
- ✅ ARIA labels nos botões de ação
- ✅ Focus management nos dialogs

---

## 📊 8. Métricas de Sucesso

**Funcionalidade:**
- [ ] Usuário consegue ver todos os documentos do cliente
- [ ] Usuário consegue filtrar por tipo de documento
- [ ] Usuário consegue fazer upload vinculado ao cliente
- [ ] Usuário consegue desvincular documento
- [ ] Usuário consegue visualizar/baixar documentos

**Performance:**
- [ ] Carregamento inicial < 1s
- [ ] Troca de tabs instantânea (client-side)
- [ ] Upload com feedback em tempo real

**UX:**
- [ ] Interface intuitiva e consistente
- [ ] Feedback claro em todas as ações
- [ ] Responsivo em todos os breakpoints

---

## 🚀 9. Próximos Passos (Pós-Implementação)

### Melhorias Futuras:
1. **Timeline de Atividades:** Histórico de uploads/modificações
2. **Bulk Actions:** Vincular/desvincular múltiplos documentos
3. **Drag & Drop:** Upload direto na seção
4. **Preview Inline:** Thumbnails de documentos
5. **Busca:** Filtro por nome de documento
6. **Ordenação:** Por data, nome, tamanho
7. **Exportação:** Download em lote (ZIP)

---

## ✅ Checklist de Implementação

- [ ] Criar `ClientDocumentsSection` component
- [ ] Implementar tabs com contadores
- [ ] Integrar `DocumentsTable` simplificada
- [ ] Adicionar ação "Desvincular"
- [ ] Integrar `UploadDialog` com `client_id`
- [ ] Adicionar na página de detalhes
- [ ] Testar todos os fluxos
- [ ] Validar responsividade
- [ ] Documentar código
- [ ] Criar testes (opcional)

---

**Pronto para implementação! 🎯**

