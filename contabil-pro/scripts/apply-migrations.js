#!/usr/bin/env node

/**
 * Script para aplicar migrations no Supabase
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
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

async function applyMigrations() {
  console.log('🚀 Aplicando migrations...')
  
  const migrationsDir = path.join(__dirname, '..', 'infra', 'migrations')
  const policiesDir = path.join(__dirname, '..', 'infra', 'policies')
  
  try {
    // 1. Aplicar migrations (estrutura das tabelas)
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    console.log(`📋 Encontradas ${migrationFiles.length} migrations`)
    
    for (const file of migrationFiles) {
      console.log(`📝 Aplicando migration: ${file}`)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      
      const { error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.error(`❌ Erro na migration ${file}:`, error)
        // Continuar com as próximas migrations
      } else {
        console.log(`✅ Migration ${file} aplicada`)
      }
    }
    
    // 2. Aplicar policies (RLS)
    const policyFiles = fs.readdirSync(policiesDir)
      .filter(file => file.endsWith('.sql'))
      .sort()
    
    console.log(`🔒 Encontradas ${policyFiles.length} policies`)
    
    for (const file of policyFiles) {
      console.log(`🔐 Aplicando policy: ${file}`)
      const sql = fs.readFileSync(path.join(policiesDir, file), 'utf8')
      
      const { error } = await supabase.rpc('exec_sql', { sql })
      
      if (error) {
        console.error(`❌ Erro na policy ${file}:`, error)
        // Continuar com as próximas policies
      } else {
        console.log(`✅ Policy ${file} aplicada`)
      }
    }
    
    console.log('\n🎉 Migrations e policies aplicadas!')
    console.log('📋 Próximo passo: executar create-test-user.js')
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migrations:', error)
    process.exit(1)
  }
}

// Executar script
applyMigrations()
