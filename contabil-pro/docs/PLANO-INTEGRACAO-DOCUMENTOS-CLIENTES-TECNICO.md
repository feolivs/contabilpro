# 🔧 Detalhes Técnicos: Integração Documentos ↔ Clientes

**Complemento ao:** `PLANO-INTEGRACAO-DOCUMENTOS-CLIENTES.md`

---

## 📝 1. Código de Referência

### 1.1 Hook `useDocuments` - JÁ IMPLEMENTADO

**Arquivo:** `contabil-pro/src/hooks/use-documents.ts`

```typescript
// ✅ Hook já aceita filtros, incluindo client_id
export function useDocuments(filters: Partial<DocumentFiltersInput> = {}) {
  return useQuery({
    queryKey: documentKeys.list(filters),
    queryFn: () => getDocuments(filters),
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
  });
}

// Exemplo de uso na nova seção:
const { data, isLoading } = useDocuments({ 
  client_id: clientId,
  page: 1,
  pageSize: 10 
});
```

### 1.2 Action `getDocuments` - JÁ IMPLEMENTADO

**Arquivo:** `contabil-pro/src/actions/documents.ts` (linhas 173-253)

```typescript
// ✅ Action já filtra por client_id
export async function getDocuments(
  filters?: Partial<DocumentFiltersInput>
): Promise<DocumentListResult> {
  // ...
  
  // Filtro por cliente (linha 201-203)
  if (validated.client_id) {
    query = query.eq('client_id', validated.client_id);
  }
  
  // Retorna DocumentWithRelations[] com client populated
  return {
    documents: (data || []) as DocumentWithRelations[],
    total: count || 0,
    page: validated.page,
    pageSize: validated.pageSize,
  };
}
```

### 1.3 Dialog de Upload - JÁ ACEITA client_id

**Arquivo:** `contabil-pro/src/components/documents/upload-dialog.tsx`

```typescript
// ✅ Schema já aceita client_id opcional
export const uploadDocumentSchema = z.object({
  type: documentTypeSchema.optional(),
  client_id: z.string().uuid().optional(), // ← JÁ EXISTE
  entry_id: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

// Uso no novo componente:
<UploadDialog
  open={uploadOpen}
  onOpenChange={setUploadOpen}
  defaultValues={{ client_id: clientId }} // ← Pré-preencher
  onUploadComplete={handleUploadComplete}
/>
```

### 1.4 Action de Update - PARA DESVINCULAR

**Arquivo:** `contabil-pro/src/actions/documents.ts`

```typescript
// ✅ Já existe updateDocument
export async function updateDocument(
  input: UpdateDocumentInput
): Promise<{ success: boolean; error?: string }> {
  // ...
  const { data, error } = await supabase
    .from('documents')
    .update({ client_id: input.client_id }) // ← null para desvincular
    .eq('id', input.id)
    .select()
    .single();
  // ...
}

// Uso para desvincular:
await updateDocument({ 
  id: documentId, 
  client_id: null // ← Remove vínculo
});
```

---

## 🎨 2. Estrutura do Componente Principal

### 2.1 Skeleton do `ClientDocumentsSection`

