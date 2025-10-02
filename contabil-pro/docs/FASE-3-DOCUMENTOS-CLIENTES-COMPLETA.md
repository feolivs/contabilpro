# ✅ Fase 3 Completa: Tabela e Ações - Documentos do Cliente

**Data:** 02/10/2025  
**Status:** ✅ Concluída  
**Tempo:** ~30 minutos

---

## 🎯 Objetivos da Fase 3

- [x] Adicionar props opcionais na `DocumentsTable`
- [x] Implementar coluna de cliente condicional
- [x] Implementar ação "Desvincular Cliente"
- [x] Adicionar dialog de confirmação de desvinculação
- [x] Integrar `DocumentsTable` no `ClientDocumentsSection`
- [x] Remover placeholders
- [x] Testar fluxo completo

---

## 📦 Modificações Realizadas

### 1. **MODIFICADO:** `documents-table.tsx`

**Arquivo:** `contabil-pro/src/components/documents/documents-table.tsx`

#### **Props Adicionadas:**

```typescript
interface DocumentsTableProps {
  documents: DocumentWithRelations[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  hideClientColumn?: boolean;    // ← NOVA
  showUnlinkAction?: boolean;    // ← NOVA
}
```

**Valores padrão:**
```typescript
hideClientColumn = false,  // Por padrão, mostra coluna de cliente
showUnlinkAction = false,  // Por padrão, não mostra ação de desvincular
```

#### **Estados Adicionados:**

```typescript
const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
const [documentToUnlink, setDocumentToUnlink] = useState<{
  id: string;
  name: string;
  clientName: string;
} | null>(null);
```

#### **Handlers Adicionados:**

```typescript
const handleUnlinkClick = (id: string, name: string, clientName: string) => {
  setDocumentToUnlink({ id, name, clientName });
  setUnlinkDialogOpen(true);
};

const handleUnlinkConfirm = () => {
  if (!documentToUnlink) return;

  // Reutiliza LinkClientDialog com client_id null
  setDocumentToLink({
    id: documentToUnlink.id,
    name: documentToUnlink.name,
    currentClientId: null,
  });
  setUnlinkDialogOpen(false);
  setDocumentToUnlink(null);
  setLinkClientDialogOpen(true);
};
```

#### **Coluna de Cliente Condicional:**

```typescript
const columns: ColumnDef<DocumentWithRelations>[] = [
  // ... outras colunas
  
  // Coluna de cliente (condicional)
  ...(!hideClientColumn ? [{
    accessorKey: 'client',
    header: ({ column }: any) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Cliente
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }: any) => {
      const client = row.original.client;
      if (!client) {
        return (
          <span className="text-muted-foreground italic text-sm">
            Sem cliente
          </span>
        );
      }
      return (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{client.name}</span>
        </div>
      );
    },
  }] : []),
  
  // ... outras colunas
];
```

**Comportamento:**
- Se `hideClientColumn = true` → Coluna não aparece
- Se `hideClientColumn = false` → Coluna aparece normalmente

#### **Ação de Desvincular Condicional:**

```typescript
{!showUnlinkAction && (
  <DropdownMenuItem
    onClick={() => {
      setDocumentToLink({
        id: doc.id,
        name: doc.name,
        currentClientId: doc.client_id,
      });
      setLinkClientDialogOpen(true);
    }}
  >
    <Link className="mr-2 h-4 w-4" />
    {doc.client_id ? 'Alterar Cliente' : 'Vincular Cliente'}
  </DropdownMenuItem>
)}

{showUnlinkAction && doc.client_id && doc.client && (
  <DropdownMenuItem
    onClick={() => handleUnlinkClick(doc.id, doc.name, doc.client.name)}
  >
    <Link className="mr-2 h-4 w-4" />
    Desvincular Cliente
  </DropdownMenuItem>
)}
```

**Comportamento:**
- Se `showUnlinkAction = false` → Mostra "Vincular/Alterar Cliente"
- Se `showUnlinkAction = true` → Mostra "Desvincular Cliente" (se vinculado)

#### **Dialog de Confirmação de Desvinculação:**

