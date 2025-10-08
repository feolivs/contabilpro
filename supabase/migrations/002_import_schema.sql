-- ============================================
-- MIGRATION 002: Import Schema
-- Description: Tables for document import (XML, OFX, Payroll)
-- Author: ContabilPRO Team
-- Date: 2025-10-08
-- ============================================

-- ============================================
-- DOCUMENTS TABLE (Metadados de Upload)
-- ============================================
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Tipo de documento
    type TEXT NOT NULL CHECK (type IN ('nfe', 'nfse', 'nfce', 'ofx', 'payroll')),
    
    -- Informações do arquivo
    filename TEXT NOT NULL,
    storage_path TEXT NOT NULL UNIQUE,
    file_size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    
    -- Status do processamento
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Timestamps
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Erro e metadados
    error_message TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICES TABLE (NF-e / NFSe Normalizadas)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identificação da nota
    invoice_number TEXT NOT NULL,
    series TEXT,
    xml_key TEXT UNIQUE, -- Chave de acesso NF-e (44 dígitos)
    
    -- Tipo e datas
    type TEXT NOT NULL CHECK (type IN ('incoming', 'outgoing')),
    issue_date DATE NOT NULL,
    operation_date DATE,
    
    -- Emitente
    supplier_cnpj TEXT,
    supplier_cpf TEXT,
    supplier_name TEXT NOT NULL,
    supplier_state TEXT,
    supplier_city TEXT,
    
    -- Destinatário
    customer_cnpj TEXT,
    customer_cpf TEXT,
    customer_name TEXT,
    customer_state TEXT,
    customer_city TEXT,
    
    -- Valores
    total_amount DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    freight_amount DECIMAL(15,2) DEFAULT 0,
    insurance_amount DECIMAL(15,2) DEFAULT 0,
    other_expenses DECIMAL(15,2) DEFAULT 0,
    net_amount DECIMAL(15,2) NOT NULL,
    
    -- Impostos
    icms_base DECIMAL(15,2) DEFAULT 0,
    icms_amount DECIMAL(15,2) DEFAULT 0,
    icms_st_amount DECIMAL(15,2) DEFAULT 0,
    ipi_amount DECIMAL(15,2) DEFAULT 0,
    pis_amount DECIMAL(15,2) DEFAULT 0,
    cofins_amount DECIMAL(15,2) DEFAULT 0,
    iss_amount DECIMAL(15,2) DEFAULT 0,
    
    -- Natureza da operação
    operation_nature TEXT,
    cfop TEXT, -- Código Fiscal de Operações
    
    -- Status
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'posted', 'cancelled')),
    
    -- Observações
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INVOICE_ITEMS TABLE (Itens da Nota)
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    
    -- Produto/Serviço
    item_number INTEGER NOT NULL,
    product_code TEXT,
    product_description TEXT NOT NULL,
    
    -- Classificação fiscal
    ncm TEXT, -- Nomenclatura Comum do Mercosul
    cest TEXT, -- Código Especificador da Substituição Tributária
    cfop TEXT, -- CFOP do item
    
    -- Quantidades e valores
    quantity DECIMAL(15,4) NOT NULL,
    unit TEXT,
    unit_price DECIMAL(15,4) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    discount DECIMAL(15,2) DEFAULT 0,
    
    -- Impostos do item
    icms_base DECIMAL(15,2) DEFAULT 0,
    icms_rate DECIMAL(5,2) DEFAULT 0,
    icms_amount DECIMAL(15,2) DEFAULT 0,
    ipi_rate DECIMAL(5,2) DEFAULT 0,
    ipi_amount DECIMAL(15,2) DEFAULT 0,
    pis_rate DECIMAL(5,2) DEFAULT 0,
    pis_amount DECIMAL(15,2) DEFAULT 0,
    cofins_rate DECIMAL(5,2) DEFAULT 0,
    cofins_amount DECIMAL(15,2) DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- BANK_TRANSACTIONS TABLE (OFX)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Identificação da transação
    transaction_id TEXT NOT NULL,
    fit_id TEXT, -- Financial Institution Transaction ID
    
    -- Conta bancária
    account_id TEXT NOT NULL,
    account_type TEXT CHECK (account_type IN ('checking', 'savings', 'investment')),
    bank_code TEXT,
    branch_code TEXT,
    
    -- Datas
    transaction_date DATE NOT NULL,
    post_date DATE,
    
    -- Valores
    amount DECIMAL(15,2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('debit', 'credit')),
    balance DECIMAL(15,2),
    
    -- Descrição
    description TEXT NOT NULL,
    memo TEXT,
    payee TEXT,
    check_number TEXT,
    
    -- Reconciliação
    reconciled BOOLEAN DEFAULT false,
    reconciled_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint de unicidade
    UNIQUE(client_id, account_id, transaction_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- Documents
CREATE INDEX idx_documents_client_id ON public.documents(client_id);
CREATE INDEX idx_documents_user_id ON public.documents(user_id);
CREATE INDEX idx_documents_status ON public.documents(status);
CREATE INDEX idx_documents_type ON public.documents(type);
CREATE INDEX idx_documents_uploaded_at ON public.documents(uploaded_at DESC);

-- Invoices
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_document_id ON public.invoices(document_id);
CREATE INDEX idx_invoices_xml_key ON public.invoices(xml_key);
CREATE INDEX idx_invoices_issue_date ON public.invoices(issue_date DESC);
CREATE INDEX idx_invoices_supplier_cnpj ON public.invoices(supplier_cnpj);
CREATE INDEX idx_invoices_customer_cnpj ON public.invoices(customer_cnpj);
CREATE INDEX idx_invoices_status ON public.invoices(status);

-- Invoice Items
CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

-- Bank Transactions
CREATE INDEX idx_bank_transactions_client_id ON public.bank_transactions(client_id);
CREATE INDEX idx_bank_transactions_user_id ON public.bank_transactions(user_id);
CREATE INDEX idx_bank_transactions_document_id ON public.bank_transactions(document_id);
CREATE INDEX idx_bank_transactions_account_id ON public.bank_transactions(account_id);
CREATE INDEX idx_bank_transactions_transaction_date ON public.bank_transactions(transaction_date DESC);
CREATE INDEX idx_bank_transactions_reconciled ON public.bank_transactions(reconciled);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Documents
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own documents"
    ON public.documents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents"
    ON public.documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents"
    ON public.documents FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents"
    ON public.documents FOR DELETE
    USING (auth.uid() = user_id);

-- Invoices
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own invoices"
    ON public.invoices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
    ON public.invoices FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
    ON public.invoices FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
    ON public.invoices FOR DELETE
    USING (auth.uid() = user_id);

-- Invoice Items
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items through invoices"
    ON public.invoice_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert invoice items through invoices"
    ON public.invoice_items FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update invoice items through invoices"
    ON public.invoice_items FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete invoice items through invoices"
    ON public.invoice_items FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.invoices
            WHERE invoices.id = invoice_items.invoice_id
            AND invoices.user_id = auth.uid()
        )
    );

-- Bank Transactions
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
    ON public.bank_transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
    ON public.bank_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
    ON public.bank_transactions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
    ON public.bank_transactions FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on documents
CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on invoices
CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Update updated_at on bank_transactions
CREATE TRIGGER update_bank_transactions_updated_at
    BEFORE UPDATE ON public.bank_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.documents IS 'Stores metadata for uploaded documents (XML, OFX, payroll)';
COMMENT ON TABLE public.invoices IS 'Normalized invoice data from NF-e and NFSe';
COMMENT ON TABLE public.invoice_items IS 'Line items from invoices';
COMMENT ON TABLE public.bank_transactions IS 'Bank transactions from OFX files';

COMMENT ON COLUMN public.invoices.xml_key IS 'NF-e access key (44 digits)';
COMMENT ON COLUMN public.invoices.cfop IS 'Código Fiscal de Operações e Prestações';
COMMENT ON COLUMN public.invoice_items.ncm IS 'Nomenclatura Comum do Mercosul';
COMMENT ON COLUMN public.invoice_items.cest IS 'Código Especificador da Substituição Tributária';

