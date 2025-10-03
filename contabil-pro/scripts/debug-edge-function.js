#!/usr/bin/env node

/**
 * Script para debugar a Edge Function com logs detalhados
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugEdgeFunction() {
  console.log('🔍 DEBUG: Edge Function process-document\n')

  // 1. Verificar se a função existe
  console.log('1️⃣ Verificando se a função existe...')
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: true }),
    })

    console.log(`   Status: ${response.status} ${response.statusText}`)

    const text = await response.text()
    console.log(`   Response: ${text}\n`)
  } catch (error) {
    console.error('   ❌ Erro ao chamar função:', error.message, '\n')
  }

  // 2. Pegar documento mais recente
  console.log('2️⃣ Buscando documento mais recente...')
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, name, path, mime_type, tenant_id')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (docError || !doc) {
    console.error('   ❌ Erro ao buscar documento:', docError)
    return
  }

  console.log(`   ✅ Documento: ${doc.name}`)
  console.log(`   ID: ${doc.id}`)
  console.log(`   Path: ${doc.path}`)
  console.log(`   Tenant: ${doc.tenant_id || 'NULL'}\n`)

  // 3. Verificar se arquivo existe no Storage
  console.log('3️⃣ Verificando arquivo no Storage...')
  const { data: fileData, error: fileError } = await supabase.storage
    .from('documentos')
    .download(doc.path)

  if (fileError) {
    console.error('   ❌ Erro ao baixar arquivo:', fileError.message)
    console.error('   Detalhes:', JSON.stringify(fileError, null, 2), '\n')
    return
  }

  console.log(`   ✅ Arquivo encontrado: ${fileData.size} bytes\n`)

  // 4. Testar Edge Function com dados reais
  console.log('4️⃣ Invocando Edge Function com dados reais...')

  const payload = {
    document_id: doc.id,
    storage_path: doc.path,
    mime_type: doc.mime_type,
  }

  console.log('   Payload:', JSON.stringify(payload, null, 2))

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/process-document`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    console.log(`\n   Status: ${response.status} ${response.statusText}`)

    const responseText = await response.text()
    console.log(`   Response Body:\n${responseText}\n`)

    // Tentar parsear como JSON
    try {
      const json = JSON.parse(responseText)
      console.log('   Parsed JSON:', JSON.stringify(json, null, 2))
    } catch (e) {
      console.log('   (Resposta não é JSON válido)')
    }

    // Mostrar headers
    console.log('\n   Response Headers:')
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`)
    })
  } catch (error) {
    console.error('\n   ❌ Erro na requisição:', error.message)
    console.error('   Stack:', error.stack)
  }

  // 5. Verificar variáveis de ambiente da Edge Function
  console.log('\n5️⃣ Verificando variáveis de ambiente...')
  console.log(`   SUPABASE_URL: ${supabaseUrl}`)
  console.log(`   SERVICE_KEY: ${supabaseServiceKey ? '✅ Configurada' : '❌ Não configurada'}`)
  console.log(
    `   OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ Não configurada'}`
  )
}

debugEdgeFunction().catch(console.error)