```typescript
<AlertDialog open={unlinkDialogOpen} onOpenChange={setUnlinkDialogOpen}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Confirmar desvinculação</AlertDialogTitle>
      <AlertDialogDescription>
        Tem certeza que deseja desvincular o documento{' '}
        <strong>{documentToUnlink?.name}</strong> do cliente{' '}
        <strong>{documentToUnlink?.clientName}</strong>?
        <br />
        O documento não será deletado, apenas desvinculado.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancelar</AlertDialogCancel>
      <AlertDialogAction onClick={handleUnlinkConfirm}>
        Desvincular
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### 2. **MODIFICADO:** `client-documents-section.tsx`

**Arquivo:** `contabil-pro/src/components/clients/client-documents-section.tsx`

#### **Import Adicionado:**

```typescript
import { DocumentsTable } from '@/components/documents/documents-table';
```

#### **Integração da Tabela:**

```typescript
<TabsContent value={activeTab} className="mt-4">
  {filteredDocuments.length === 0 ? (
    <div className="text-center py-8">
      <p className="text-sm text-muted-foreground">
        Nenhum documento do tipo <strong>{getTypeLabel(activeTab)}</strong> encontrado
      </p>
    </div>
  ) : (
    <DocumentsTable
      documents={filteredDocuments}
      totalCount={filteredDocuments.length}
      currentPage={1}
      pageSize={filteredDocuments.length}
      onPageChange={() => {}}
      onPageSizeChange={() => {}}
      hideClientColumn={true}        // ← Oculta coluna de cliente
      showUnlinkAction={true}        // ← Mostra ação de desvincular
    />
  )}
</TabsContent>
```

**Configuração:**
- `hideClientColumn={true}` - Coluna de cliente oculta (redundante no contexto)
- `showUnlinkAction={true}` - Ação de desvincular habilitada
- `totalCount` e `pageSize` = tamanho dos documentos filtrados (sem paginação)
- `onPageChange` e `onPageSizeChange` = funções vazias (sem paginação)

---

## 🎨 Interface Visual

### **Tabela Completa (sem coluna de cliente)**

```
┌──────────────────────────────────────────────────────────────┐
│ 📄 Documentos do Cliente [12]                    [Upload]   │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│ [Todos 12] [NFe 5] [NFSe 3] [Contratos 2]                   │
│ ─────────                                                     │
│                                                               │
│ ┌────────────────────────────────────────────────────────┐   │
│ │ Nome                    │ Tipo      │ Data       │ ⋮  │   │
│ ├────────────────────────────────────────────────────────┤   │
│ │ 📄 contrato.pdf         │ Contrato  │ 01/10/2025 │ ⋮  │   │
│ │    2.5 MB               │           │ 14:30      │    │   │
│ │                         │           │            │    │   │
│ │ 📄 nota-fiscal.xml      │ NFe       │ 30/09/2025 │ ⋮  │   │
│ │    156 KB               │           │ 10:15      │    │   │
│ │                         │           │            │    │   │
│ │ 📄 recibo.pdf           │ Recibo    │ 28/09/2025 │ ⋮  │   │
│ │    890 KB               │           │ 16:45      │    │   │
│ └────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### **Menu de Ações (⋮)**

```
┌─────────────────────────┐
│ Ações                   │
├─────────────────────────┤
│ 👁️  Visualizar Detalhes │
│ 📥 Baixar               │
│ 🔗 Desvincular Cliente  │  ← NOVA AÇÃO
├─────────────────────────┤
│ 🗑️  Deletar             │
└─────────────────────────┘
```

### **Dialog de Confirmação de Desvinculação**

```
┌────────────────────────────────────────────┐
│ Confirmar desvinculação                    │
├────────────────────────────────────────────┤
│                                            │
│ Tem certeza que deseja desvincular o      │
│ documento contrato.pdf do cliente          │
│ João Silva?                                │
│                                            │
│ O documento não será deletado, apenas     │
│ desvinculado.                              │
│                                            │
│              [Cancelar] [Desvincular]      │
└────────────────────────────────────────────┘
```

---

## 🔄 Fluxo de Desvinculação

### **Passo a Passo:**

1. **Usuário clica em "⋮" no documento**
   - Menu de ações abre

2. **Usuário clica em "Desvincular Cliente"**
   - Dialog de confirmação abre
   - Mostra nome do documento e nome do cliente

3. **Usuário confirma desvinculação**
   - Dialog fecha
   - `LinkClientDialog` abre com `currentClientId = null`
   - Usuário pode confirmar ou cancelar

4. **Após confirmação no LinkClientDialog:**
   - Documento é desvinculado (client_id = null)
   - Cache do React Query é invalidado
   - Documento desaparece da lista do cliente
   - Toast de sucesso aparece

### **Reutilização Inteligente:**

A ação de desvincular **reutiliza** o `LinkClientDialog` existente:
- Passa `currentClientId = null`
- Dialog interpreta como "remover vínculo"
- Não precisa criar nova mutation
- Mantém consistência de UX

---

## ✨ Funcionalidades Implementadas

### 1. **Coluna de Cliente Condicional**

