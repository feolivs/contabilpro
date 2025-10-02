// ============================================
// EDGE FUNCTION: process-document
// ============================================
// Processa documentos com OCR, classificação e extração de dados
// usando GPT-4o-mini para custo otimizado

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';
import type { ProcessDocumentRequest, ProcessDocumentResponse } from './utils/types.ts';
import {
  downloadFile,
  updateDocument,
  createAIInsight,
  logEvent,
  detectFileType,
} from './utils/supabase.ts';
import { processImage } from './processors/image-processor.ts';
import { processPDF } from './processors/pdf-processor.ts';
import { processPDFWithUnPDF } from './processors/pdf-processor-unpdf.ts';
import { processXML } from './processors/xml-processor.ts';

// ============================================
// Handler Principal
// ============================================
serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Validar request
    const payload: ProcessDocumentRequest = await req.json();

    if (!payload.document_id || !payload.storage_path) {
      throw new Error('Campos obrigatórios: document_id, storage_path');
    }

    console.log('🚀 Iniciando processamento:', payload.document_id);

    // 2. Registrar início do processamento
    await logEvent({
      document_id: payload.document_id,
      event_type: 'process_start',
      metadata: {
        mime_type: payload.mime_type,
        storage_path: payload.storage_path,
      },
    });

    // 3. Baixar arquivo do Storage
    console.log('📥 Baixando arquivo do Storage...');
    const fileData = await downloadFile(payload.storage_path);
    console.log(`✅ Arquivo baixado: ${fileData.length} bytes`);

    // 4. Detectar tipo de arquivo
    const fileType = detectFileType(payload.mime_type);
    console.log(`🔍 Tipo de arquivo detectado: ${fileType}`);

    // 5. Processar arquivo de acordo com o tipo
    let result;

    switch (fileType) {
      case 'image':
        result = await processImage(fileData, payload.mime_type);
        break;

      case 'pdf':
        // Usar UnPDF para melhor extração de texto
        console.log('🚀 Usando UnPDF para processamento...');
        result = await processPDFWithUnPDF(fileData, payload.mime_type);
        break;

      case 'xml':
        result = await processXML(fileData);
        break;

      default:
        throw new Error(`Tipo de arquivo não suportado: ${payload.mime_type}`);
    }

    console.log('✅ Processamento concluído');
    console.log(`   - Tipo: ${result.type}`);
    console.log(`   - Confiança: ${result.confidence}`);
    console.log(`   - Texto: ${result.text.length} caracteres`);
    console.log(`   - Dados extraídos: ${Object.keys(result.extracted_data).length} campos`);

    // 6. Atualizar documento no banco
    console.log('💾 Atualizando documento no banco...');
    await updateDocument(payload.document_id, {
      ocr_text: result.text,
      ocr_confidence: result.confidence,
      type: result.type,
      processed: true,
      processed_at: new Date().toISOString(),
      metadata: result.extracted_data,
    });

    // 7. Criar AI Insight
    console.log('🤖 Criando AI Insight...');

    // Determinar status baseado na confiança
    let status: 'pending' | 'awaiting_confirmation' | 'needs_review';
    if (result.confidence >= 0.85) {
      status = 'awaiting_confirmation';
    } else if (result.confidence >= 0.6) {
      status = 'pending';
    } else {
      status = 'needs_review';
    }

    await createAIInsight({
      type: 'classification',
      confidence: result.confidence,
      data: {
        document_id: payload.document_id,
        document_type: result.type,
        extracted_data: result.extracted_data,
      },
      status,
    });

    // 8. Registrar conclusão do processamento
    await logEvent({
      document_id: payload.document_id,
      event_type: 'process_complete',
      metadata: {
        type: result.type,
        confidence: result.confidence,
        text_length: result.text.length,
        fields_extracted: Object.keys(result.extracted_data).length,
      },
    });

    // 9. Retornar resposta
    const response: ProcessDocumentResponse = {
      success: true,
      document_id: payload.document_id,
      processed: true,
      ocr_text: result.text,
      ocr_confidence: result.confidence,
      type: result.type,
      extracted_data: result.extracted_data,
    };

    console.log('✅ Processamento completo!');

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Erro no processamento:', error);

    // Tentar registrar erro (se temos os dados necessários)
    try {
      const payload: ProcessDocumentRequest = await req.json();
      await logEvent({
        document_id: payload.document_id,
        event_type: 'process_error',
        metadata: {
          error: error.message,
          stack: error.stack,
        },
      });
    } catch (logError) {
      console.error('Erro ao registrar log de erro:', logError);
    }

    const response: ProcessDocumentResponse = {
      success: false,
      document_id: '',
      processed: false,
      error: error.message,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

