-- Habilitar RLS em todas as tabelas expostas
-- IMPORTANTE: RLS deve estar ativo em TODAS as tabelas multi-tenant

-- Funcao helper para obter tenant_id do JWT
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb->>'tenant_id')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funcao para definir claim (usada pelos helpers de auth)
CREATE OR REPLACE FUNCTION set_claim(claim text, value text)
RETURNS text AS $$
BEGIN
  PERFORM set_config('request.jwt.claims', 
    jsonb_set(
      COALESCE(current_setting('request.jwt.claims', true)::jsonb, '{}'::jsonb),
      array[claim],
      to_jsonb(value)
    )::text,
    true
  );
  RETURN value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar RLS em todas as tabelas multi-tenant
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_obligations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