✅ **Contexto: Página de Documentos**
```typescript
<DocumentsTable
  hideClientColumn={false}  // Mostra coluna
  showUnlinkAction={false}  // Ação padrão
/>
```

✅ **Contexto: Página de Cliente**
```typescript
<DocumentsTable
  hideClientColumn={true}   // Oculta coluna (redundante)
  showUnlinkAction={true}   // Ação de desvincular
/>
```

### 2. **Ação de Desvincular**

✅ **Só aparece quando:**
- `showUnlinkAction = true`
- Documento tem `client_id` (está vinculado)
- Documento tem dados do `client` (relação carregada)

✅ **Comportamento:**
- Abre dialog de confirmação
- Mostra nome do documento e cliente
- Reutiliza `LinkClientDialog` para executar

### 3. **Dialog de Confirmação**

✅ **Mensagem clara:**
- Nome do documento
- Nome do cliente
- Aviso: "não será deletado, apenas desvinculado"

✅ **Botões:**
- "Cancelar" - Fecha dialog sem ação
- "Desvincular" - Confirma e abre LinkClientDialog

### 4. **Integração Completa**

✅ **Tabela real substituiu placeholder**
✅ **Todas as ações funcionando:**
- Visualizar detalhes
- Baixar
- Desvincular (novo)
- Deletar

✅ **Dialogs integrados:**
- DocumentDetailsDialog
- PDFPreviewDialog (via detalhes)
- LinkClientDialog (para desvincular)
- AlertDialog (confirmação de delete/unlink)

---

## 🧪 Testes Realizados

### ✅ **Cenários Testados**

1. **Tabela renderiza corretamente**
   - Documentos aparecem
   - Colunas corretas (sem coluna de cliente)
   - Ordenação funciona

2. **Ação de desvincular aparece**
   - Só para documentos vinculados
   - Menu de ações correto

3. **Dialog de confirmação funciona**
   - Abre ao clicar em "Desvincular"
   - Mostra informações corretas
   - Botões funcionam

4. **Desvinculação funciona**
   - LinkClientDialog abre
   - Documento é desvinculado
   - Desaparece da lista
   - Toast de sucesso

5. **Outras ações funcionam**
   - Visualizar detalhes
   - Baixar documento
   - Deletar documento

6. **Filtros por tab funcionam**
   - Tabela atualiza ao trocar tab
   - Documentos corretos aparecem

---

## 📊 Comparação: Antes vs Depois

### **Antes (Fase 2):**
```
┌─────────────────────────────────────┐
│ Placeholder da tabela               │
│                                     │
│ • Preview de 3 documentos           │
│ • Sem ações                         │
│ • Sem interatividade                │
└─────────────────────────────────────┘
```

### **Depois (Fase 3):**
```
┌─────────────────────────────────────┐
│ Tabela completa e funcional         │
│                                     │
│ • Todos os documentos               │
│ • Ordenação por coluna              │
│ • Menu de ações completo            │
│ • Visualizar, baixar, desvincular   │
│ • Deletar com confirmação           │
│ • Dialogs integrados                │
└─────────────────────────────────────┘
```

---

## ✅ Checklist de Conclusão

- [x] Props adicionadas na DocumentsTable
- [x] Coluna de cliente condicional
- [x] Ação de desvincular implementada
- [x] Dialog de confirmação criado
- [x] Handler de desvinculação funcionando
- [x] Tabela integrada no ClientDocumentsSection
- [x] Placeholder removido
- [x] Todas as ações testadas
- [x] TypeScript sem erros
- [x] Documentação criada

---

## 🚀 Próximos Passos (Fase 4)

### **Upload Dialog** (~15 min)

1. **Integrar UploadDialog:**
   - Remover placeholder
   - Passar `defaultValues={{ client_id: clientId }}`
   - Configurar `onUploadComplete`

2. **Invalidar cache após upload:**
   - React Query invalida automaticamente
   - Documentos aparecem na lista

3. **Testar fluxo completo:**
   - Upload com vínculo
   - Documento aparece na lista
   - Toast de sucesso

---

## ✨ Resultado

**Fase 3 concluída com sucesso!** ✅

Usuários agora podem:
- ✅ Ver tabela completa de documentos
- ✅ Ordenar por qualquer coluna
- ✅ Visualizar detalhes de documentos
- ✅ Baixar documentos
- ✅ **Desvincular documentos do cliente**
- ✅ Deletar documentos
- ✅ Ver preview de PDFs

**Interface totalmente funcional e profissional!** 🎉

**Pronto para Fase 4: Upload Dialog** 🚀

