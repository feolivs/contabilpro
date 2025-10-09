-- ContabilPRO Memberships Schema
-- Phase 3: Multi-tenant with Memberships
-- Implements robust multi-tenant architecture with role-based access control

-- ============================================================================
-- MEMBERSHIPS TABLE
-- ============================================================================

-- Tabela de memberships (muitos-para-muitos entre users e clients)
CREATE TABLE IF NOT EXISTS public.memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, client_id)
);

-- Comentários para documentação
COMMENT ON TABLE public.memberships IS 'Manages user access to clients with role-based permissions';
COMMENT ON COLUMN public.memberships.role IS 'User role: owner (full access), admin (manage users), member (edit data), viewer (read-only)';

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX idx_memberships_user_id ON public.memberships(user_id);
CREATE INDEX idx_memberships_client_id ON public.memberships(client_id);
CREATE INDEX idx_memberships_user_client ON public.memberships(user_id, client_id);
CREATE INDEX idx_memberships_role ON public.memberships(role);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - MEMBERSHIPS
-- ============================================================================

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seus próprios memberships
CREATE POLICY "Users can view their own memberships"
    ON public.memberships
    FOR SELECT
    USING (auth.uid() = user_id);

-- Owners podem gerenciar memberships do cliente
CREATE POLICY "Owners can manage memberships"
    ON public.memberships
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships m
            WHERE m.client_id = memberships.client_id
            AND m.user_id = auth.uid()
            AND m.role = 'owner'
        )
    );

-- ============================================================================
-- ATUALIZAR RLS DE CLIENTS PARA USAR MEMBERSHIPS
-- ============================================================================

-- Remover policies antigas baseadas em user_id direto
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

-- Nova policy: Usuários podem ver clientes dos quais são membros
CREATE POLICY "Users can view clients they are members of"
    ON public.clients
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = clients.id
            AND memberships.user_id = auth.uid()
        )
    );

-- Nova policy: Usuários podem criar clientes (membership owner será criado automaticamente)
CREATE POLICY "Users can create clients"
    ON public.clients
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Nova policy: Owners e admins podem atualizar clientes
CREATE POLICY "Owners and admins can update clients"
    ON public.clients
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = clients.id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = clients.id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin')
        )
    );

-- Nova policy: Apenas owners podem deletar clientes
CREATE POLICY "Only owners can delete clients"
    ON public.clients
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = clients.id
            AND memberships.user_id = auth.uid()
            AND memberships.role = 'owner'
        )
    );

-- ============================================================================
-- TRIGGER PARA CRIAR MEMBERSHIP AUTOMÁTICO
-- ============================================================================

-- Função para criar membership owner ao criar cliente
CREATE OR REPLACE FUNCTION public.create_owner_membership()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.memberships (user_id, client_id, role)
    VALUES (NEW.user_id, NEW.id, 'owner');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.create_owner_membership() IS 'Automatically creates owner membership when a client is created';

-- Trigger que executa após inserção de cliente
CREATE TRIGGER on_client_created
    AFTER INSERT ON public.clients
    FOR EACH ROW
    EXECUTE FUNCTION public.create_owner_membership();

-- ============================================================================
-- TRIGGER PARA ATUALIZAR updated_at
-- ============================================================================

CREATE TRIGGER update_memberships_updated_at
    BEFORE UPDATE ON public.memberships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ATUALIZAR RLS DE TABELAS RELACIONADAS
-- ============================================================================

-- Documents: usuários podem ver documentos de clientes dos quais são membros
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can delete their own documents" ON public.documents;

CREATE POLICY "Users can view documents of their clients"
    ON public.documents
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = documents.client_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents for their clients"
    ON public.documents
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = documents.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Users can update documents of their clients"
    ON public.documents
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = documents.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin', 'member')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = documents.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Users can delete documents of their clients"
    ON public.documents
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = documents.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- INVOICES RLS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

CREATE POLICY "Users can view invoices of their clients"
    ON public.invoices
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = invoices.client_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert invoices"
    ON public.invoices
    FOR INSERT
    WITH CHECK (true); -- Inserções via Edge Functions (com RLS ativo)

CREATE POLICY "Users can update invoices of their clients"
    ON public.invoices
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = invoices.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Users can delete invoices of their clients"
    ON public.invoices
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = invoices.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- BANK TRANSACTIONS RLS
-- ============================================================================

DROP POLICY IF EXISTS "Users can view their own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can insert their own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can update their own bank transactions" ON public.bank_transactions;
DROP POLICY IF EXISTS "Users can delete their own bank transactions" ON public.bank_transactions;

CREATE POLICY "Users can view bank transactions of their clients"
    ON public.bank_transactions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = bank_transactions.client_id
            AND memberships.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert bank transactions"
    ON public.bank_transactions
    FOR INSERT
    WITH CHECK (true); -- Inserções via Edge Functions (com RLS ativo)

CREATE POLICY "Users can update bank transactions of their clients"
    ON public.bank_transactions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = bank_transactions.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin', 'member')
        )
    );

CREATE POLICY "Users can delete bank transactions of their clients"
    ON public.bank_transactions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = bank_transactions.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin')
        )
    );

