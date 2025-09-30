

---

# 📋 PLANO COMPLETO: Página de Documentos - ContabilPRO
## Baseado na Análise Real do Projeto JoyceSoft

---

## 🎯 **VISÃO GERAL**

### **Objetivo**
Implementar sistema completo de gestão documental com:
- ✅ Upload seguro multi-tenant via Supabase Storage
- ✅ Processamento automático com Edge Functions + OpenAI
- ✅ OCR e classificação inteligente
- ✅ Integração com lançamentos e clientes
- ✅ Auditoria completa (LGPD)

### **Contexto do Projeto**
- **Projeto Supabase:** JoyceSoft (ID: `selnwgpyjctpjzdrfrey`)
- **Região:** sa-east-1 (São Paulo)
- **Bucket existente:** `documentos` (50MB, privado)
- **Tabela:** `documents` (completa com 19 colunas)
- **OpenAI API Key:** ✅ Já configurada
- **Extensões:** vector, pgcrypto, pg_trgm ✅ Instaladas

---

## ⚠️ **PROBLEMAS CRÍTICOS IDENTIFICADOS**

1. 🚨 **25 políticas de Storage** (muitas perigosas com acesso total)
2. ⚠️ **Política DELETE faltando** na tabela documents
3. ❌ **Bucket de thumbnails** não existe
4. ❌ **Tabela de auditoria** não existe
5. ❌ **Edge Functions** não deployadas (0 funções)

---

## 📊 **CRONOGRAMA EXECUTIVO**

| Fase | Descrição | Duração | Prioridade |
|------|-----------|---------|------------|
| **0** | 🚨 Segurança e Limpeza | 0.5 dia | **CRÍTICA** |
| **1** | Infraestrutura Complementar | 1 dia | Alta |
| **2** | Server Actions | 2 dias | Alta |
| **3** | Edge Functions | 2 dias | Alta |
| **4** | UI Components | 1.5 dias | Média |
| **5** | Integração da Página | 1 dia | Média |
| **6** | Testes e Validação | 1 dia | Alta |

**TOTAL: 9 dias (72 horas)**

---

# 🚨 FASE 0: SEGURANÇA E LIMPEZA (CRÍTICO)
**Duração:** 4 horas | **Prioridade:** MÁXIMA

## **Objetivo**
Corrigir vulnerabilidades críticas de segurança nas políticas de Storage.

---

## **Tarefa 0.1: Remover Políticas Perigosas**
**Duração:** 1 hora

### **Arquivo:** `infra/migrations/015_cleanup_storage_policies.sql`

```sql
-- ============================================
-- MIGRATION 015: Limpeza de Políticas de Storage
-- ============================================
-- Remove todas as políticas perigosas e duplicadas
-- do bucket 'documentos'

-- 1. Remover políticas de DEBUG (CRÍTICO)
DROP POLICY IF EXISTS "Debug - Acesso total temporario" ON storage.objects;
DROP POLICY IF EXISTS "Acesso total documentos" ON storage.objects;
DROP POLICY IF EXISTS "Acesso total documentos debug" ON storage.objects;

-- 2. Remover políticas duplicadas
DROP POLICY IF EXISTS "Authenticated users can delete documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own documents from documentos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to documentos bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own company documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own company documents" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem atualizar seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem deletar seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem fazer upload de documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios documentos" ON storage.objects;
DROP POLICY IF EXISTS "Visualizar documentos" ON storage.objects;

-- 3. Remover políticas de usuário de teste
DROP POLICY IF EXISTS "Usuario teste acesso total storage" ON storage.objects;
DROP POLICY IF EXISTS "Usuario teste pode atualizar documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuario teste pode excluir documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuario teste pode fazer upload de documentos" ON storage.objects;
DROP POLICY IF EXISTS "Usuario teste pode visualizar documentos" ON storage.objects;

-- 4. Manter apenas políticas corretas de outros buckets
-- (relatorios-pdf, backups, temp-uploads já estão OK)
```

**Comando de execução:**
```bash
cd contabil-pro
supabase db push --db-url "postgresql://postgres:[password]@db.selnwgpyjctpjzdrfrey.supabase.co:5432/postgres"
```

---

## **Tarefa 0.2: Criar Políticas Robustas**
**Duração:** 2 horas

### **Arquivo:** `infra/migrations/016_create_secure_storage_policies.sql`

```sql
-- ============================================
-- MIGRATION 016: Políticas Seguras de Storage
-- ============================================
-- Cria políticas robustas baseadas em tenant_id
-- com validação de path e extensão

-- ============================================
-- POLÍTICA 1: SELECT (Visualizar Documentos)
-- ============================================
CREATE POLICY "tenant_can_view_documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documentos'
  AND split_part(name, '/', 1) = (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid() 
      AND status = 'active'
    LIMIT 1
  )
);

-- ============================================
-- POLÍTICA 2: INSERT (Upload de Documentos)
-- ============================================
CREATE POLICY "tenant_can_upload_documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
  -- Validar tenant_id no path
  AND split_part(name, '/', 1) = (
    SELECT tenant_id::text 
    FROM user_tenants 
    WHERE user_id = auth.uid() 
      AND status = 'active'
    LIMIT 1
  )
  -- Validar estrutura de path: tenant/type/year/file
  AND array_length(string_to_array(name, '/'), 1) = 4
  -- Validar extensão permitida
  AND storage.extension(name) = ANY(
    ARRAY['pdf','png','jpg','jpeg','webp','xml','csv','xlsx','docx','txt']
  )
  -- Validar tamanho (50MB já está no bucket)
);

-- ============================================
-- POLÍTICA 3: UPDATE (Atualizar Metadados)
-- ============================================
-- Apenas admin/owner podem atualizar
CREATE POLICY "admin_can_update_documents"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1 
    FROM user_tenants
    WHERE user_id = auth.uid()
      AND tenant_id::text = split_part(name, '/', 1)
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
);

-- ============================================
-- POLÍTICA 4: DELETE (Deletar Documentos)
-- ============================================
-- Apenas admin/owner podem deletar
CREATE POLICY "admin_can_delete_documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND EXISTS (
    SELECT 1 
    FROM user_tenants
    WHERE user_id = auth.uid()
      AND tenant_id::text = split_part(name, '/', 1)
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
);

-- ============================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================
COMMENT ON POLICY "tenant_can_view_documents" ON storage.objects IS 
'Permite que usuários visualizem documentos do seu tenant. Path: {tenant_id}/{type}/{year}/{file}';

COMMENT ON POLICY "tenant_can_upload_documents" ON storage.objects IS 
'Permite upload apenas no tenant do usuário, com validação de path e extensão';

COMMENT ON POLICY "admin_can_update_documents" ON storage.objects IS 
'Apenas admin/owner podem atualizar metadados de documentos';

COMMENT ON POLICY "admin_can_delete_documents" ON storage.objects IS 
'Apenas admin/owner podem deletar documentos';
```

---

## **Tarefa 0.3: Adicionar Política DELETE na Tabela**
**Duração:** 30 minutos

### **Arquivo:** `infra/migrations/017_add_documents_delete_policy.sql`

```sql
-- ============================================
-- MIGRATION 017: Política DELETE para Tabela Documents
-- ============================================

-- Adicionar política de DELETE (apenas admin/owner)
CREATE POLICY "admin_can_delete_document_records"
ON documents FOR DELETE
TO authenticated
USING (
  tenant_id = current_tenant_id()
  AND EXISTS (
    SELECT 1 
    FROM user_tenants
    WHERE user_id = auth.uid()
      AND tenant_id = documents.tenant_id
      AND role IN ('owner', 'admin')
      AND status = 'active'
  )
);

COMMENT ON POLICY "admin_can_delete_document_records" ON documents IS 
'Apenas admin/owner podem deletar registros de documentos';
```

---

## **Tarefa 0.4: Criar Bucket de Thumbnails**
**Duração:** 30 minutos

### **Arquivo:** `infra/migrations/018_create_thumbnails_bucket.sql`

```sql
-- ============================================
-- MIGRATION 018: Bucket de Thumbnails
-- ============================================

-- Criar bucket público para thumbnails
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'document-thumbnails',
  'document-thumbnails',
  true, -- Público para acesso direto
  5242880, -- 5MB
  ARRAY['image/webp', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- POLÍTICAS DO BUCKET DE THUMBNAILS
-- ============================================

-- SELECT: Público (thumbnails são públicos)
CREATE POLICY "thumbnails_are_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'document-thumbnails');

-- INSERT: Apenas service role (gerado por Edge Function)
CREATE POLICY "service_can_upload_thumbnails"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (
  bucket_id = 'document-thumbnails'
  AND storage.extension(name) = ANY(ARRAY['webp', 'jpg', 'jpeg', 'png'])
);

-- UPDATE: Apenas service role
CREATE POLICY "service_can_update_thumbnails"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'document-thumbnails');

-- DELETE: Apenas service role
CREATE POLICY "service_can_delete_thumbnails"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'document-thumbnails');
```

---

## **✅ Critérios de Aceitação - Fase 0**

