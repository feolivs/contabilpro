#!/usr/bin/env node

/**
 * Script para configurar o banco de dados do ContabilPRO
 * Aplica migrations e cria dados de teste
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function setupDatabase() {
  console.log('🚀 Configurando banco de dados...')
  
  try {
    // 1. Criar tabela tenants
    console.log('📝 Criando tabela tenants...')
    const { error: tenantsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(100) UNIQUE NOT NULL,
          document VARCHAR(20) UNIQUE NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(20),
          address TEXT,
          settings JSONB DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
        CREATE INDEX IF NOT EXISTS idx_tenants_document ON tenants(document);
        CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
      `
    })
    
    if (tenantsError) {
      console.error('❌ Erro ao criar tabela tenants:', tenantsError)
    } else {
      console.log('✅ Tabela tenants criada')
    }

    // 2. Criar tabela users
    console.log('📝 Criando tabela users...')
    const { error: usersError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255),
          avatar_url TEXT,
          settings JSONB DEFAULT '{}',
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
      `
    })
    
    if (usersError) {
      console.error('❌ Erro ao criar tabela users:', usersError)
    } else {
      console.log('✅ Tabela users criada')
    }

    // 3. Criar tabela user_tenants
    console.log('📝 Criando tabela user_tenants...')
    const { error: userTenantsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_tenants (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
          role VARCHAR(50) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, tenant_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_user_tenants_user_id ON user_tenants(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_tenants_tenant_id ON user_tenants(tenant_id);
        CREATE INDEX IF NOT EXISTS idx_user_tenants_role ON user_tenants(role);
        CREATE INDEX IF NOT EXISTS idx_user_tenants_status ON user_tenants(status);
      `
    })
    
    if (userTenantsError) {
      console.error('❌ Erro ao criar tabela user_tenants:', userTenantsError)
    } else {
      console.log('✅ Tabela user_tenants criada')
    }

    // 4. Habilitar RLS
    console.log('🔒 Habilitando RLS...')
    const { error: rlsError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
      `
    })
    
    if (rlsError) {
      console.error('❌ Erro ao habilitar RLS:', rlsError)
    } else {
      console.log('✅ RLS habilitado')
    }

    // 5. Criar policies básicas
    console.log('🔐 Criando policies básicas...')
    const { error: policiesError } = await supabase.rpc('exec', {
      sql: `
        -- Policy para tenants: usuários só veem tenants onde têm membership
        DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
        CREATE POLICY "Users can view their tenants" ON tenants
          FOR SELECT USING (
            id IN (
              SELECT tenant_id FROM user_tenants 
              WHERE user_id = auth.uid() AND status = 'active'
            )
          );

        -- Policy para users: usuários só veem outros usuários do mesmo tenant
        DROP POLICY IF EXISTS "Users can view users in their tenants" ON users;
        CREATE POLICY "Users can view users in their tenants" ON users
          FOR SELECT USING (
            id IN (
              SELECT ut1.user_id FROM user_tenants ut1
              WHERE ut1.tenant_id IN (
                SELECT ut2.tenant_id FROM user_tenants ut2
                WHERE ut2.user_id = auth.uid() AND ut2.status = 'active'
              )
            )
          );

        -- Policy para user_tenants: usuários só veem memberships dos seus tenants
        DROP POLICY IF EXISTS "Users can view memberships in their tenants" ON user_tenants;
        CREATE POLICY "Users can view memberships in their tenants" ON user_tenants
          FOR SELECT USING (
            tenant_id IN (
              SELECT tenant_id FROM user_tenants 
              WHERE user_id = auth.uid() AND status = 'active'
            )
          );
      `
    })
    
    if (policiesError) {
      console.error('❌ Erro ao criar policies:', policiesError)
    } else {
      console.log('✅ Policies criadas')
    }

    console.log('\n🎉 Banco de dados configurado com sucesso!')
    console.log('📋 Próximo passo: executar create-test-user.js')
    
  } catch (error) {
    console.error('❌ Erro ao configurar banco:', error)
    process.exit(1)
  }
}

// Executar script
setupDatabase()
