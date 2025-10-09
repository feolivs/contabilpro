-- ContabilPRO Payroll Schema
-- Phase 3: Payroll Data Import and Processing
-- Implements payroll summaries and optional detailed entries

-- ============================================================================
-- PAYROLL SUMMARIES TABLE
-- ============================================================================

-- Tabela de resumos mensais de folha de pagamento
CREATE TABLE IF NOT EXISTS public.payroll_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Competência (mês/ano de referência)
    reference_month INTEGER NOT NULL CHECK (reference_month BETWEEN 1 AND 13),
    reference_year INTEGER NOT NULL CHECK (reference_year >= 2020 AND reference_year <= 2030),
    
    -- Dados agregados
    total_employees INTEGER NOT NULL CHECK (total_employees >= 0),
    total_gross_salary DECIMAL(15,2) NOT NULL CHECK (total_gross_salary >= 0),
    total_inss_employee DECIMAL(15,2) DEFAULT 0 CHECK (total_inss_employee >= 0),
    total_inss_employer DECIMAL(15,2) DEFAULT 0 CHECK (total_inss_employer >= 0),
    total_fgts DECIMAL(15,2) DEFAULT 0 CHECK (total_fgts >= 0),
    total_irrf DECIMAL(15,2) DEFAULT 0 CHECK (total_irrf >= 0),
    total_other_discounts DECIMAL(15,2) DEFAULT 0 CHECK (total_other_discounts >= 0),
    total_net_salary DECIMAL(15,2) NOT NULL CHECK (total_net_salary >= 0),
    
    -- Configurações (parametrizáveis por cliente)
    inss_employer_enabled BOOLEAN DEFAULT true,
    fgts_enabled BOOLEAN DEFAULT true,
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: apenas um resumo por cliente/competência
    UNIQUE(client_id, reference_month, reference_year)
);

-- Comentários para documentação
COMMENT ON TABLE public.payroll_summaries IS 'Monthly aggregated payroll data for clients';
COMMENT ON COLUMN public.payroll_summaries.reference_month IS 'Reference month (1-12 for regular months, 13 for 13th salary)';
COMMENT ON COLUMN public.payroll_summaries.total_inss_employee IS 'Total INSS employee contribution (deducted from salary)';
COMMENT ON COLUMN public.payroll_summaries.total_inss_employer IS 'Total INSS employer contribution (company expense)';
COMMENT ON COLUMN public.payroll_summaries.total_fgts IS 'Total FGTS (8% of gross salary, company expense)';
COMMENT ON COLUMN public.payroll_summaries.total_irrf IS 'Total IRRF (income tax withheld)';
COMMENT ON COLUMN public.payroll_summaries.inss_employer_enabled IS 'Whether INSS employer contribution is enabled for this client';
COMMENT ON COLUMN public.payroll_summaries.fgts_enabled IS 'Whether FGTS is enabled for this client';

-- ============================================================================
-- PAYROLL ENTRIES TABLE (OPCIONAL - Dados individuais)
-- ============================================================================

-- Tabela de lançamentos individuais de funcionários (opcional)
CREATE TABLE IF NOT EXISTS public.payroll_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_summary_id UUID NOT NULL REFERENCES public.payroll_summaries(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Dados do funcionário (anonimizados)
    employee_code TEXT, -- Código/matrícula do funcionário
    employee_name TEXT, -- Nome (será sanitizado em logs)
    
    -- Valores individuais
    gross_salary DECIMAL(15,2) NOT NULL CHECK (gross_salary >= 0),
    inss_employee DECIMAL(15,2) DEFAULT 0 CHECK (inss_employee >= 0),
    inss_employer DECIMAL(15,2) DEFAULT 0 CHECK (inss_employer >= 0),
    fgts DECIMAL(15,2) DEFAULT 0 CHECK (fgts >= 0),
    irrf DECIMAL(15,2) DEFAULT 0 CHECK (irrf >= 0),
    other_discounts DECIMAL(15,2) DEFAULT 0 CHECK (other_discounts >= 0),
    net_salary DECIMAL(15,2) NOT NULL CHECK (net_salary >= 0),
    
    -- Metadados
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentários para documentação
COMMENT ON TABLE public.payroll_entries IS 'Individual employee payroll entries (optional, for detailed analysis)';
COMMENT ON COLUMN public.payroll_entries.employee_code IS 'Employee code/registration number (anonymized)';
COMMENT ON COLUMN public.payroll_entries.employee_name IS 'Employee name (will be sanitized in logs for LGPD compliance)';

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Payroll Summaries
CREATE INDEX idx_payroll_summaries_client_id ON public.payroll_summaries(client_id);
CREATE INDEX idx_payroll_summaries_user_id ON public.payroll_summaries(user_id);
CREATE INDEX idx_payroll_summaries_document_id ON public.payroll_summaries(document_id);
CREATE INDEX idx_payroll_summaries_reference ON public.payroll_summaries(reference_year DESC, reference_month DESC);
CREATE INDEX idx_payroll_summaries_client_reference ON public.payroll_summaries(client_id, reference_year DESC, reference_month DESC);

-- Payroll Entries
CREATE INDEX idx_payroll_entries_summary_id ON public.payroll_entries(payroll_summary_id);
CREATE INDEX idx_payroll_entries_client_id ON public.payroll_entries(client_id);
CREATE INDEX idx_payroll_entries_user_id ON public.payroll_entries(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - PAYROLL SUMMARIES
-- ============================================================================

ALTER TABLE public.payroll_summaries ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver folhas de clientes dos quais são membros
CREATE POLICY "Users can view payroll summaries of their clients"
    ON public.payroll_summaries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = payroll_summaries.client_id
            AND memberships.user_id = auth.uid()
        )
    );