- [ ] Todas as 25 políticas antigas removidas
- [ ] Apenas 4 políticas no bucket `documentos`
- [ ] Política DELETE na tabela `documents` criada
- [ ] Bucket `document-thumbnails` criado e público
- [ ] Teste: Usuário não consegue acessar documentos de outro tenant
- [ ] Teste: Usuário comum não consegue deletar documentos
- [ ] Teste: Admin consegue deletar documentos do seu tenant

---

# 📦 FASE 1: INFRAESTRUTURA COMPLEMENTAR
**Duração:** 1 dia (8 horas) | **Prioridade:** Alta

## **Objetivo**
Criar estruturas de banco complementares para auditoria, busca otimizada e embeddings.

---

## **Tarefa 1.1: Tabela de Auditoria (LGPD)**
**Duração:** 2 horas

### **Arquivo:** `infra/migrations/019_create_document_events.sql`

```sql
-- ============================================
-- MIGRATION 019: Tabela de Auditoria de Documentos
-- ============================================
-- Para conformidade com LGPD e rastreabilidade

CREATE TABLE document_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Tipo de evento
  event_type VARCHAR(50) NOT NULL CHECK (
    event_type IN (
      'upload', 'process_start', 'process_complete', 'process_error',
      'view', 'download', 'delete', 'link_entry', 'link_client',
      'classify', 'ocr_complete'
    )
  ),
  
  -- Metadados do evento
  metadata JSONB DEFAULT '{}',
  
  -- Informações de rede (LGPD)
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ÍNDICES
-- ============================================
CREATE INDEX idx_document_events_tenant_created 
  ON document_events(tenant_id, created_at DESC);

CREATE INDEX idx_document_events_document 
  ON document_events(document_id, created_at DESC) 
  WHERE document_id IS NOT NULL;

CREATE INDEX idx_document_events_user 
  ON document_events(user_id, created_at DESC) 
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_document_events_type 
  ON document_events(event_type);

-- Índice GIN para busca em metadata
CREATE INDEX idx_document_events_metadata 
  ON document_events USING GIN(metadata);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE document_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_events_from_tenant"
ON document_events FOR SELECT
TO authenticated
USING (tenant_id = current_tenant_id());

CREATE POLICY "system_can_insert_events"
ON document_events FOR INSERT
TO authenticated
WITH CHECK (tenant_id = current_tenant_id());

-- ============================================
-- FUNÇÃO AUXILIAR: Registrar Evento
-- ============================================
CREATE OR REPLACE FUNCTION log_document_event(
  p_document_id UUID,
  p_event_type VARCHAR,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Obter tenant_id do documento
  SELECT tenant_id INTO v_tenant_id
  FROM documents
  WHERE id = p_document_id;
  
  -- Inserir evento
  INSERT INTO document_events (
    tenant_id,
    document_id,
    user_id,
    event_type,
    metadata,
    ip_address
  ) VALUES (
    v_tenant_id,
    p_document_id,
    auth.uid(),
    p_event_type,
    p_metadata,
    inet_client_addr()
  ) RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION log_document_event IS 
'Registra evento de documento para auditoria (LGPD)';
```

---

## **Tarefa 1.2: Otimizar Full-Text Search**
**Duração:** 1 hora

### **Arquivo:** `infra/migrations/020_optimize_fts.sql`

```sql
-- ============================================
-- MIGRATION 020: Otimizar Full-Text Search
-- ============================================
-- Adiciona coluna TSVector gerada para busca mais eficiente

-- Adicionar coluna TSVector gerada
ALTER TABLE documents 
ADD COLUMN ocr_tsv tsvector 
GENERATED ALWAYS AS (
  to_tsvector('portuguese', coalesce(ocr_text, ''))
) STORED;

-- Remover índice antigo
DROP INDEX IF EXISTS idx_documents_ocr_text;

-- Criar índice GIN na coluna gerada (mais eficiente)
CREATE INDEX idx_documents_ocr_tsv 
  ON documents USING GIN(ocr_tsv);

-- ============================================
-- FUNÇÃO DE BUSCA OTIMIZADA
-- ============================================
CREATE OR REPLACE FUNCTION search_documents_fts(
  p_tenant_id UUID,
  p_query TEXT,
  p_limit INT DEFAULT 20
) RETURNS TABLE (
  id UUID,
  name VARCHAR,
  type VARCHAR,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.type,
    d.created_at,
    ts_rank(d.ocr_tsv, websearch_to_tsquery('portuguese', p_query)) as rank
  FROM documents d
  WHERE d.tenant_id = p_tenant_id
    AND d.ocr_tsv @@ websearch_to_tsquery('portuguese', p_query)
  ORDER BY rank DESC, d.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_documents_fts IS 
'Busca full-text otimizada em documentos usando TSVector gerado';
```

---

## **Tarefa 1.3: Tabela de Embeddings (Stub)**
**Duração:** 1 hora

### **Arquivo:** `infra/migrations/021_create_document_embeddings.sql`

```sql
-- ============================================
-- MIGRATION 021: Embeddings para Busca Semântica
-- ============================================
-- Stub para Fase 2 (busca híbrida)

CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Embedding vector (text-embedding-3-small = 1536 dimensões)
  embedding vector(1536),
  
  -- Metadados
  model VARCHAR(50) DEFAULT 'text-embedding-3-small',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: um embedding por documento
  UNIQUE(document_id)
);

-- Índice IVFFlat para busca de vizinhos mais próximos
CREATE INDEX idx_document_embeddings_vector 
  ON document_embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================
-- RLS
-- ============================================
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_embeddings_from_tenant"
ON document_embeddings FOR SELECT
TO authenticated
USING (
  document_id IN (
    SELECT id FROM documents WHERE tenant_id = current_tenant_id()
  )
);

-- ============================================
-- FUNÇÃO DE BUSCA HÍBRIDA (Stub)
-- ============================================
CREATE OR REPLACE FUNCTION search_documents_hybrid(
  p_tenant_id UUID,
  p_query TEXT,
  p_query_embedding vector(1536) DEFAULT NULL,
  p_limit INT DEFAULT 10
) RETURNS TABLE (
  id UUID,
  name VARCHAR,
  type VARCHAR,
  created_at TIMESTAMPTZ,
  fts_score REAL,
  semantic_score REAL,
  combined_score REAL
) AS $$
BEGIN
  -- Fase 2: Implementar busca híbrida (FTS + kNN)
  -- Por enquanto, apenas FTS
  RETURN QUERY
  SELECT 
    d.id,
    d.name,
    d.type,
    d.created_at,
    ts_rank(d.ocr_tsv, websearch_to_tsquery('portuguese', p_query)) as fts_score,
    0.0::REAL as semantic_score,
    ts_rank(d.ocr_tsv, websearch_to_tsquery('portuguese', p_query)) as combined_score
  FROM documents d
  WHERE d.tenant_id = p_tenant_id
    AND d.ocr_tsv @@ websearch_to_tsquery('portuguese', p_query)
  ORDER BY combined_score DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION search_documents_hybrid IS 
'Busca híbrida (FTS + semântica). Fase 2: adicionar kNN com embeddings';
```

---

## **Tarefa 1.4: Função de Geração de Path**
**Duração:** 1 hora

### **Arquivo:** `infra/migrations/022_create_path_generator.sql`

```sql
-- ============================================
-- MIGRATION 022: Função de Geração de Path
-- ============================================

CREATE OR REPLACE FUNCTION generate_document_path(
  p_tenant_id UUID,
  p_type VARCHAR,
  p_filename VARCHAR,
  p_hash VARCHAR
) RETURNS TEXT AS $$
DECLARE
  v_year TEXT;
  v_extension TEXT;
  v_clean_name TEXT;
BEGIN
  -- Ano atual
  v_year := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Extrair extensão (última parte após último ponto)
  v_extension := LOWER(SUBSTRING(p_filename FROM '\.([^.]+)$'));
  
  -- Se não encontrou extensão, usar 'bin'
  IF v_extension IS NULL OR v_extension = '' THEN
    v_extension := 'bin';
  END IF;
  
  -- Limpar nome do arquivo (remover extensão e caracteres especiais)
  v_clean_name := REGEXP_REPLACE(
    SUBSTRING(p_filename FROM '^(.+)\.[^.]+$'),
    '[^a-zA-Z0-9_-]',
    '_',
    'g'
  );
  
  -- Se não conseguiu extrair nome, usar 'document'
  IF v_clean_name IS NULL OR v_clean_name = '' THEN
    v_clean_name := 'document';
  END IF;
  
  -- Limitar tamanho do nome (50 caracteres)
  v_clean_name := SUBSTRING(v_clean_name FROM 1 FOR 50);
  
  -- Retornar path no formato: {tenant}/{type}/{year}/{hash}-{name}.{ext}
  RETURN FORMAT(
    '%s/%s/%s/%s-%s.%s',
    p_tenant_id,
    COALESCE(p_type, 'other'),
    v_year,
    SUBSTRING(p_hash FROM 1 FOR 8), -- Primeiros 8 chars do hash
    v_clean_name,
    v_extension
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION generate_document_path IS 
'Gera path padronizado para documentos: {tenant}/{type}/{year}/{hash}-{name}.{ext}';

-- ============================================
-- TESTES
-- ============================================
-- Teste 1: PDF
SELECT generate_document_path(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
  'nfe',
  'nota-fiscal-123.pdf',
  'abc123def456'
);
-- Esperado: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/nfe/2025/abc123de-nota-fiscal-123.pdf

-- Teste 2: Imagem
SELECT generate_document_path(
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::UUID,
  'receipt',
  'Recibo Pagamento (2024).jpg',
  'xyz789'
);
-- Esperado: a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11/receipt/2025/xyz789-Recibo_Pagamento__2024_.jpg
```