```typescript
'use client';

import { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDocuments } from '@/hooks/use-documents';
import { DocumentsTable } from '@/components/documents/documents-table';
import { UploadDialog } from '@/components/documents/upload-dialog';
import type { DocumentType } from '@/types/document.types';

interface ClientDocumentsSectionProps {
  clientId: string;
  clientName: string;
}

export function ClientDocumentsSection({ 
  clientId, 
  clientName 
}: ClientDocumentsSectionProps) {
  const [activeTab, setActiveTab] = useState<DocumentType | 'all'>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Buscar documentos do cliente
  const { data, isLoading, error } = useDocuments({
    client_id: clientId,
    page: currentPage,
    pageSize: 10,
  });

  // Calcular contadores por tipo
  const counts = useMemo(() => {
    if (!data?.documents) return {};
    
    return data.documents.reduce((acc, doc) => {
      const type = doc.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [data?.documents]);

  // Filtrar documentos por tab ativa
  const filteredDocuments = useMemo(() => {
    if (!data?.documents) return [];
    if (activeTab === 'all') return data.documents;
    return data.documents.filter(doc => doc.type === activeTab);
  }, [data?.documents, activeTab]);

  // Handlers
  const handleUploadComplete = () => {
    // React Query invalida automaticamente
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Documentos do Cliente</CardTitle>
            {data?.total && (
              <Badge variant="secondary">{data.total}</Badge>
            )}
          </div>
          <Button onClick={() => setUploadOpen(true)} size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Upload
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">
              Todos {data?.total && <Badge variant="secondary" className="ml-2">{data.total}</Badge>}
            </TabsTrigger>
            {counts.nfe && (
              <TabsTrigger value="nfe">
                NFe <Badge variant="secondary" className="ml-2">{counts.nfe}</Badge>
              </TabsTrigger>
            )}
            {counts.nfse && (
              <TabsTrigger value="nfse">
                NFSe <Badge variant="secondary" className="ml-2">{counts.nfse}</Badge>
              </TabsTrigger>
            )}
            {counts.contract && (
              <TabsTrigger value="contract">
                Contratos <Badge variant="secondary" className="ml-2">{counts.contract}</Badge>
              </TabsTrigger>
            )}
            {counts.other && (
              <TabsTrigger value="other">
                Outros <Badge variant="secondary" className="ml-2">{counts.other}</Badge>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">Carregando...</p>
              </div>
            ) : filteredDocuments.length === 0 ? (
              <EmptyState onUpload={() => setUploadOpen(true)} />
            ) : (
              <DocumentsTable
                documents={filteredDocuments}
                totalCount={filteredDocuments.length}
                currentPage={currentPage}
                pageSize={10}
                onPageChange={setCurrentPage}
                onPageSizeChange={() => {}} // Fixo em 10
                hideClientColumn // ← NOVA PROP
                showUnlinkAction // ← NOVA PROP
              />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        defaultValues={{ client_id: clientId }}
        onUploadComplete={handleUploadComplete}
      />
    </Card>
  );
}
```

### 2.2 Empty State Component

```typescript
function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <FileText className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold mb-2">
        Nenhum documento vinculado
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Faça upload de documentos para este cliente
      </p>
      <Button onClick={onUpload}>
        <Upload className="mr-2 h-4 w-4" />
        Upload Documento
      </Button>
    </div>
  );
}
```

---

## 🔄 3. Modificações Necessárias

### 3.1 DocumentsTable - ADICIONAR PROPS OPCIONAIS

**Arquivo:** `contabil-pro/src/components/documents/documents-table.tsx`

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

// No corpo do componente:
const columns: ColumnDef<DocumentWithRelations>[] = [
  // ... outras colunas
  
  // Coluna de cliente (condicional)
  ...(!hideClientColumn ? [{
    id: 'client',
    header: 'Cliente',
    cell: ({ row }) => row.original.client?.name || '—',
  }] : []),
  
  // ... outras colunas
];

// No menu de ações:
{showUnlinkAction && (
  <DropdownMenuItem
    onClick={() => handleUnlink(row.original)}
  >
    <Link className="mr-2 h-4 w-4" />
    Desvincular Cliente
  </DropdownMenuItem>
)}
```

### 3.2 UploadDialog - ADICIONAR defaultValues

**Arquivo:** `contabil-pro/src/components/documents/upload-dialog.tsx`

```typescript
interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadComplete?: () => void;
  defaultValues?: {           // ← NOVA
    client_id?: string;
    entry_id?: string;
    type?: DocumentType;
  };
}

