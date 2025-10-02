# Fix: Visualização de Documentos PDF

## Problemas Identificados

### 1. **DOMMatrix is not defined** (SSR Error)
**Causa:** O componente `react-pdf` estava sendo importado estaticamente, causando erro de renderização no servidor (SSR) porque `DOMMatrix` não existe no ambiente Node.js.

**Solução:**
- Importação dinâmica do `PDFPreviewDialog` com `ssr: false`
- Configuração do worker do PDF.js apenas no cliente
- Adição de guard `mounted` para evitar renderização no servidor

### 2. **createServerClient is not defined**
**Causa:** Faltava o import de `createServerClient` no arquivo `entries.ts`.

**Solução:**
- Adicionado import: `import { createServerClient } from '@/lib/supabase/server'`

### 3. **Campo storage_path vs path**
**Causa:** O componente verificava `document?.storage_path` mas o campo correto na tabela é `path`.

**Solução:**
- Removida verificação de `storage_path`
- Mantida apenas verificação de `mime_type` e `viewMutation.data?.url`

## Arquivos Modificados

### 1. `contabil-pro/src/actions/entries.ts`
```typescript
// Corrigido import (era @/lib/supabase/server, agora é @/lib/supabase)
import { createServerClient } from '@/lib/supabase'
```

### 2. `contabil-pro/src/components/documents/document-details-dialog.tsx`
```typescript
// Importação dinâmica para evitar SSR
const PDFPreviewDialog = dynamic(
  () => import('./pdf-preview-dialog').then((mod) => ({ default: mod.PDFPreviewDialog })),
  { ssr: false }
);

// Corrigida verificação do campo
{document?.mime_type === 'application/pdf' && viewMutation.data?.url && (
  <PDFPreviewDialog ... />
)}
```

### 3. `contabil-pro/src/components/documents/pdf-preview-dialog.tsx`
```typescript
// Configuração segura do worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
}

// Guard para renderização apenas no cliente
const [mounted, setMounted] = useState(false);

useEffect(() => {
  configurePdfWorker();
  setMounted(true);
}, []);

if (!mounted) {
  return null;
}
```

### 4. `contabil-pro/src/lib/pdf-config.ts` (NOVO)
```typescript
// Configuração centralizada do worker PDF.js
export function configurePdfWorker() {
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;
  }
}
```

### 5. `contabil-pro/src/actions/documents.ts`
```typescript
// Corrigido import duplicado (removido @/lib/supabase/server)
import { createServerClient } from '@/lib/supabase'

// Melhorias na função getDocumentViewUrl:
// - Adicionado campo mime_type na query
// - Validação de path
// - Logs de debug
// - Tratamento de erro melhorado
```

## Como Testar

1. **Reiniciar o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

2. **Acessar a página de documentos:**
   - Navegar para `/documentos`
   - Clicar em um documento PDF
   - Clicar no botão "Visualizar"

3. **Verificar no console:**
   - Não deve haver erros de SSR
   - Deve aparecer log: "URL de visualização gerada com sucesso"
   - O PDF deve carregar no dialog

## Melhorias Implementadas

1. **Performance:**
   - Transform options no Storage (width: 2000, quality: 85)
   - Lazy loading do componente PDF

2. **UX:**
   - Loading states melhorados
   - Mensagens de erro mais descritivas
   - Botão "Tentar novamente" em caso de erro

3. **Debugging:**
   - Logs detalhados em cada etapa
   - Informações sobre path e URL gerada

4. **Segurança:**
   - URL assinada com expiração de 1 hora
   - Registro de eventos de visualização
   - RLS aplicado automaticamente

## Próximos Passos

- [ ] Testar com diferentes tipos de PDF
- [ ] Verificar CORS se houver problemas
- [ ] Adicionar cache de URLs assinadas
- [ ] Implementar pré-visualização de thumbnails
- [ ] Adicionar suporte para outros formatos (imagens, etc.)