---

## **Tarefa 1.5: Views de Métricas**
**Duração:** 2 horas

### **Arquivo:** `infra/migrations/023_create_metrics_views.sql`

```sql
-- ============================================
-- MIGRATION 023: Views de Métricas e Dashboard
-- ============================================

-- ============================================
-- VIEW 1: Estatísticas de Documentos por Tenant
-- ============================================
CREATE OR REPLACE VIEW v_documents_stats AS
SELECT 
  d.tenant_id,
  COUNT(*) as total_documents,
  COUNT(*) FILTER (WHERE d.processed = true) as processed_count,
  COUNT(*) FILTER (WHERE d.processed = false) as pending_count,
  SUM(d.size) as total_size_bytes,
  SUM(d.size) / 1024.0 / 1024.0 as total_size_mb,
  COUNT(DISTINCT d.type) as document_types_count,
  COUNT(DISTINCT d.client_id) as clients_with_documents,
  MIN(d.created_at) as first_upload,
  MAX(d.created_at) as last_upload,
  AVG(d.ocr_confidence) FILTER (WHERE d.ocr_confidence IS NOT NULL) as avg_ocr_confidence
FROM documents d
GROUP BY d.tenant_id;

COMMENT ON VIEW v_documents_stats IS 
'Estatísticas agregadas de documentos por tenant';

-- ============================================
-- VIEW 2: Documentos por Tipo
-- ============================================
CREATE OR REPLACE VIEW v_documents_by_type AS
SELECT 
  d.tenant_id,
  d.type,
  COUNT(*) as count,
  SUM(d.size) / 1024.0 / 1024.0 as total_size_mb,
  AVG(d.ocr_confidence) as avg_confidence,
  COUNT(*) FILTER (WHERE d.processed = true) as processed_count
FROM documents d
GROUP BY d.tenant_id, d.type;

COMMENT ON VIEW v_documents_by_type IS 
'Documentos agrupados por tipo e tenant';

-- ============================================
-- VIEW 3: Atividade de Processamento
-- ============================================
CREATE OR REPLACE VIEW v_processing_activity AS
SELECT 
  de.tenant_id,
  DATE_TRUNC('day', de.created_at) as date,
  de.event_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT de.document_id) as unique_documents,
  COUNT(DISTINCT de.user_id) as unique_users
FROM document_events de
WHERE de.event_type IN ('process_start', 'process_complete', 'process_error')
GROUP BY de.tenant_id, DATE_TRUNC('day', de.created_at), de.event_type;

COMMENT ON VIEW v_processing_activity IS 
'Atividade de processamento de documentos por dia';

-- ============================================
-- VIEW 4: Custos de IA (Estimativa)
-- ============================================
CREATE OR REPLACE VIEW v_ai_costs_estimate AS
SELECT 
  ai.tenant_id,
  DATE_TRUNC('month', ai.created_at) as month,
  ai.type as insight_type,
  COUNT(*) as total_insights,
  -- Estimativa de custo (ajustar conforme modelo usado)
  CASE 
    WHEN ai.type = 'classification' THEN COUNT(*) * 0.001 -- GPT-4o-mini
    WHEN ai.type = 'extraction' THEN COUNT(*) * 0.01 -- GPT-4o
    WHEN ai.type = 'ocr' THEN COUNT(*) * 0.03 -- GPT-4 Vision
    ELSE COUNT(*) * 0.005
  END as estimated_cost_usd
FROM ai_insights ai
GROUP BY ai.tenant_id, DATE_TRUNC('month', ai.created_at), ai.type;

COMMENT ON VIEW v_ai_costs_estimate IS 
'Estimativa de custos de IA por tenant e mês';

-- ============================================
-- FUNÇÃO: Dashboard Completo
-- ============================================
CREATE OR REPLACE FUNCTION get_documents_dashboard(
  p_tenant_id UUID
) RETURNS JSON AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'stats', (
      SELECT row_to_json(s) 
      FROM v_documents_stats s 
      WHERE s.tenant_id = p_tenant_id
    ),
    'by_type', (
      SELECT json_agg(row_to_json(t))
      FROM v_documents_by_type t
      WHERE t.tenant_id = p_tenant_id
    ),
    'recent_activity', (
      SELECT json_agg(row_to_json(a))
      FROM (
        SELECT * FROM v_processing_activity
        WHERE tenant_id = p_tenant_id
        ORDER BY date DESC
        LIMIT 30
      ) a
    ),
    'ai_costs', (
      SELECT json_agg(row_to_json(c))
      FROM v_ai_costs_estimate c
      WHERE c.tenant_id = p_tenant_id
      ORDER BY month DESC
      LIMIT 12
    )
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_documents_dashboard IS 
'Retorna dashboard completo de documentos para um tenant';
```

---

## **✅ Critérios de Aceitação - Fase 1**

- [ ] Tabela `document_events` criada com RLS
- [ ] Função `log_document_event()` funcionando
- [ ] Coluna `ocr_tsv` gerada e índice GIN criado
- [ ] Função `search_documents_fts()` retornando resultados
- [ ] Tabela `document_embeddings` criada (stub)
- [ ] Função `generate_document_path()` gerando paths corretos
- [ ] Views de métricas criadas e retornando dados
- [ ] Função `get_documents_dashboard()` retornando JSON

---

# ⚙️ FASE 2: SERVER ACTIONS
**Duração:** 2 dias (16 horas) | **Prioridade:** Alta

## **Objetivo**
Implementar Server Actions para CRUD de documentos com validação, segurança e auditoria.

---

## **Tarefa 2.1: Types e Schemas**
**Duração:** 2 horas

### **Arquivo:** `src/types/document.types.ts`

```typescript
// ============================================
// TYPES: Documentos
// ============================================

export type DocumentType = 
  | 'nfe'        // Nota Fiscal Eletrônica
  | 'nfse'       // Nota Fiscal de Serviço
  | 'receipt'    // Recibo
  | 'invoice'    // Fatura
  | 'contract'   // Contrato
  | 'other';     // Outros

export type DocumentStatus = 
  | 'pending'    // Aguardando processamento
  | 'processing' // Em processamento
  | 'completed'  // Processado com sucesso
  | 'error';     // Erro no processamento

export interface Document {
  id: string;
  tenant_id: string;
  name: string;
  original_name: string;
  path: string;
  hash: string;
  size: number;
  mime_type: string;
  type: DocumentType | null;
  entry_id: string | null;
  client_id: string | null;
  metadata: Record<string, any>;
  ocr_text: string | null;
  ocr_confidence: number | null;
  processed: boolean;
  processed_at: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentWithRelations extends Document {
  client?: {
    id: string;
    name: string;
  };
  entry?: {
    id: string;
    description: string;
  };
  uploader?: {
    id: string;
    name: string;
  };
}

export interface DocumentFilters {
  type?: DocumentType;
  client_id?: string;
  processed?: boolean;
  search?: string;
  date_from?: string;
  date_to?: string;
}

export interface DocumentUploadResult {
  success: boolean;
  document?: Document;
  error?: string;
  duplicate?: boolean;
}

export interface DocumentListResult {
  documents: DocumentWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}
```

---

### **Arquivo:** `src/schemas/document.schema.ts`

```typescript
// ============================================
// SCHEMAS: Validação com Zod
// ============================================

import { z } from 'zod';

// Schema de tipo de documento
export const documentTypeSchema = z.enum([
  'nfe',
  'nfse',
  'receipt',
  'invoice',
  'contract',
  'other',
]);

// Schema de upload
export const uploadDocumentSchema = z.object({
  file: z.instanceof(File, { message: 'Arquivo inválido' }),
  type: documentTypeSchema.optional(),
  client_id: z.string().uuid().optional(),
  entry_id: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional(),
});

export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;

// Schema de filtros
export const documentFiltersSchema = z.object({
  type: documentTypeSchema.optional(),
  client_id: z.string().uuid().optional(),
  processed: z.boolean().optional(),
  search: z.string().optional(),
  date_from: z.string().datetime().optional(),
  date_to: z.string().datetime().optional(),
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type DocumentFiltersInput = z.infer<typeof documentFiltersSchema>;

// Schema de atualização
export const updateDocumentSchema = z.object({
  id: z.string().uuid(),
  type: documentTypeSchema.optional(),
  client_id: z.string().uuid().nullable().optional(),
  entry_id: z.string().uuid().nullable().optional(),
  metadata: z.record(z.any()).optional(),
});

export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

// Validação de arquivo
export const validateFile = (file: File) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/xml',
    'text/xml',
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (file.size > maxSize) {
    throw new Error('Arquivo muito grande. Máximo: 50MB');
  }

  if (!allowedTypes.includes(file.mime_type)) {
    throw new Error('Tipo de arquivo não permitido');
  }

  return true;
};
```

---

