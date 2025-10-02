// ============================================
// PROCESSOR: PDFs com UnPDF
// ============================================
// Usa UnPDF (otimizado para serverless) para extração de texto de alta qualidade

import { extractText, getDocumentProxy } from 'npm:unpdf@0.11.0';
import { classifyDocument, extractStructuredData } from '../utils/openai.ts';
import type { ProcessingResult } from '../utils/types.ts';

// ============================================
// Sanitizar texto para remover caracteres problemáticos
// ============================================
function sanitizeText(text: string): string {
  return text
    // Remover caracteres de controle (exceto \n, \r, \t)
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')
    // Remover sequências de escape Unicode inválidas
    .replace(/\\u[0-9a-fA-F]{0,3}(?![0-9a-fA-F])/g, '')
    // Remover sequências de escape octais inválidas
    .replace(/\\[0-7]{1,2}(?![0-7])/g, '')
    // Normalizar múltiplos espaços em branco
    .replace(/[ \t]+/g, ' ')
    // Normalizar múltiplas quebras de linha (máximo 2)
    .replace(/\n{3,}/g, '\n\n')
    // Remover espaços no início e fim de cada linha
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Remover espaços no início e fim do texto completo
    .trim();
}

// ============================================
// Processar PDF com UnPDF
// ============================================
export async function processPDFWithUnPDF(
  fileData: Uint8Array,
  mimeType: string
): Promise<ProcessingResult> {
  console.log('📄 Processando PDF com UnPDF...');

  try {
    // 1. Carregar PDF com UnPDF
    console.log('📖 Carregando PDF...');
    const pdf = await getDocumentProxy(fileData);
    
    console.log(`✅ PDF carregado: ${pdf.numPages} páginas`);

    // 2. Extrair texto de todas as páginas
    console.log('📝 Extraindo texto...');
    const { totalPages, text } = await extractText(pdf, { mergePages: true });
    
    console.log(`✅ Texto extraído: ${text.length} caracteres de ${totalPages} páginas`);

    // 3. Sanitizar texto
    const cleanText = sanitizeText(text);
    
    if (!cleanText || cleanText.length < 10) {
      throw new Error('Texto extraído insuficiente ou vazio');
    }

    console.log(`✅ Texto sanitizado: ${cleanText.length} caracteres`);

    // 4. Classificar documento
    console.log('🏷️ Classificando documento...');
    const classification = await classifyDocument(cleanText);
    console.log(`✅ Classificação: ${classification.type} (${classification.confidence})`);

    // 5. Extrair dados estruturados
    console.log('📊 Extraindo dados estruturados...');
    const extractedData = await extractStructuredData(cleanText, classification.type);
    console.log('✅ Dados extraídos:', Object.keys(extractedData).length, 'campos');

    // 6. Calcular confiança final (UnPDF tem alta confiança)
    const ocrConfidence = 0.95; // UnPDF é muito confiável
    const finalConfidence = (ocrConfidence + classification.confidence) / 2;

    return {
      text: cleanText,
      confidence: finalConfidence,
      type: classification.type,
      extracted_data: {
        ...extractedData,
        _classification_reasoning: classification.reasoning,
        _extraction_method: 'unpdf',
        _total_pages: totalPages,
      },
    };

  } catch (error) {
    console.error('❌ Erro ao processar PDF com UnPDF:', error);
    throw new Error(`Erro ao processar PDF: ${error.message}`);
  }
}