// No corpo do componente:
useEffect(() => {
  if (open && defaultValues) {
    // Pré-preencher form com defaultValues
    form.reset(defaultValues);
  }
}, [open, defaultValues]);
```

---

## 📍 4. Integração na Página de Detalhes

**Arquivo:** `contabil-pro/src/app/(app)/clientes/[id]/page.tsx`

**Localização:** Após linha 199 (depois do card de Observações)

```typescript
// ... código existente ...

      {/* Observações */}
      {client.notes && (
        <Card>
          {/* ... */}
        </Card>
      )}

      {/* 🆕 ADICIONAR AQUI */}
      <ClientDocumentsSection 
        clientId={client.id} 
        clientName={client.name} 
      />
    </div>
  )
}
```

---

## 🧪 5. Casos de Teste

### 5.1 Cenários de Sucesso

1. **Visualizar documentos do cliente**
   - ✅ Carregar lista de documentos
   - ✅ Exibir contadores corretos
   - ✅ Filtrar por tipo via tabs

2. **Upload de documento**
   - ✅ Abrir dialog de upload
   - ✅ `client_id` pré-preenchido
   - ✅ Upload bem-sucedido
   - ✅ Lista atualizada automaticamente

3. **Desvincular documento**
   - ✅ Abrir confirmação
   - ✅ Remover vínculo
   - ✅ Documento desaparece da lista
   - ✅ Toast de sucesso

4. **Visualizar detalhes**
   - ✅ Abrir dialog de detalhes
   - ✅ Exibir informações completas
   - ✅ Preview de PDF funciona

### 5.2 Cenários de Erro

1. **Sem documentos**
   - ✅ Exibir empty state
   - ✅ Botão de upload visível

2. **Erro ao carregar**
   - ✅ Exibir mensagem de erro
   - ✅ Botão de retry

3. **Erro ao upload**
   - ✅ Toast de erro
   - ✅ Form não fecha

### 5.3 Edge Cases

1. **Cliente sem documentos**
   - ✅ Empty state adequado
   - ✅ Tabs não aparecem

2. **Muitos documentos**
   - ✅ Paginação funciona
   - ✅ Performance mantida

3. **Documentos sem tipo**
   - ✅ Aparecem em "Outros"
   - ✅ Não quebram interface

---

## 📊 6. Queries Supabase

### 6.1 Query Principal (já implementada)

```sql
-- Executada por getDocuments({ client_id })
SELECT 
  d.*,
  c.id as "client.id",
  c.name as "client.name",
  e.id as "entry.id",
  e.description as "entry.description",
  u.id as "uploader.id",
  u.name as "uploader.name"
FROM documents d
LEFT JOIN clients c ON d.client_id = c.id
LEFT JOIN entries e ON d.entry_id = e.id
LEFT JOIN users u ON d.uploaded_by = u.id
WHERE d.client_id = $1  -- Filtro por cliente
  AND d.tenant_id = current_setting('request.jwt.claims')::jsonb->>'tenant_id'  -- RLS
ORDER BY d.created_at DESC
LIMIT 10 OFFSET 0;
```

### 6.2 Query de Update (desvincular)

```sql
-- Executada por updateDocument({ id, client_id: null })
UPDATE documents
SET 
  client_id = NULL,
  updated_at = NOW()
WHERE id = $1
  AND tenant_id = current_setting('request.jwt.claims')::jsonb->>'tenant_id'  -- RLS
RETURNING *;
```

---

## 🎯 7. Checklist Técnico

### Preparação
- [ ] Revisar código existente de documentos
- [ ] Confirmar estrutura de tipos
- [ ] Validar hooks disponíveis

### Desenvolvimento
- [ ] Criar `ClientDocumentsSection` component
- [ ] Implementar lógica de tabs
- [ ] Adicionar props em `DocumentsTable`
- [ ] Adicionar props em `UploadDialog`
- [ ] Integrar na página de detalhes

### Testes
- [ ] Testar carregamento de documentos
- [ ] Testar filtros por tipo
- [ ] Testar upload com vínculo
- [ ] Testar desvinculação
- [ ] Testar empty states
- [ ] Testar responsividade

### Finalização
- [ ] Code review
- [ ] Documentar código
- [ ] Atualizar tipos se necessário
- [ ] Commit e PR

---

**Implementação pronta para começar! 🚀**