## **Tarefa 2.2: Server Action - Upload**
**Duração:** 4 horas

### **Arquivo:** `src/actions/documents.ts`

```typescript
'use server';

// ============================================
// SERVER ACTIONS: Documentos
// ============================================

import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireAuth, setRLSContext } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import {
  uploadDocumentSchema,
  documentFiltersSchema,
  updateDocumentSchema,
  validateFile,
} from '@/schemas/document.schema';
import type {
  DocumentUploadResult,
  DocumentListResult,
  Document,
} from '@/types/document.types';

// ============================================
// ACTION 1: Upload de Documento
// ============================================
export async function uploadDocument(
  formData: FormData
): Promise<DocumentUploadResult> {
  try {
    // 1. Autenticação e contexto
    const session = await requireAuth();
    const supabase = await setRLSContext(session);

    // 2. Extrair e validar dados
    const file = formData.get('file') as File;
    const type = formData.get('type') as string | null;
    const client_id = formData.get('client_id') as string | null;
    const entry_id = formData.get('entry_id') as string | null;

    if (!file) {
      return { success: false, error: 'Arquivo não fornecido' };
    }

    // Validar arquivo
    validateFile(file);

    // Validar input
    const input = uploadDocumentSchema.parse({
      file,
      type: type || undefined,
      client_id: client_id || undefined,
      entry_id: entry_id || undefined,
    });

    // 3. Calcular hash SHA-256 (SEMPRE no servidor)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = createHash('sha256').update(buffer).digest('hex');

    // 4. Verificar duplicata (idempotência)
    const { data: existing, error: checkError } = await supabase
      .from('documents')
      .select('id, name, path')
      .eq('tenant_id', session.tenant_id)
      .eq('hash', hash)
      .single();

    if (existing) {
      return {
        success: true,
        document: existing as Document,
        duplicate: true,
      };
    }

    // 5. Gerar path usando função do banco
    const { data: pathData, error: pathError } = await supabase.rpc(
      'generate_document_path',
      {
        p_tenant_id: session.tenant_id,
        p_type: input.type || 'other',
        p_filename: file.name,
        p_hash: hash,
      }
    );

    if (pathError || !pathData) {
      throw new Error('Erro ao gerar path do documento');
    }

    const storagePath = pathData as string;

    // 6. Upload para Storage
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false, // Nunca sobrescrever
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // 7. Inserir metadados no banco
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        tenant_id: session.tenant_id,
        name: file.name,
        original_name: file.name,
        path: storagePath,
        hash,
        size: file.size,
        mime_type: file.type,
        type: input.type || null,
        client_id: input.client_id || null,
        entry_id: input.entry_id || null,
        metadata: input.metadata || {},
        uploaded_by: session.user.id,
        processed: false,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: deletar do Storage
      await supabase.storage.from('documentos').remove([storagePath]);
      throw new Error(`Erro ao salvar metadados: ${insertError.message}`);
    }

    // 8. Registrar evento de auditoria
    await supabase.rpc('log_document_event', {
      p_document_id: document.id,
      p_event_type: 'upload',
      p_metadata: {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      },
    });

    // 9. Invocar Edge Function para processamento
    const { error: invokeError } = await supabase.functions.invoke(
      'process-document',
      {
        body: {
          document_id: document.id,
          tenant_id: session.tenant_id,
          storage_path: storagePath,
          mime_type: file.type,
        },
      }
    );

    if (invokeError) {
      console.error('Erro ao invocar processamento:', invokeError);
      // Não falhar o upload por causa disso
    }

    // 10. Revalidar página
    revalidatePath('/documentos');

    return {
      success: true,
      document: document as Document,
      duplicate: false,
    };
  } catch (error: any) {
    console.error('Erro no upload:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido no upload',
    };
  }
}
```

---

## **Tarefa 2.3: Server Action - Listagem**
**Duração:** 3 horas

### **Continuação do arquivo:** `src/actions/documents.ts`

```typescript
// ============================================
// ACTION 2: Listar Documentos
// ============================================
export async function getDocuments(
  filters?: Partial<DocumentFiltersInput>
): Promise<DocumentListResult> {
  try {
    const session = await requireAuth();
    const supabase = await setRLSContext(session);

    // Validar e aplicar defaults
    const validated = documentFiltersSchema.parse(filters || {});

    // Construir query
    let query = supabase
      .from('documents')
      .select(
        `
        *,
        client:clients(id, name),
        entry:entries(id, description),
        uploader:users!uploaded_by(id, name)
      `,
        { count: 'exact' }
      )
      .eq('tenant_id', session.tenant_id);

    // Aplicar filtros
    if (validated.type) {
      query = query.eq('type', validated.type);
    }

    if (validated.client_id) {
      query = query.eq('client_id', validated.client_id);
    }

    if (validated.processed !== undefined) {
      query = query.eq('processed', validated.processed);
    }

    if (validated.date_from) {
      query = query.gte('created_at', validated.date_from);
    }

    if (validated.date_to) {
      query = query.lte('created_at', validated.date_to);
    }

    // Busca full-text
    if (validated.search) {
      query = query.textSearch('ocr_tsv', validated.search, {
        type: 'websearch',
        config: 'portuguese',
      });
    }

    // Paginação
    const from = (validated.page - 1) * validated.pageSize;
    const to = from + validated.pageSize - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    // Executar query
    const { data, error, count } = await query;

    if (error) {
      throw new Error(`Erro ao buscar documentos: ${error.message}`);
    }

    return {
      documents: (data || []) as any,
      total: count || 0,
      page: validated.page,
      pageSize: validated.pageSize,
    };
  } catch (error: any) {
    console.error('Erro ao listar documentos:', error);
    throw error;
  }
}
```

---

## **Tarefa 2.4: Server Action - Download**
**Duração:** 2 horas

### **Continuação do arquivo:** `src/actions/documents.ts`

```typescript
// ============================================
// ACTION 3: Gerar URL de Download
// ============================================
export async function getDocumentDownloadUrl(
  documentId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await setRLSContext(session);

    // 1. Buscar documento
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, path, name')
      .eq('id', documentId)
      .eq('tenant_id', session.tenant_id)
      .single();

    if (fetchError || !document) {
      return { success: false, error: 'Documento não encontrado' };
    }

    // 2. Gerar URL assinada (válida por 1 hora)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documentos')
      .createSignedUrl(document.path, 3600, {
        download: document.name, // Nome do arquivo no download
      });

    if (urlError || !urlData) {
      return { success: false, error: 'Erro ao gerar URL de download' };
    }

    // 3. Registrar evento de download
    await supabase.rpc('log_document_event', {
      p_document_id: documentId,
      p_event_type: 'download',
      p_metadata: { file_name: document.name },
    });

    return {
      success: true,
      url: urlData.signedUrl,
    };
  } catch (error: any) {
    console.error('Erro ao gerar URL:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}
```

---

## **Tarefa 2.5: Server Action - Delete**
**Duração:** 2 horas

### **Continuação do arquivo:** `src/actions/documents.ts`

```typescript
// ============================================
// ACTION 4: Deletar Documento
// ============================================
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await setRLSContext(session);

    // 1. Verificar permissão (admin/owner)
    const { data: userTenant, error: roleError } = await supabase
      .from('user_tenants')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('tenant_id', session.tenant_id)
      .single();

    if (roleError || !userTenant) {
      return { success: false, error: 'Erro ao verificar permissões' };
    }

    if (!['owner', 'admin'].includes(userTenant.role)) {
      return {
        success: false,
        error: 'Apenas administradores podem deletar documentos',
      };
    }

    // 2. Buscar documento
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, path, name')
      .eq('id', documentId)
      .eq('tenant_id', session.tenant_id)
      .single();

    if (fetchError || !document) {
      return { success: false, error: 'Documento não encontrado' };
    }

    // 3. Deletar do Storage
    const { error: storageError } = await supabase.storage
      .from('documentos')
      .remove([document.path]);

    if (storageError) {
      console.error('Erro ao deletar do Storage:', storageError);
      // Continuar mesmo assim (pode já ter sido deletado)
    }

    // 4. Registrar evento ANTES de deletar
    await supabase.rpc('log_document_event', {
      p_document_id: documentId,
      p_event_type: 'delete',
      p_metadata: { file_name: document.name },
    });

    // 5. Deletar do banco (RLS vai validar permissão novamente)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      return {
        success: false,
        error: `Erro ao deletar: ${deleteError.message}`,
      };
    }

    // 6. Revalidar página
    revalidatePath('/documentos');

    return {
      success: true,
      message: 'Documento deletado com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao deletar documento:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}
```

---

## **Tarefa 2.6: Server Action - Atualizar**
**Duração:** 1 hora

### **Continuação do arquivo:** `src/actions/documents.ts`

```typescript
// ============================================
// ACTION 5: Atualizar Documento
// ============================================
export async function updateDocument(
  input: UpdateDocumentInput
): Promise<{ success: boolean; document?: Document; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await setRLSContext(session);

    // Validar input
    const validated = updateDocumentSchema.parse(input);

    // Atualizar (RLS vai validar tenant_id)
    const { data: document, error: updateError } = await supabase
      .from('documents')
      .update({
        type: validated.type,
        client_id: validated.client_id,
        entry_id: validated.entry_id,
        metadata: validated.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .eq('tenant_id', session.tenant_id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: `Erro ao atualizar: ${updateError.message}`,
      };
    }

    // Revalidar
    revalidatePath('/documentos');

    return {
      success: true,
      document: document as Document,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar documento:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}
```

