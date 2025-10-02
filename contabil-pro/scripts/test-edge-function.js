#!/usr/bin/env node

/**
 * Script para testar a Edge Function process-document
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEdgeFunction() {
  console.log('🧪 Testando Edge Function...\n');

  // Pegar o documento mais recente
  const { data: doc, error: docError } = await supabase
    .from('documents')
    .select('id, name, path, mime_type')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (docError || !doc) {
    console.error('❌ Erro ao buscar documento:', docError);
    return;
  }

  console.log('📄 Documento selecionado:');
  console.log(`   ID: ${doc.id}`);
  console.log(`   Nome: ${doc.name}`);
  console.log(`   Path: ${doc.path}`);
  console.log(`   MIME: ${doc.mime_type}\n`);

  // Invocar Edge Function
  console.log('🚀 Invocando Edge Function...\n');

  const { data, error } = await supabase.functions.invoke('process-document', {
    body: {
      document_id: doc.id,
      storage_path: doc.path,
      mime_type: doc.mime_type,
    },
  });

  if (error) {
    console.error('❌ Erro na Edge Function:');
    console.error('   Status:', error.context?.status);
    console.error('   Message:', error.message);
    console.error('   Context:', JSON.stringify(error.context, null, 2));
    
    // Tentar ler o body do erro
    if (error.context?.body) {
      try {
        const errorBody = await error.context.body.text();
        console.error('   Body:', errorBody);
      } catch (e) {
        console.error('   (Não foi possível ler o body do erro)');
      }
    }
    return;
  }

  console.log('✅ Edge Function executada com sucesso!');
  console.log('   Resposta:', JSON.stringify(data, null, 2));

  // Verificar se o documento foi atualizado
  const { data: updatedDoc } = await supabase
    .from('documents')
    .select('processed, ocr_confidence, type')
    .eq('id', doc.id)
    .single();

  console.log('\n📊 Status do documento após processamento:');
  console.log(`   Processado: ${updatedDoc?.processed ? '✅' : '❌'}`);
  console.log(`   Confiança OCR: ${updatedDoc?.ocr_confidence || 'N/A'}`);
  console.log(`   Tipo: ${updatedDoc?.type || 'N/A'}`);
}

testEdgeFunction().catch(console.error);