-- Sistema pode inserir folhas (via Edge Functions)
CREATE POLICY "System can insert payroll summaries"
    ON public.payroll_summaries
    FOR INSERT
    WITH CHECK (true);

-- Owners e admins podem atualizar folhas
CREATE POLICY "Owners and admins can update payroll summaries"
    ON public.payroll_summaries
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = payroll_summaries.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin')
        )
    );

-- Owners e admins podem deletar folhas
CREATE POLICY "Owners and admins can delete payroll summaries"
    ON public.payroll_summaries
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = payroll_summaries.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - PAYROLL ENTRIES
-- ============================================================================

ALTER TABLE public.payroll_entries ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver entradas de folhas de clientes dos quais são membros
CREATE POLICY "Users can view payroll entries of their clients"
    ON public.payroll_entries
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = payroll_entries.client_id
            AND memberships.user_id = auth.uid()
        )
    );

-- Sistema pode inserir entradas (via Edge Functions)
CREATE POLICY "System can insert payroll entries"
    ON public.payroll_entries
    FOR INSERT
    WITH CHECK (true);

-- Owners e admins podem atualizar entradas
CREATE POLICY "Owners and admins can update payroll entries"
    ON public.payroll_entries
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = payroll_entries.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin')
        )
    );

-- Owners e admins podem deletar entradas
CREATE POLICY "Owners and admins can delete payroll entries"
    ON public.payroll_entries
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.memberships
            WHERE memberships.client_id = payroll_entries.client_id
            AND memberships.user_id = auth.uid()
            AND memberships.role IN ('owner', 'admin')
        )
    );

-- ============================================================================
-- TRIGGERS PARA ATUALIZAR updated_at
-- ============================================================================

CREATE TRIGGER update_payroll_summaries_updated_at
    BEFORE UPDATE ON public.payroll_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payroll_entries_updated_at
    BEFORE UPDATE ON public.payroll_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS PARA ANÁLISE
-- ============================================================================

-- View: Evolução da folha por cliente
CREATE OR REPLACE VIEW public.payroll_evolution AS
SELECT 
    client_id,
    reference_year,
    reference_month,
    total_employees,
    total_gross_salary,
    total_net_salary,
    total_inss_employee + total_inss_employer + total_fgts + total_irrf AS total_encargos,
    ROUND((total_inss_employee + total_inss_employer + total_fgts) / NULLIF(total_gross_salary, 0) * 100, 2) AS encargos_percentage
FROM public.payroll_summaries
ORDER BY client_id, reference_year DESC, reference_month DESC;

COMMENT ON VIEW public.payroll_evolution IS 'Payroll evolution by client with calculated encargos percentage';

-- View: Média de salários por cliente
CREATE OR REPLACE VIEW public.payroll_averages AS
SELECT 
    client_id,
    COUNT(*) as months_count,
    AVG(total_employees) as avg_employees,
    AVG(total_gross_salary) as avg_gross_salary,
    AVG(total_net_salary) as avg_net_salary,
    AVG(total_gross_salary / NULLIF(total_employees, 0)) as avg_salary_per_employee
FROM public.payroll_summaries
GROUP BY client_id;

COMMENT ON VIEW public.payroll_averages IS 'Average payroll metrics by client';