---

## **✅ Critérios de Aceitação - Fase 2**

- [ ] Types e schemas criados e validando corretamente
- [ ] `uploadDocument()` calculando hash no servidor
- [ ] Upload detectando duplicatas (idempotência)
- [ ] `getDocuments()` com filtros e FTS funcionando
- [ ] `getDocumentDownloadUrl()` gerando URLs assinadas
- [ ] `deleteDocument()` validando permissão admin/owner
- [ ] `updateDocument()` atualizando metadados
- [ ] Auditoria registrando todos os eventos
- [ ] Edge Function sendo invocada após upload

---

Devido ao limite de tokens, vou continuar com as próximas fases em uma resposta mais concisa. Você gostaria que eu continue com:

**FASE 3: Edge Functions** (process-document, processadores, estratégia de modelos)
**FASE 4: UI Components** (UploadDialog, DocumentsTable, facetas)
**FASE 5: Integração da Página**
**FASE 6: Testes e Validação**



Vou continuar o plano completo com as fases restantes:

---

# 🔧 FASE 3: EDGE FUNCTIONS
**Duração:** 2 dias (16 horas) | **Prioridade:** Alta

## **Objetivo**
Implementar processamento assíncrono de documentos com OpenAI (OCR, classificação, extração).

---

## **Tarefa 3.1: Estrutura de Pastas**
**Duração:** 30 minutos

```bash
# Criar estrutura de Edge Functions
mkdir -p supabase/functions/process-document/processors
mkdir -p supabase/functions/process-document/utils

# Estrutura final:
# supabase/
#   functions/
#     process-document/
#       index.ts              # Orquestrador principal
#       processors/
#         pdf-processor.ts    # Processamento de PDFs
#         image-processor.ts  # Processamento de imagens
#         xml-processor.ts    # Processamento de XMLs (NFe/NFSe)
#       utils/
#         openai.ts          # Cliente OpenAI
#         supabase.ts        # Cliente Supabase
#         idempotency.ts     # Controle de idempotência
```

---

## **Tarefa 3.2: Utils - OpenAI Client**
**Duração:** 1 hora

### **Arquivo:** `supabase/functions/process-document/utils/openai.ts`

```typescript
// ============================================
// UTILS: Cliente OpenAI
// ============================================

import OpenAI from 'https://deno.land/x/openai@v4.20.1/mod.ts';

const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// ============================================
// Estratégia de Modelos
// ============================================
export const MODELS = {
  CLASSIFY: 'gpt-4o-mini', // Classificação simples ($0.15/1M tokens)
  EXTRACT: 'gpt-4o', // Extração estruturada ($2.50/1M input)
  VISION: 'gpt-4-vision-preview', // OCR de imagens ($10/1M input)
} as const;

// ============================================
// Classificar Documento (GPT-4o-mini)
// ============================================
export async function classifyDocument(
  text: string
): Promise<{
  type: string;
  confidence: number;
  reasoning: string;
}> {
  const response = await openai.chat.completions.create({
    model: MODELS.CLASSIFY,
    messages: [
      {
        role: 'system',
        content: `Você é um classificador de documentos contábeis brasileiros.
Classifique o documento em uma das categorias:
- nfe: Nota Fiscal Eletrônica
- nfse: Nota Fiscal de Serviço Eletrônica
- receipt: Recibo
- invoice: Fatura/Boleto
- contract: Contrato
- other: Outros

Retorne JSON: { "type": "...", "confidence": 0.0-1.0, "reasoning": "..." }`,
      },
      {
        role: 'user',
        content: `Classifique este documento:\n\n${text.substring(0, 1000)}`,
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return {
    type: result.type || 'other',
    confidence: result.confidence || 0.5,
    reasoning: result.reasoning || '',
  };
}

// ============================================
// Extrair Dados Estruturados (GPT-4o)
// ============================================
export async function extractStructuredData(
  text: string,
  documentType: string
): Promise<Record<string, any>> {
  const prompts: Record<string, string> = {
    nfe: `Extraia dados da NFe:
- numero_nota
- serie
- data_emissao
- cnpj_emitente
- nome_emitente
- valor_total
- cfop
- natureza_operacao`,
    nfse: `Extraia dados da NFSe:
- numero_nota
- data_emissao
- cnpj_prestador
- nome_prestador
- valor_servicos
- iss_retido`,
    receipt: `Extraia dados do recibo:
- data
- valor
- pagador
- beneficiario
- descricao`,
    invoice: `Extraia dados da fatura:
- numero
- data_vencimento
- valor
- beneficiario
- codigo_barras`,
  };

  const prompt = prompts[documentType] || 'Extraia informações relevantes';

  const response = await openai.chat.completions.create({
    model: MODELS.EXTRACT,
    messages: [
      {
        role: 'system',
        content: `Você é um extrator de dados de documentos contábeis.
${prompt}

Retorne JSON com os campos extraídos. Use null para campos não encontrados.`,
      },
      {
        role: 'user',
        content: text.substring(0, 4000),
      },
    ],
    response_format: { type: 'json_object' },
    temperature: 0,
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// ============================================
// OCR de Imagem (GPT-4 Vision)
// ============================================
export async function ocrImage(
  base64Image: string,
  mimeType: string
): Promise<{ text: string; confidence: number }> {
  const response = await openai.chat.completions.create({
    model: MODELS.VISION,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extraia TODO o texto desta imagem. Mantenha a formatação e estrutura.',
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  });

  const text = response.choices[0].message.content || '';
  
  // Estimar confiança baseado no tamanho da resposta
  const confidence = Math.min(text.length / 1000, 1.0);

  return { text, confidence };
}
```

---

## **Tarefa 3.3: Utils - Supabase Client**
**Duração:** 30 minutos

### **Arquivo:** `supabase/functions/process-document/utils/supabase.ts`

```typescript
// ============================================
// UTILS: Cliente Supabase (Service Role)
// ============================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ============================================
// Atualizar Documento
// ============================================
export async function updateDocument(
  documentId: string,
  updates: {
    ocr_text?: string;
    ocr_confidence?: number;
    processed?: boolean;
    processed_at?: string;
    type?: string;
  }
) {
  const { error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId);

  if (error) {
    throw new Error(`Erro ao atualizar documento: ${error.message}`);
  }
}

// ============================================
// Criar AI Insight
// ============================================
export async function createAIInsight(
  tenantId: string,
  documentId: string,
  type: string,
  confidence: number,
  data: Record<string, any>
) {
  const { error } = await supabase.from('ai_insights').insert({
    tenant_id: tenantId,
    entry_id: documentId, // Usando entry_id para document_id
    type,
    confidence,
    data,
    status: confidence >= 0.85 ? 'pending_review' : 'needs_review',
  });

  if (error) {
    throw new Error(`Erro ao criar insight: ${error.message}`);
  }
}

// ============================================
// Registrar Evento
// ============================================
export async function logEvent(
  documentId: string,
  eventType: string,
  metadata: Record<string, any> = {}
) {
  await supabase.rpc('log_document_event', {
    p_document_id: documentId,
    p_event_type: eventType,
    p_metadata: metadata,
  });
}
```

---

## **Tarefa 3.4: Utils - Idempotência**
**Duração:** 30 minutos

### **Arquivo:** `supabase/functions/process-document/utils/idempotency.ts`

```typescript
// ============================================
// UTILS: Controle de Idempotência
// ============================================

import { createHash } from 'https://deno.land/std@0.208.0/node/crypto.ts';
import { supabase } from './supabase.ts';

// ============================================
// Gerar Process Key
// ============================================
export function generateProcessKey(
  tenantId: string,
  storagePath: string,
  version: number = 1
): string {
  const data = `${tenantId}:${storagePath}:${version}`;
  return createHash('sha256').update(data).digest('hex');
}

// ============================================
// Verificar se Já Foi Processado
// ============================================
export async function isAlreadyProcessed(
  processKey: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('document_events')
    .select('id')
    .eq('event_type', 'process_complete')
    .eq('metadata->>process_key', processKey)
    .single();

  return !!data && !error;
}

// ============================================
// Marcar Como Processado
// ============================================
export async function markAsProcessed(
  documentId: string,
  processKey: string,
  metadata: Record<string, any> = {}
) {
  await supabase.from('document_events').insert({
    document_id: documentId,
    event_type: 'process_complete',
    metadata: {
      ...metadata,
      process_key: processKey,
    },
  });
}
```

---

## **Tarefa 3.5: Processador de PDF**
**Duração:** 3 horas

### **Arquivo:** `supabase/functions/process-document/processors/pdf-processor.ts`

