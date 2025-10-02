#!/usr/bin/env node

/**
 * Script para aumentar o limite de storage do bucket 'documentos' para 100MB
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Certifique-se de que .env.local contém:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function updateStorageLimit() {
  console.log('🚀 Atualizando limite de storage...');

  try {
    // Executar UPDATE via SQL direto
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE storage.buckets 
        SET file_size_limit = 104857600 
        WHERE id = 'documentos';
        
        SELECT 
          id, 
          name, 
          file_size_limit,
          file_size_limit / (1024 * 1024) as limit_mb
        FROM storage.buckets 
        WHERE id = 'documentos';
      `
    });

    if (error) {
      // Se exec_sql não existir, tentar via query direta
      console.log('⚠️ Tentando método alternativo...');
      
      const { error: updateError } = await supabase
        .from('buckets')
        .update({ file_size_limit: 104857600 })
        .eq('id', 'documentos');

      if (updateError) {
        throw updateError;
      }

      // Verificar resultado
      const { data: bucket, error: selectError } = await supabase
        .from('buckets')
        .select('id, name, file_size_limit')
        .eq('id', 'documentos')
        .single();

      if (selectError) {
        throw selectError;
      }

      console.log('✅ Limite atualizado com sucesso!');
      console.log(`   Bucket: ${bucket.name}`);
      console.log(`   Novo limite: ${(bucket.file_size_limit / (1024 * 1024)).toFixed(0)}MB`);
      return;
    }

    console.log('✅ Limite atualizado com sucesso!');
    console.log('   Resultado:', data);
  } catch (error) {
    console.error('❌ Erro ao atualizar limite:', error.message);
    process.exit(1);
  }
}

updateStorageLimit();

