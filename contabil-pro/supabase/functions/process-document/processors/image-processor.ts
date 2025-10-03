// ============================================
// PROCESSOR: Imagens (OCR com GPT-4o-mini Vision)
// ============================================

import { classifyDocument, extractStructuredData, ocrImage } from '../utils/openai.ts'
import { toBase64 } from '../utils/supabase.ts'
import type { ProcessingResult } from '../utils/types.ts'

// ============================================
// Processar Imagem
// ============================================
export async function processImage(
  fileData: Uint8Array,
  mimeType: string
): Promise<ProcessingResult> {
  console.log('🖼️ Processando imagem...')

  // 1. Converter para base64
  const base64Image = toBase64(fileData)

  // 2. Executar OCR com GPT-4o-mini Vision
  console.log('📸 Executando OCR...')
  const { text, confidence: ocrConfidence } = await ocrImage(base64Image, mimeType)

  if (!text || text.length < 10) {
    throw new Error('OCR não conseguiu extrair texto suficiente da imagem')
  }

  console.log(`✅ OCR completo: ${text.length} caracteres, confiança: ${ocrConfidence}`)

  // 3. Classificar documento
  console.log('🏷️ Classificando documento...')
  const classification = await classifyDocument(text)
  console.log(`✅ Classificação: ${classification.type} (${classification.confidence})`)

  // 4. Extrair dados estruturados
  console.log('📊 Extraindo dados estruturados...')
  const extractedData = await extractStructuredData(text, classification.type)
  console.log('✅ Dados extraídos:', Object.keys(extractedData).length, 'campos')

  // 5. Calcular confiança final (média entre OCR e classificação)
  const finalConfidence = (ocrConfidence + classification.confidence) / 2

  return {
    text,
    confidence: finalConfidence,
    type: classification.type,
    extracted_data: {
      ...extractedData,
      _classification_reasoning: classification.reasoning,
    },
  }
}