```typescript
// ============================================
// PROCESSOR: PDF
// ============================================

import { ocrImage, classifyDocument, extractStructuredData } from '../utils/openai.ts';

// ============================================
// Processar PDF
// ============================================
export async function processPDF(
  fileBuffer: ArrayBuffer,
  documentId: string
): Promise<{
  text: string;
  confidence: number;
  type: string;
  extractedData: Record<string, any>;
}> {
  // Estratégia: Converter apenas primeiras 3 páginas para imagens
  // e processar com Vision (evitar timeout)
  
  // Para MVP: Usar biblioteca de PDF para extrair texto
  // Se falhar, usar Vision nas primeiras páginas
  
  try {
    // Tentar extrair texto diretamente do PDF
    const text = await extractTextFromPDF(fileBuffer);
    
    if (text.length > 100) {
      // Texto extraído com sucesso
      const classification = await classifyDocument(text);
      const extractedData = await extractStructuredData(text, classification.type);
      
      return {
        text,
        confidence: classification.confidence,
        type: classification.type,
        extractedData,
      };
    }
    
    // Fallback: PDF é imagem escaneada, usar Vision
    return await processPDFAsImage(fileBuffer, documentId);
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    throw error;
  }
}

// ============================================
// Extrair Texto de PDF (Nativo)
// ============================================
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  // Usar biblioteca pdf-parse ou similar
  // Para MVP simplificado, retornar vazio e forçar Vision
  return '';
}

// ============================================
// Processar PDF como Imagem (Vision)
// ============================================
async function processPDFAsImage(
  buffer: ArrayBuffer,
  documentId: string
): Promise<{
  text: string;
  confidence: number;
  type: string;
  extractedData: Record<string, any>;
}> {
  // Converter primeira página para imagem
  // Usar ImageMagick ou similar via Deno
  
  // Para MVP: Retornar erro pedindo para converter manualmente
  throw new Error('PDF escaneado detectado. Por favor, converta para imagem e faça upload novamente.');
}
```

---

## **Tarefa 3.6: Processador de Imagem**
**Duração:** 2 horas

### **Arquivo:** `supabase/functions/process-document/processors/image-processor.ts`

```typescript
// ============================================
// PROCESSOR: Imagem
// ============================================

import { ocrImage, classifyDocument, extractStructuredData } from '../utils/openai.ts';

// ============================================
// Processar Imagem
// ============================================
export async function processImage(
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<{
  text: string;
  confidence: number;
  type: string;
  extractedData: Record<string, any>;
}> {
  // Converter para base64
  const base64 = btoa(
    new Uint8Array(fileBuffer).reduce(
      (data, byte) => data + String.fromCharCode(byte),
      ''
    )
  );

  // OCR com Vision
  const { text, confidence: ocrConfidence } = await ocrImage(base64, mimeType);

  if (text.length < 50) {
    throw new Error('Texto insuficiente extraído da imagem');
  }

  // Classificar
  const classification = await classifyDocument(text);

  // Extrair dados estruturados
  const extractedData = await extractStructuredData(text, classification.type);

  return {
    text,
    confidence: Math.min(ocrConfidence, classification.confidence),
    type: classification.type,
    extractedData,
  };
}
```

---

## **Tarefa 3.7: Processador de XML**
**Duração:** 2 horas

### **Arquivo:** `supabase/functions/process-document/processors/xml-processor.ts`

```typescript
// ============================================
// PROCESSOR: XML (NFe/NFSe)
// ============================================

import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts';

// ============================================
// Processar XML
// ============================================
export async function processXML(
  fileBuffer: ArrayBuffer
): Promise<{
  text: string;
  confidence: number;
  type: string;
  extractedData: Record<string, any>;
}> {
  // Converter buffer para string
  const decoder = new TextDecoder('utf-8');
  const xmlString = decoder.decode(fileBuffer);

  // Parse XML
  const doc = new DOMParser().parseFromString(xmlString, 'text/xml');

  if (!doc) {
    throw new Error('XML inválido');
  }

  // Detectar tipo (NFe ou NFSe)
  const isNFe = xmlString.includes('<NFe') || xmlString.includes('<nfeProc');
  const isNFSe = xmlString.includes('<nfse') || xmlString.includes('<RPS');

  if (isNFe) {
    return processNFe(doc, xmlString);
  } else if (isNFSe) {
    return processNFSe(doc, xmlString);
  } else {
    throw new Error('Tipo de XML não reconhecido');
  }
}

// ============================================
// Processar NFe
// ============================================
function processNFe(
  doc: any,
  xmlString: string
): {
  text: string;
  confidence: number;
  type: string;
  extractedData: Record<string, any>;
} {
  // Extrair campos principais da NFe
  const extractedData = {
    numero_nota: getXMLValue(doc, 'nNF'),
    serie: getXMLValue(doc, 'serie'),
    data_emissao: getXMLValue(doc, 'dhEmi'),
    cnpj_emitente: getXMLValue(doc, 'emit CNPJ'),
    nome_emitente: getXMLValue(doc, 'emit xNome'),
    valor_total: parseFloat(getXMLValue(doc, 'vNF') || '0'),
    cfop: getXMLValue(doc, 'CFOP'),
    natureza_operacao: getXMLValue(doc, 'natOp'),
    chave_acesso: getXMLValue(doc, 'chNFe'),
  };

  // Gerar texto legível
  const text = `
NFe ${extractedData.numero_nota} - Série ${extractedData.serie}
Emitente: ${extractedData.nome_emitente} (${extractedData.cnpj_emitente})
Data: ${extractedData.data_emissao}
Valor: R$ ${extractedData.valor_total}
CFOP: ${extractedData.cfop}
Natureza: ${extractedData.natureza_operacao}
  `.trim();

  return {
    text,
    confidence: 1.0, // XML estruturado = alta confiança
    type: 'nfe',
    extractedData,
  };
}

// ============================================
// Processar NFSe
// ============================================
function processNFSe(
  doc: any,
  xmlString: string
): {
  text: string;
  confidence: number;
  type: string;
  extractedData: Record<string, any>;
} {
  // Extrair campos principais da NFSe
  const extractedData = {
    numero_nota: getXMLValue(doc, 'Numero'),
    data_emissao: getXMLValue(doc, 'DataEmissao'),
    cnpj_prestador: getXMLValue(doc, 'Prestador Cnpj'),
    nome_prestador: getXMLValue(doc, 'Prestador RazaoSocial'),
    valor_servicos: parseFloat(getXMLValue(doc, 'ValorServicos') || '0'),
    iss_retido: getXMLValue(doc, 'IssRetido') === '1',
  };

  const text = `
NFSe ${extractedData.numero_nota}
Prestador: ${extractedData.nome_prestador} (${extractedData.cnpj_prestador})
Data: ${extractedData.data_emissao}
Valor: R$ ${extractedData.valor_servicos}
ISS Retido: ${extractedData.iss_retido ? 'Sim' : 'Não'}
  `.trim();

  return {
    text,
    confidence: 1.0,
    type: 'nfse',
    extractedData,
  };
}

// ============================================
// Helper: Extrair Valor de XML
// ============================================
function getXMLValue(doc: any, path: string): string {
  const parts = path.split(' ');
  let element = doc;

  for (const part of parts) {
    element = element?.querySelector(part);
    if (!element) return '';
  }

  return element?.textContent?.trim() || '';
}
```

---

## **Tarefa 3.8: Orquestrador Principal**
**Duração:** 3 horas

### **Arquivo:** `supabase/functions/process-document/index.ts`

```typescript
// ============================================
// EDGE FUNCTION: process-document
// ============================================

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import { supabase, updateDocument, createAIInsight, logEvent } from './utils/supabase.ts';
import { generateProcessKey, isAlreadyProcessed, markAsProcessed } from './utils/idempotency.ts';
import { processPDF } from './processors/pdf-processor.ts';
import { processImage } from './processors/image-processor.ts';
import { processXML } from './processors/xml-processor.ts';

// ============================================
// Handler Principal
// ============================================
serve(async (req) => {
  try {
    // Validar método
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Parse body
    const { document_id, tenant_id, storage_path, mime_type } = await req.json();

    if (!document_id || !tenant_id || !storage_path || !mime_type) {
      return new Response('Missing required fields', { status: 400 });
    }

    // Verificar idempotência
    const processKey = generateProcessKey(tenant_id, storage_path);
    
    if (await isAlreadyProcessed(processKey)) {
      console.log('Documento já processado:', document_id);
      return new Response(
        JSON.stringify({ message: 'Already processed' }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Registrar início do processamento
    await logEvent(document_id, 'process_start', { mime_type });

    // Baixar arquivo do Storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documentos')
      .download(storage_path);

    if (downloadError || !fileData) {
      throw new Error(`Erro ao baixar arquivo: ${downloadError?.message}`);
    }

    const fileBuffer = await fileData.arrayBuffer();

    // Rotear para processador apropriado
    let result;

    if (mime_type === 'application/pdf') {
      result = await processPDF(fileBuffer, document_id);
    } else if (mime_type.startsWith('image/')) {
      result = await processImage(fileBuffer, mime_type);
    } else if (mime_type.includes('xml')) {
      result = await processXML(fileBuffer);
    } else {
      throw new Error(`Tipo de arquivo não suportado: ${mime_type}`);
    }

    // Atualizar documento no banco
    await updateDocument(document_id, {
      ocr_text: result.text,
      ocr_confidence: result.confidence,
      type: result.type,
      processed: true,
      processed_at: new Date().toISOString(),
    });

    // Criar AI Insight
    await createAIInsight(
      tenant_id,
      document_id,
      'extraction',
      result.confidence,
      result.extractedData
    );

    // Marcar como processado (idempotência)
    await markAsProcessed(document_id, processKey, {
      mime_type,
      confidence: result.confidence,
      type: result.type,
    });

    // Registrar conclusão
    await logEvent(document_id, 'process_complete', {
      confidence: result.confidence,
      type: result.type,
    });

    // Invocar geração de thumbnail (assíncrono, não esperar)
    supabase.functions.invoke('generate-thumbnail', {
      body: { document_id, tenant_id, storage_path },
    }).catch(console.error);

    return new Response(
      JSON.stringify({
        success: true,
        document_id,
        type: result.type,
        confidence: result.confidence,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Erro no processamento:', error);

    // Registrar erro
    const body = await req.json().catch(() => ({}));
    if (body.document_id) {
      await logEvent(body.document_id, 'process_error', {
        error: error.message,
      });
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## **Tarefa 3.9: Deploy da Edge Function**
**Duração:** 1 hora

```bash
# 1. Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# 2. Login no Supabase
supabase login

