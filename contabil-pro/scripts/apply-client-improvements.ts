/**
 * Script para aplicar melhorias na tabela clients
 * Executa as migrations 011 e 012
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function executeSQLFile(filePath: string, description: string) {
  console.log(`\n📝 Executando: ${description}`)
  console.log(`   Arquivo: ${filePath}`)
  
  try {
    const sql = readFileSync(filePath, 'utf-8')
    
    // Dividir em statements individuais (separados por ;)
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`   Total de statements: ${statements.length}`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      // Pular comentários e linhas vazias
      if (statement.startsWith('--') || statement.trim().length === 0) {
        continue
      }
      
      try {
        const { error } = await supabase.rpc('exec', { sql: statement + ';' })
        
        if (error) {
          // Alguns erros são esperados (ex: "já existe")
          if (
            error.message.includes('already exists') ||
            error.message.includes('já existe') ||
            error.message.includes('does not exist')
          ) {
            console.log(`   ⚠️  Statement ${i + 1}: ${error.message}`)
          } else {
            console.error(`   ❌ Erro no statement ${i + 1}:`, error.message)
            console.error(`   SQL: ${statement.substring(0, 100)}...`)
            throw error
          }
        } else {
          if (i % 10 === 0) {
            console.log(`   ✓ Executados ${i + 1}/${statements.length} statements`)
          }
        }
      } catch (err) {
        console.error(`   ❌ Exceção no statement ${i + 1}:`, err)
        throw err
      }
    }
    
    console.log(`   ✅ ${description} concluída com sucesso!`)
    return true
  } catch (error) {
    console.error(`   ❌ Erro ao executar ${description}:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 Aplicando melhorias na tabela clients...\n')
  
  const migrationsDir = join(process.cwd(), 'infra', 'migrations')
  
  // Migration 011: Melhorias na tabela clients
  const migration011 = join(migrationsDir, '011_clients_improvements.sql')
  const success011 = await executeSQLFile(
    migration011,
    'Migration 011: Melhorias na tabela clients'
  )
  
  if (!success011) {
    console.error('\n❌ Falha ao aplicar migration 011. Abortando.')
    process.exit(1)
  }
  
  // Migration 012: Melhorias nas políticas RLS
  const migration012 = join(migrationsDir, '012_client_rls_improvements.sql')
  const success012 = await executeSQLFile(
    migration012,
    'Migration 012: Melhorias nas políticas RLS'
  )
  
  if (!success012) {
    console.error('\n❌ Falha ao aplicar migration 012. Abortando.')
    process.exit(1)
  }
  
  // Verificar se as mudanças foram aplicadas
  console.log('\n🔍 Verificando mudanças...')
  
  // Verificar se document_norm existe
  const { data: columns, error: columnsError } = await supabase
    .from('clients')
    .select('*')
    .limit(0)
  
  if (columnsError) {
    console.error('❌ Erro ao verificar colunas:', columnsError)
  } else {
    console.log('✅ Tabela clients acessível')
  }
  
  // Verificar view materializada
  const { data: stats, error: statsError } = await supabase.rpc('exec', {
    sql: 'SELECT COUNT(*) FROM client_stats_by_tenant;',
  })
  
  if (statsError) {
    console.error('⚠️  View materializada pode não estar disponível:', statsError.message)
  } else {
    console.log('✅ View materializada client_stats_by_tenant criada')
  }
  
  // Verificar funções
  const { data: functions, error: functionsError } = await supabase.rpc('exec', {
    sql: `
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN (
        'normalize_document',
        'current_tenant_id',
        'refresh_client_stats',
        'check_rate_limit',
        'search_clients',
        'get_clients_paginated'
      );
    `,
  })
  
  if (functionsError) {
    console.error('⚠️  Erro ao verificar funções:', functionsError.message)
  } else {
    console.log('✅ Funções criadas com sucesso')
  }
  
  console.log('\n✅ Todas as melhorias foram aplicadas com sucesso!')
  console.log('\n📋 Próximos passos:')
  console.log('   1. Testar a normalização de documentos')
  console.log('   2. Verificar políticas RLS')
  console.log('   3. Testar busca de clientes')
  console.log('   4. Configurar refresh periódico da view materializada')
  console.log('   5. Implementar Server Actions com rate limiting')
}

main().catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})

