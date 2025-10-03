// ============================================
// PROCESSOR: PDFs
// ============================================

import { classifyDocument, extractStructuredData, ocrImage } from '../utils/openai.ts'
import { toBase64 } from '../utils/supabase.ts'
import type { ProcessingResult } from '../utils/types.ts'

// ============================================
// Processar PDF
// ============================================
export async function processPDF(
  fileData: Uint8Array,
  mimeType: string
): Promise<ProcessingResult> {
  console.log('📄 Processando PDF...')

  let text = ''
  let confidence = 0.8 // Confiança padrão para PDFs

  try {
    // Tentar extrair texto nativo do PDF usando pdf-parse
    console.log('📖 Tentando extrair texto nativo...')
    text = await extractTextFromPDF(fileData)

    if (text && text.length > 50) {
      console.log(`✅ Texto nativo extraído: ${text.length} caracteres`)
      confidence = 0.95 // Alta confiança para texto nativo
    } else {
      throw new Error('Texto insuficiente, tentando OCR')
    }
  } catch (error) {
    // Se falhar, tentar OCR (PDF escaneado)
    console.log('⚠️ Texto nativo falhou, usando OCR...')
    console.log('🔄 Convertendo PDF para imagem...')

    // Por enquanto, vamos usar uma abordagem simplificada
    // Em produção, seria necessário converter PDF para imagem usando uma biblioteca
    // como pdf2pic ou similar

    // Fallback: tentar extrair como imagem
    const base64Data = toBase64(fileData)
    const { text: ocrText, confidence: ocrConfidence } = await ocrImage(
      base64Data,
      'application/pdf'
    )

    text = ocrText
    confidence = ocrConfidence

    console.log(`✅ OCR completo: ${text.length} caracteres, confiança: ${confidence}`)
  }

  if (!text || text.length < 10) {
    throw new Error('Não foi possível extrair texto do PDF')
  }

  // 2. Classificar documento
  console.log('🏷️ Classificando documento...')
  const classification = await classifyDocument(text)
  console.log(`✅ Classificação: ${classification.type} (${classification.confidence})`)

  // 3. Extrair dados estruturados
  console.log('📊 Extraindo dados estruturados...')
  const extractedData = await extractStructuredData(text, classification.type)
  console.log('✅ Dados extraídos:', Object.keys(extractedData).length, 'campos')

  // 4. Calcular confiança final
  const finalConfidence = (confidence + classification.confidence) / 2

  return {
    text: sanitizeText(text), // Sanitizar texto final
    confidence: finalConfidence,
    type: classification.type,
    extracted_data: {
      ...extractedData,
      _classification_reasoning: classification.reasoning,
    },
  }
}

// ============================================
// Sanitizar texto para remover caracteres problemáticos
// ============================================
function sanitizeText(text: string): string {
  return (
    text
      // Remover caracteres de controle (exceto \n, \r, \t)
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
      // Remover sequências de escape Unicode inválidas
      .replace(/\\u[0-9a-fA-F]{0,3}(?![0-9a-fA-F])/g, '')
      // Remover sequências de escape octais inválidas
      .replace(/\\[0-7]{1,2}(?![0-7])/g, '')
      // Normalizar espaços em branco
      .replace(/\s+/g, ' ')
      // Remover espaços no início e fim
      .trim()
  )
}

// ============================================
// Extrair texto nativo de PDF
// ============================================
async function extractTextFromPDF(fileData: Uint8Array): Promise<string> {
  // Importar pdf-parse dinamicamente
  // Nota: Esta é uma implementação simplificada
  // Em produção, seria necessário usar uma biblioteca como pdf-parse

  try {
    // Converter Uint8Array para string e procurar por texto
    const decoder = new TextDecoder('utf-8', { fatal: false })
    const pdfString = decoder.decode(fileData)

    // Extrair texto entre objetos de stream
    // Esta é uma abordagem muito simplificada e pode não funcionar para todos os PDFs
    const textMatches = pdfString.match(/\(([^)]+)\)/g)

    if (textMatches && textMatches.length > 0) {
      const extractedText = textMatches
        .map(match => match.slice(1, -1)) // Remover parênteses
        .join(' ')
        .replace(/\\n/g, '\n')
        .replace(/\\r/g, '')
        .trim()

      if (extractedText.length > 50) {
        // Sanitizar texto antes de retornar
        return sanitizeText(extractedText)
      }
    }

    throw new Error('Texto insuficiente extraído')
  } catch (error) {
    throw new Error(`Erro ao extrair texto do PDF: ${error.message}`)
  }
}
