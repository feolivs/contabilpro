#!/usr/bin/env node

/**
 * Script para testar download do Storage
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testStorageDownload() {
  console.log('🧪 Testando download do Storage...\n');

  const path = 'other/20251002/18d977d4-Recibo_de_Pagamento_202406.pdf';

  console.log(`📥 Tentando baixar: ${path}\n`);

  // Tentar download
  const { data, error } = await supabase.storage
    .from('documentos')
    .download(path);

  if (error) {
    console.error('❌ Erro ao baixar arquivo:');
    console.error('   Message:', error.message);
    console.error('   Details:', JSON.stringify(error, null, 2));
    return;
  }

  console.log('✅ Arquivo baixado com sucesso!');
  console.log(`   Tamanho: ${data.size} bytes`);
  console.log(`   Tipo: ${data.type}`);

  // Tentar gerar URL assinada
  console.log('\n🔗 Gerando URL assinada...');
  
  const { data: urlData, error: urlError } = await supabase.storage
    .from('documentos')
    .createSignedUrl(path, 60);

  if (urlError) {
    console.error('❌ Erro ao gerar URL:', urlError.message);
    return;
  }

  console.log('✅ URL gerada:', urlData.signedUrl);
}

testStorageDownload().catch(console.error);