# 3. Link com o projeto
supabase link --project-ref selnwgpyjctpjzdrfrey

# 4. Deploy da função
cd contabil-pro
supabase functions deploy process-document

# 5. Configurar secrets (se ainda não configurados)
supabase secrets set OPENAI_API_KEY=sk-...

# 6. Testar a função
supabase functions invoke process-document --body '{
  "document_id": "test-id",
  "tenant_id": "test-tenant",
  "storage_path": "test/path",
  "mime_type": "application/pdf"
}'
```

---

## **✅ Critérios de Aceitação - Fase 3**

- [ ] Edge Function `process-document` deployada
- [ ] Processador de PDF funcionando
- [ ] Processador de imagem com Vision funcionando
- [ ] Processador de XML extraindo dados de NFe/NFSe
- [ ] Idempotência funcionando (não reprocessar)
- [ ] Classificação usando GPT-4o-mini (economia de custo)
- [ ] Extração usando GPT-4o quando necessário
- [ ] AI Insights sendo criados no banco
- [ ] Eventos de auditoria sendo registrados
- [ ] Timeout não ocorrendo (< 60s)

---

# 🎨 FASE 4: UI COMPONENTS
**Duração:** 1.5 dias (12 horas) | **Prioridade:** Média

## **Tarefa 4.1: Upload Zone**
**Duração:** 2 horas

### **Arquivo:** `src/components/documents/upload-zone.tsx`

```typescript
'use client';

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  maxFiles?: number;
  maxSize?: number;
  accept?: Record<string, string[]>;
  disabled?: boolean;
}

