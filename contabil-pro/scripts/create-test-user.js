#!/usr/bin/env node

/**
 * Script para criar usuário de teste no ContabilPRO
 * 
 * Cria:
 * 1. Usuário no Supabase Auth (teste@contabilpro.com / 123456)
 * 2. Tenant de teste (se não existir)
 * 3. Associação user_tenants
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!')
  console.error('Verifique NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  console.log('🚀 Criando usuário de teste...')
  
  const testEmail = 'teste@contabilpro.com'
  const testPassword = '123456'
  const testName = 'Usuário Teste'
  
  try {
    // 1. Criar usuário no Supabase Auth
    console.log('📧 Criando usuário no Supabase Auth...')
    let { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        name: testName
      }
    })

    if (authError) {
      if (authError.code === 'email_exists' || authError.message.includes('already registered')) {
        console.log('⚠️  Usuário já existe no Supabase Auth, buscando...')

        // Buscar usuário existente
        const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) {
          throw listError
        }

        const existingUser = existingUsers.users.find(u => u.email === testEmail)

        if (!existingUser) {
          throw new Error('Usuário existe mas não foi encontrado na listagem')
        }

        // Simular estrutura de resposta
        authUser = { user: existingUser }
        console.log('✅ Usuário encontrado no Supabase Auth:', existingUser.id)
      } else {
        throw authError
      }
    } else {
      console.log('✅ Usuário criado no Supabase Auth:', authUser.user.id)
    }

    const userId = authUser.user.id

    // 2. Verificar/criar tenant de teste
    console.log('🏢 Verificando tenant de teste...')
    
    const tenantData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'ContabilPRO Teste',
      slug: 'contabil-pro-teste',
      document: '12345678000195',
      email: 'teste@contabilpro.com',
      phone: '(11) 99999-9999',
      status: 'active'
    }

    const { data: existingTenant, error: tenantSelectError } = await supabase
      .from('tenants')
      .select('*')
      .eq('slug', tenantData.slug)
      .single()

    let tenant
    if (tenantSelectError && tenantSelectError.code === 'PGRST116') {
      // Tenant não existe, criar
      console.log('📝 Criando tenant de teste...')
      const { data: newTenant, error: tenantCreateError } = await supabase
        .from('tenants')
        .insert(tenantData)
        .select()
        .single()

      if (tenantCreateError) {
        throw tenantCreateError
      }
      
      tenant = newTenant
      console.log('✅ Tenant criado:', tenant.slug)
    } else if (tenantSelectError) {
      throw tenantSelectError
    } else {
      tenant = existingTenant
      console.log('✅ Tenant já existe:', tenant.slug)
    }

    // 3. Verificar/criar usuário na tabela users
    console.log('👤 Verificando usuário na tabela users...')
    
    const { data: existingUser, error: userSelectError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userSelectError && userSelectError.code === 'PGRST116') {
      // Usuário não existe na tabela, criar
      console.log('📝 Criando usuário na tabela users...')
      const { error: userCreateError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: testEmail,
          name: testName
        })

      if (userCreateError) {
        throw userCreateError
      }
      
      console.log('✅ Usuário criado na tabela users')
    } else if (userSelectError) {
      throw userSelectError
    } else {
      console.log('✅ Usuário já existe na tabela users')
    }

    // 4. Verificar/criar associação user_tenants
    console.log('🔗 Verificando associação user_tenants...')
    
    const { data: existingAssociation, error: associationSelectError } = await supabase
      .from('user_tenants')
      .select('*')
      .eq('user_id', userId)
      .eq('tenant_id', tenant.id)
      .single()

    if (associationSelectError && associationSelectError.code === 'PGRST116') {
      // Associação não existe, criar
      console.log('📝 Criando associação user_tenants...')
      const { error: associationCreateError } = await supabase
        .from('user_tenants')
        .insert({
          user_id: userId,
          tenant_id: tenant.id,
          role: 'owner',
          status: 'active',
          joined_at: new Date().toISOString()
        })

      if (associationCreateError) {
        throw associationCreateError
      }
      
      console.log('✅ Associação criada')
    } else if (associationSelectError) {
      throw associationSelectError
    } else {
      console.log('✅ Associação já existe')
    }

    // 5. Resumo final
    console.log('\n🎉 Usuário de teste criado com sucesso!')
    console.log('📋 Detalhes:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Senha: ${testPassword}`)
    console.log(`   Nome: ${testName}`)
    console.log(`   User ID: ${userId}`)
    console.log(`   Tenant: ${tenant.name} (${tenant.slug})`)
    console.log(`   URL de login: http://localhost:3002/login`)
    console.log(`   URL pós-login: http://localhost:3002/t/${tenant.slug}/dashboard`)
    
    console.log('\n🧪 Para testar:')
    console.log('1. Acesse http://localhost:3002/login')
    console.log(`2. Digite: ${testEmail}`)
    console.log(`3. Digite: ${testPassword}`)
    console.log('4. Clique em "Entrar"')
    console.log(`5. Deve redirecionar para: /t/${tenant.slug}/dashboard`)

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error)
    process.exit(1)
  }
}

// Executar script
createTestUser()