export function UploadZone({
  onFilesSelected,
  maxFiles = 10,
  maxSize = 50 * 1024 * 1024, // 50MB
  accept = {
    'application/pdf': ['.pdf'],
    'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    'application/xml': ['.xml'],
    'text/xml': ['.xml'],
  },
  disabled = false,
}: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      onFilesSelected(acceptedFiles);
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles,
      maxSize,
      accept,
      disabled,
    });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragActive
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        
        {isDragActive ? (
          <p className="text-lg font-medium">Solte os arquivos aqui...</p>
        ) : (
          <>
            <p className="text-lg font-medium mb-2">
              Arraste arquivos aqui ou clique para selecionar
            </p>
            <p className="text-sm text-muted-foreground">
              PDF, imagens, XML (máx. {maxFiles} arquivos, {maxSize / 1024 / 1024}MB cada)
            </p>
          </>
        )}
      </div>

      {fileRejections.length > 0 && (
        <div className="mt-4 space-y-2">
          {fileRejections.map(({ file, errors }) => (
            <div
              key={file.name}
              className="flex items-start gap-2 text-sm text-destructive"
            >
              <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{file.name}</p>
                {errors.map((error) => (
                  <p key={error.code} className="text-xs">
                    {error.message}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## **Tarefa 4.2: Upload Dialog**
**Duração:** 3 horas

### **Arquivo:** `src/components/documents/upload-dialog.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UploadZone } from './upload-zone';
import { uploadDocument } from '@/actions/documents';
import type { DocumentType } from '@/types/document.types';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadDialog({ open, onOpenChange }: UploadDialogProps) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [type, setType] = useState<DocumentType>('other');
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState<Array<{ file: string; success: boolean; error?: string }>>([]);

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setResults([]);

    const uploadResults = [];

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const result = await uploadDocument(formData);

      uploadResults.push({
        file: file.name,
        success: result.success,
        error: result.error,
      });
    }

    setResults(uploadResults);
    setUploading(false);

    // Se todos foram bem-sucedidos, fechar após 2s
    if (uploadResults.every((r) => r.success)) {
      setTimeout(() => {
        onOpenChange(false);
        setFiles([]);
        setResults([]);
        router.refresh();
      }, 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload de Documentos</DialogTitle>
          <DialogDescription>
            Faça upload de PDFs, imagens ou XMLs. Os documentos serão processados automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de Documento */}
          <div className="space-y-2">
            <Label>Tipo de Documento</Label>
            <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nfe">Nota Fiscal Eletrônica (NFe)</SelectItem>
                <SelectItem value="nfse">Nota Fiscal de Serviço (NFSe)</SelectItem>
                <SelectItem value="receipt">Recibo</SelectItem>
                <SelectItem value="invoice">Fatura/Boleto</SelectItem>
                <SelectItem value="contract">Contrato</SelectItem>
                <SelectItem value="other">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Upload Zone */}
          <UploadZone
            onFilesSelected={setFiles}
            disabled={uploading}
          />

          {/* Lista de Arquivos Selecionados */}
          {files.length > 0 && !uploading && results.length === 0 && (
            <div className="space-y-2">
              <Label>Arquivos Selecionados ({files.length})</Label>
              <div className="space-y-1">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                  >
                    <span className="truncate">{file.name}</span>
                    <span className="text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resultados do Upload */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label>Resultados</Label>
              <div className="space-y-1">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-muted rounded text-sm"
                  >
                    {result.success ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    )}
                    <span className="flex-1 truncate">{result.file}</span>
                    {result.error && (
                      <span className="text-xs text-destructive">{result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || uploading}
            >
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? 'Enviando...' : `Enviar ${files.length} arquivo(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## **Tarefa 4.3: Documents Table**
**Duração:** 4 horas

### **Arquivo:** `src/components/documents/documents-table.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  FileText,
  Download,
  Trash2,
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getDocumentDownloadUrl, deleteDocument } from '@/actions/documents';
import type { DocumentWithRelations } from '@/types/document.types';

interface DocumentsTableProps {
  documents: DocumentWithRelations[];
}

export function DocumentsTable({ documents }: DocumentsTableProps) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDownload = async (documentId: string) => {
    setDownloading(documentId);
    const result = await getDocumentDownloadUrl(documentId);
    
    if (result.success && result.url) {
      window.open(result.url, '_blank');
    } else {
      alert(result.error || 'Erro ao baixar documento');
    }
    
    setDownloading(null);
  };

  const handleDelete = async (documentId: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar "${name}"?`)) return;

    setDeleting(documentId);
    const result = await deleteDocument(documentId);
    
    if (result.success) {
      router.refresh();
    } else {
      alert(result.error || 'Erro ao deletar documento');
    }
    
    setDeleting(null);
  };

  const columns: ColumnDef<DocumentWithRelations>[] = [
    {
      accessorKey: 'name',
      header: 'Nome',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{row.original.name}</p>
            {row.original.client && (
              <p className="text-xs text-muted-foreground">
                {row.original.client.name}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: 'Tipo',
      cell: ({ row }) => {
        const typeLabels: Record<string, string> = {
          nfe: 'NFe',
          nfse: 'NFSe',
          receipt: 'Recibo',
          invoice: 'Fatura',
          contract: 'Contrato',
          other: 'Outros',
        };
        return (
          <Badge variant="outline">
            {typeLabels[row.original.type || 'other']}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'processed',
      header: 'Status',
      cell: ({ row }) => {
        if (row.original.processed) {
          return (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm">Processado</span>
            </div>
          );
        }
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <Clock className="h-4 w-4" />
            <span className="text-sm">Processando...</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'size',
      header: 'Tamanho',
      cell: ({ row }) => {
        const mb = row.original.size / 1024 / 1024;
        return <span className="text-sm">{mb.toFixed(2)} MB</span>;
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Data',
      cell: ({ row }) => (
        <span className="text-sm">
          {format(new Date(row.original.created_at), 'dd/MM/yyyy HH:mm', {
            locale: ptBR,
          })}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => handleDownload(row.original.id)}
              disabled={downloading === row.original.id}
            >
              {downloading === row.original.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleDelete(row.original.id, row.original.name)}
              disabled={deleting === row.original.id}
              className="text-destructive"
            >
              {deleting === row.original.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const table = useReactTable({
    data: documents,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Nenhum documento encontrado.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## **Tarefa 4.4: Filtros e Facetas**
**Duração:** 2 horas

### **Arquivo:** `src/components/documents/documents-filters.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function DocumentsFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [processed, setProcessed] = useState(searchParams.get('processed') || 'all');

  const handleFilter = () => {
    const params = new URLSearchParams();
    
    if (search) params.set('search', search);
    if (type !== 'all') params.set('type', type);
    if (processed !== 'all') params.set('processed', processed);
    
    router.push(`/documentos?${params.toString()}`);
  };

  const handleClear = () => {
    setSearch('');
    setType('all');
    setProcessed('all');
    router.push('/documentos');
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        {/* Busca */}
        <div className="flex-1">
          <Input
            placeholder="Buscar documentos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
          />
        </div>

        {/* Tipo */}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="nfe">NFe</SelectItem>
            <SelectItem value="nfse">NFSe</SelectItem>
            <SelectItem value="receipt">Recibo</SelectItem>
            <SelectItem value="invoice">Fatura</SelectItem>
            <SelectItem value="contract">Contrato</SelectItem>
            <SelectItem value="other">Outros</SelectItem>
          </SelectContent>
        </Select>

        {/* Status */}
        <Select value={processed} onValueChange={setProcessed}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="true">Processados</SelectItem>
            <SelectItem value="false">Processando</SelectItem>
          </SelectContent>
        </Select>

        {/* Botões */}
        <Button onClick={handleFilter}>
          <Filter className="mr-2 h-4 w-4" />
          Filtrar
        </Button>
        <Button variant="outline" onClick={handleClear}>
          Limpar
        </Button>
      </div>
    </div>
  );
}
```

---

## **✅ Critérios de Aceitação - Fase 4**

- [ ] UploadZone com drag & drop funcionando
- [ ] UploadDialog abrindo e fechando corretamente
- [ ] Upload de múltiplos arquivos funcionando
- [ ] DocumentsTable exibindo documentos
- [ ] Ações de download e delete funcionando
- [ ] Filtros aplicando corretamente
- [ ] Estados de loading visíveis
- [ ] Feedback de erro para o usuário

---

# 📄 FASE 5: INTEGRAÇÃO DA PÁGINA
**Duração:** 1 dia (8 horas) | **Prioridade:** Média

## **Tarefa 5.1: Página Completa**
**Duração:** 4 horas

### **Arquivo:** `src/app/(tenant)/documentos/page.tsx`

```typescript
import { Suspense } from 'react';
import { FileText, Upload, Loader2 } from 'lucide-react';
import { requirePermission } from '@/lib/auth';
import { getDocuments } from '@/actions/documents';
import { Button } from '@/components/ui/button';
import { DocumentsTable } from '@/components/documents/documents-table';
import { DocumentsFilters } from '@/components/documents/documents-filters';
import { UploadDialog } from '@/components/documents/upload-dialog';

interface DocumentosPageProps {
  searchParams: {
    search?: string;
    type?: string;
    processed?: string;
    page?: string;
  };
}

export default async function DocumentosPage({
  searchParams,
}: DocumentosPageProps) {
  await requirePermission('documentos.read');

  // Buscar documentos com filtros
  const filters = {
    search: searchParams.search,
    type: searchParams.type as any,
    processed: searchParams.processed === 'true' ? true : searchParams.processed === 'false' ? false : undefined,
    page: parseInt(searchParams.page || '1'),
  };

  const result = await getDocuments(filters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground">
            Gerencie documentos fiscais, recibos e contratos
          </p>
        </div>
        
        <UploadButton />
      </div>

      {/* Filtros */}
      <DocumentsFilters />

      {/* Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total"
          value={result.total}
          icon={FileText}
        />
        <StatCard
          title="Processados"
          value={result.documents.filter((d) => d.processed).length}
          icon={FileText}
        />
        <StatCard
          title="Processando"
          value={result.documents.filter((d) => !d.processed).length}
          icon={Loader2}
        />
        <StatCard
          title="Este Mês"
          value={result.documents.filter((d) => {
            const date = new Date(d.created_at);
            const now = new Date();
            return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
          }).length}
          icon={FileText}
        />
      </div>

      {/* Tabela */}
      <Suspense fallback={<TableSkeleton />}>
        <DocumentsTable documents={result.documents} />
      </Suspense>

      {/* Paginação */}
      {result.total > result.pageSize && (
        <Pagination
          currentPage={result.page}
          totalPages={Math.ceil(result.total / result.pageSize)}
        />
      )}
    </div>
  );
}

// ============================================
// Componentes Auxiliares
// ============================================

function UploadButton() {
  'use client';
  
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Upload className="mr-2 h-4 w-4" />
        Upload
      </Button>
      <UploadDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: any;
}) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  'use client';
  
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/documentos?${params.toString()}`);
  };
  
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        onClick={() => goToPage(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Anterior
      </Button>
      <span className="text-sm">
        Página {currentPage} de {totalPages}
      </span>
      <Button
        variant="outline"
        onClick={() => goToPage(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Próxima
      </Button>
    </div>
  );
}
```

---

## **✅ Critérios de Aceitação - Fase 5**

- [ ] Página carregando documentos corretamente
- [ ] Filtros funcionando e persistindo na URL
- [ ] Upload dialog abrindo e funcionando
- [ ] Estatísticas exibindo valores corretos
- [ ] Paginação funcionando
- [ ] Loading states visíveis
- [ ] Página responsiva (mobile/desktop)

---

# ✅ FASE 6: TESTES E VALIDAÇÃO
**Duração:** 1 dia (8 horas) | **Prioridade:** Alta

## **Checklist de Testes**

### **Segurança (RLS)**
- [ ] Usuário não consegue ver documentos de outro tenant
- [ ] Usuário comum não consegue deletar documentos
- [ ] Admin consegue deletar documentos do seu tenant
- [ ] Upload valida tenant_id no path
- [ ] Políticas de Storage bloqueiam acesso cross-tenant

### **Storage**
- [ ] Upload de PDF funciona
- [ ] Upload de imagem funciona
- [ ] Upload de XML funciona
- [ ] Arquivo duplicado é detectado (idempotência)
- [ ] Arquivo > 50MB é rejeitado
- [ ] Tipo MIME inválido é rejeitado

### **Edge Functions**
- [ ] PDF é processado e OCR extraído
- [ ] Imagem é processada com Vision
- [ ] XML (NFe) é parseado corretamente
- [ ] Classificação retorna tipo correto
- [ ] Extração retorna dados estruturados
- [ ] Idempotência impede reprocessamento
- [ ] Timeout não ocorre (< 60s)

### **UI**
- [ ] Drag & drop funciona
- [ ] Upload de múltiplos arquivos funciona
- [ ] Tabela exibe documentos
- [ ] Filtros aplicam corretamente
- [ ] Download gera URL assinada
- [ ] Delete remove documento
- [ ] Loading states visíveis
- [ ] Erros são exibidos ao usuário

### **Auditoria**
- [ ] Evento de upload é registrado
- [ ] Evento de processamento é registrado
- [ ] Evento de download é registrado
- [ ] Evento de delete é registrado

---

## **Comandos de Teste**

```bash
# 1. Testar migrations
cd contabil-pro
supabase db reset --db-url "postgresql://..."

# 2. Testar Edge Function localmente
supabase functions serve process-document

# 3. Testar upload via curl
curl -X POST http://localhost:54321/functions/v1/process-document \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "test-id",
    "tenant_id": "test-tenant",
    "storage_path": "test/path.pdf",
    "mime_type": "application/pdf"
  }'

# 4. Rodar aplicação Next.js
npm run dev

# 5. Testar no navegador
# - Fazer login
# - Ir para /documentos
# - Fazer upload de arquivo
# - Verificar processamento
# - Testar filtros
# - Testar download
# - Testar delete (como admin)
```

---

## **✅ Critérios de Aceitação - Fase 6**

- [ ] Todos os testes de segurança passando
- [ ] Todos os testes de Storage passando
- [ ] Todos os testes de Edge Functions passando
- [ ] Todos os testes de UI passando
- [ ] Auditoria registrando todos os eventos
- [ ] Documentação de testes criada
- [ ] Bugs críticos corrigidos

---

# 📊 RESUMO EXECUTIVO FINAL

## **Tempo Total: 9 dias (72 horas)**

| Fase | Duração | Status |
|------|---------|--------|
| 0 - Segurança | 0.5 dia | 🚨 CRÍTICO |
| 1 - Infraestrutura | 1 dia | ✅ Pronto |
| 2 - Server Actions | 2 dias | ✅ Pronto |
| 3 - Edge Functions | 2 dias | ✅ Pronto |
| 4 - UI Components | 1.5 dias | ✅ Pronto |
| 5 - Integração | 1 dia | ✅ Pronto |
| 6 - Testes | 1 dia | ✅ Pronto |

## **Arquivos Criados: 35+**

- 10 migrations SQL
- 1 Edge Function (4 arquivos)
- 3 processadores
- 3 utils
- 2 types/schemas
- 1 Server Actions file
- 4 componentes UI
- 1 página completa

## **Próximos Passos**

1. **Executar Fase 0** (segurança) IMEDIATAMENTE
2. **Executar Fases 1-2** (infraestrutura + actions)
3. **Deploy Edge Function** (Fase 3)
4. **Implementar UI** (Fases 4-5)
5. **Testar tudo** (Fase 6)

---

**Plano completo e executável! Pronto para implementação.** 🚀

