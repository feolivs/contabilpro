'use server';

// ============================================
// SERVER ACTIONS: Documentos
// ============================================

import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';
import {
  uploadDocumentSchema,
  documentFiltersSchema,
  updateDocumentSchema,
  validateFile,
} from '@/schemas/document.schema';
import type {
  DocumentUploadResult,
  DocumentListResult,
  Document,
  DocumentWithRelations,
} from '@/types/document.types';

// ============================================
// ACTION 1: Upload de Documento
// ============================================
export async function uploadDocument(
  formData: FormData
): Promise<DocumentUploadResult> {
  try {
    // 1. Autenticação e contexto
    const session = await requireAuth();
    const supabase = await createServerClient();

    // 2. Extrair e validar dados
    const file = formData.get('file') as File;
    const type = formData.get('type') as string | null;
    const client_id = formData.get('client_id') as string | null;
    const entry_id = formData.get('entry_id') as string | null;

    if (!file) {
      return { success: false, error: 'Arquivo não fornecido' };
    }

    // Validar arquivo
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Validar input
    const input = uploadDocumentSchema.parse({
      type: type || undefined,
      client_id: client_id || undefined,
      entry_id: entry_id || undefined,
    });

    // 3. Calcular hash SHA-256
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const hash = createHash('sha256').update(buffer).digest('hex');

    // 4. Verificar duplicata (idempotência)
    const { data: existing } = await supabase
      .from('documents')
      .select('id, name, path')
      .eq('hash', hash)
      .single();

    if (existing) {
      return {
        success: true,
        document: existing as Document,
        duplicate: true,
      };
    }

    // 5. Gerar path único (simplificado - sem tenant)
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const docType = input.type || 'other';
    const storagePath = `${docType}/${timestamp}/${hash.substring(0, 8)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // 6. Upload para Storage
    const { error: uploadError } = await supabase.storage
      .from('documentos')
      .upload(storagePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false, // Nunca sobrescrever
      });

    if (uploadError) {
      throw new Error(`Erro no upload: ${uploadError.message}`);
    }

    // 7. Inserir metadados no banco
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        name: file.name,
        original_name: file.name,
        path: storagePath,
        hash,
        size: file.size,
        mime_type: file.type,
        type: input.type || null,
        client_id: input.client_id || null,
        entry_id: input.entry_id || null,
        metadata: input.metadata || {},
        uploaded_by: session.user.id,
        processed: false,
      })
      .select()
      .single();

    if (insertError) {
      // Rollback: deletar do Storage
      await supabase.storage.from('documentos').remove([storagePath]);
      throw new Error(`Erro ao salvar metadados: ${insertError.message}`);
    }

    // 8. Registrar evento de auditoria
    await supabase.rpc('log_document_event', {
      p_document_id: document.id,
      p_event_type: 'upload',
      p_metadata: {
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
      },
    });

    // 9. Invocar Edge Function para processamento automático
    console.log('🚀 Invocando Edge Function para processar documento...');
    const { error: invokeError } = await supabase.functions.invoke(
      'process-document',
      {
        body: {
          document_id: document.id,
          storage_path: storagePath,
          mime_type: file.type,
        },
      }
    );

    if (invokeError) {
      console.error('⚠️ Erro ao invocar processamento:', invokeError);
      // Não falhar o upload por causa disso - processamento é assíncrono
    } else {
      console.log('✅ Edge Function invocada com sucesso');
    }

    // 10. Revalidar página
    revalidatePath('/documentos');

    return {
      success: true,
      document: document as Document,
      duplicate: false,
    };
  } catch (error: any) {
    console.error('Erro no upload:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido no upload',
    };
  }
}

// ============================================
// ACTION 2: Listar Documentos
// ============================================
export async function getDocuments(
  filters?: Partial<DocumentFiltersInput>
): Promise<DocumentListResult> {
  try {
    await requireAuth(); // Apenas verificar autenticação
    const supabase = await createServerClient();

    // Validar e aplicar defaults
    const validated = documentFiltersSchema.parse(filters || {});

    // Construir query (RLS simplificado filtra automaticamente)
    let query = supabase
      .from('documents')
      .select(
        `
        *,
        client:clients(id, name),
        entry:entries(id, description),
        uploader:users!uploaded_by(id, name)
      `,
        { count: 'exact' }
      );

    // Aplicar filtros
    if (validated.type) {
      query = query.eq('type', validated.type);
    }

    if (validated.client_id) {
      query = query.eq('client_id', validated.client_id);
    }

    if (validated.processed !== undefined) {
      query = query.eq('processed', validated.processed);
    }

    if (validated.date_from) {
      query = query.gte('created_at', validated.date_from);
    }

    if (validated.date_to) {
      query = query.lte('created_at', validated.date_to);
    }

    // Busca por nome (simples)
    if (validated.search) {
      query = query.ilike('name', `%${validated.search}%`);
    }

    // Paginação
    const from = (validated.page - 1) * validated.pageSize;
    const to = from + validated.pageSize - 1;

    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    // Executar query
    const { data, error, count } = await query;

    if (error) {
      console.error('[getDocuments] Erro na query:', error);
      throw new Error(`Erro ao buscar documentos: ${error.message}`);
    }

    console.log('[getDocuments] Documentos encontrados:', {
      count,
      dataLength: data?.length || 0,
    });

    return {
      documents: (data || []) as DocumentWithRelations[],
      total: count || 0,
      page: validated.page,
      pageSize: validated.pageSize,
    };
  } catch (error: any) {
    console.error('Erro ao listar documentos:', error);
    throw error;
  }
}

// ============================================
// ACTION 3: Gerar URL de Download
// ============================================
export async function getDocumentDownloadUrl(
  documentId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // 1. Buscar documento (RLS vai filtrar automaticamente por tenant_id)
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, path, name')
      .eq('id', documentId)
      .maybeSingle();

    if (fetchError || !document) {
      return { success: false, error: 'Documento não encontrado' };
    }

    // 2. Gerar URL assinada (válida por 1 hora)
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documentos')
      .createSignedUrl(document.path, 3600, {
        download: document.name, // Nome do arquivo no download
      });

    if (urlError || !urlData) {
      return { success: false, error: 'Erro ao gerar URL de download' };
    }

    // 3. Registrar evento de download
    await supabase.rpc('log_document_event', {
      p_document_id: documentId,
      p_event_type: 'download',
      p_metadata: { file_name: document.name },
    });

    return {
      success: true,
      url: urlData.signedUrl,
    };
  } catch (error: any) {
    console.error('Erro ao gerar URL:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

// ============================================
// ACTION 3.5: Gerar URL de Visualização (sem download)
// ============================================
export async function getDocumentViewUrl(
  documentId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // 1. Buscar documento (RLS vai filtrar automaticamente por tenant_id)
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, path, name, mime_type')
      .eq('id', documentId)
      .maybeSingle();

    if (fetchError || !document) {
      console.error('Erro ao buscar documento:', fetchError);
      return { success: false, error: 'Documento não encontrado' };
    }

    if (!document.path) {
      return { success: false, error: 'Caminho do documento não encontrado' };
    }

    // 2. Gerar URL assinada (válida por 1 hora) SEM forçar download
    const { data: urlData, error: urlError } = await supabase.storage
      .from('documentos')
      .createSignedUrl(document.path, 3600);

    if (urlError || !urlData) {
      console.error('Erro ao gerar URL assinada:', urlError);
      return {
        success: false,
        error: `Erro ao gerar URL de visualização: ${urlError?.message || 'URL não gerada'}`
      };
    }

    // 3. Registrar evento de visualização (não bloquear se falhar)
    try {
      await supabase.rpc('log_document_event', {
        p_document_id: documentId,
        p_event_type: 'view',
        p_metadata: { file_name: document.name },
      });
    } catch (logError) {
      console.warn('Erro ao registrar evento de visualização:', logError);
      // Não falhar a operação por causa do log
    }

    console.log('URL de visualização gerada com sucesso:', {
      documentId,
      path: document.path,
      hasUrl: !!urlData.signedUrl,
    });

    return {
      success: true,
      url: urlData.signedUrl,
    };
  } catch (error: any) {
    console.error('Erro ao gerar URL de visualização:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

// ============================================
// ACTION 4: Deletar Documento
// ============================================
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // 1. Buscar documento (RLS vai filtrar automaticamente por tenant_id)
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('id, path, name')
      .eq('id', documentId)
      .maybeSingle();

    if (fetchError || !document) {
      return { success: false, error: 'Documento não encontrado' };
    }

    // 2. Registrar evento ANTES de deletar
    await supabase.rpc('log_document_event', {
      p_document_id: documentId,
      p_event_type: 'delete',
      p_metadata: { file_name: document.name },
    });

    // 3. Deletar do Storage
    const { error: storageError } = await supabase.storage
      .from('documentos')
      .remove([document.path]);

    if (storageError) {
      console.error('Erro ao deletar do Storage:', storageError);
      // Continuar mesmo assim (pode já ter sido deletado)
    }

    // 4. Deletar do banco (RLS vai validar permissão - apenas admin/owner)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      return {
        success: false,
        error: `Erro ao deletar: ${deleteError.message}`,
      };
    }

    // 5. Revalidar página
    revalidatePath('/documentos');

    return {
      success: true,
      message: 'Documento deletado com sucesso',
    };
  } catch (error: any) {
    console.error('Erro ao deletar documento:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

// ============================================
// ACTION 5: Atualizar Documento
// ============================================
export async function updateDocument(
  input: UpdateDocumentInput
): Promise<{ success: boolean; document?: Document; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // Validar input
    const validated = updateDocumentSchema.parse(input);

    // Atualizar (RLS vai validar tenant_id)
    const { data: document, error: updateError } = await supabase
      .from('documents')
      .update({
        type: validated.type,
        client_id: validated.client_id,
        entry_id: validated.entry_id,
        metadata: validated.metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', validated.id)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: `Erro ao atualizar: ${updateError.message}`,
      };
    }

    // Registrar evento
    await supabase.rpc('log_document_event', {
      p_document_id: validated.id,
      p_event_type: 'update',
      p_metadata: { changes: validated },
    });

    // Revalidar
    revalidatePath('/documentos');

    return {
      success: true,
      document: document as Document,
    };
  } catch (error: any) {
    console.error('Erro ao atualizar documento:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

// ============================================
// ACTION 6: Gerar Path para Upload Direto (Client-Side)
// ============================================
export async function generateUploadPath(
  filename: string,
  hash: string,
  type?: string
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    await requireAuth();

    // Gerar path simplificado (sem RPC)
    const timestamp = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const docType = type || 'other';
    const path = `${docType}/${timestamp}/${hash.substring(0, 8)}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    return { success: true, path };
  } catch (error: any) {
    console.error('Erro ao gerar path:', error);
    return { success: false, error: 'Erro ao gerar path' };
  }
}

// ============================================
// ACTION 7: Registrar Documento Após Upload Direto
// ============================================
export async function registerUploadedDocument(data: {
  name: string;
  path: string;
  hash: string;
  size: number;
  mime_type: string;
  type?: string;
  client_id?: string;
  entry_id?: string;
}): Promise<DocumentUploadResult> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // 1. Verificar duplicata (RLS vai filtrar automaticamente por tenant_id)
    const { data: existing } = await supabase
      .from('documents')
      .select('id, name, path')
      .eq('hash', data.hash)
      .maybeSingle();

    if (existing) {
      return {
        success: true,
        document: existing as Document,
        duplicate: true,
      };
    }

    // 2. Inserir metadados diretamente (RLS simplificado)
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        name: data.name,
        original_name: data.name,
        path: data.path,
        hash: data.hash,
        size: data.size,
        mime_type: data.mime_type,
        type: data.type || null,
        client_id: data.client_id || null,
        entry_id: data.entry_id || null,
        metadata: {},
        uploaded_by: session.user.id,
        processed: false,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erro ao salvar metadados: ${insertError.message}`);
    }

    // 3. Registrar evento
    await supabase.rpc('log_document_event', {
      p_document_id: document.id,
      p_event_type: 'upload',
      p_metadata: {
        file_name: data.name,
        file_size: data.size,
        mime_type: data.mime_type,
      },
    });

    // 4. Invocar Edge Function para processamento automático
    console.log('🚀 [registerUploadedDocument] Invocando Edge Function...', {
      document_id: document.id,
      storage_path: data.path,
      mime_type: data.mime_type,
    });

    const { data: invokeData, error: invokeError } = await supabase.functions.invoke(
      'process-document',
      {
        body: {
          document_id: document.id,
          storage_path: data.path,
          mime_type: data.mime_type,
        },
      }
    );

    if (invokeError) {
      console.error('⚠️ [registerUploadedDocument] Erro ao invocar Edge Function:', invokeError);
      // Não falhar o upload por causa disso - processamento é assíncrono
    } else {
      console.log('✅ [registerUploadedDocument] Edge Function invocada com sucesso:', invokeData);
    }

    revalidatePath('/documentos');

    return {
      success: true,
      document: document as Document,
      duplicate: false,
    };
  } catch (error: any) {
    console.error('Erro ao registrar documento:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

// ============================================
// BUSCAR AI INSIGHTS DE DOCUMENTO
// ============================================
export async function getDocumentAIInsights(
  documentId: string
): Promise<ActionResponse<any[]>> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // Buscar AI insights relacionados ao documento
    const { data, error } = await supabase
      .from('ai_insights')
      .select('*')
      .contains('data', { document_id: documentId })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar AI insights:', error);
      return { success: false, error: 'Erro ao buscar insights do documento' };
    }

    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error('Erro ao buscar AI insights:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

// ============================================
// TRADUZIR DADOS PARA LINGUAGEM CONTÁBIL
// ============================================
export async function translateToAccountingLanguage(
  documentType: string,
  extractedData: Record<string, any>
): Promise<ActionResponse<{ explanation: string; suggestions: string[] }>> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // Criar explicação contábil baseada no tipo de documento
    let explanation = '';
    let suggestions: string[] = [];

    switch (documentType) {
      case 'nfe':
        explanation = `Esta Nota Fiscal Eletrônica (NFe) representa uma operação de compra/venda que deve ser registrada na contabilidade. `;
        if (extractedData.valor_total) {
          explanation += `O valor total de R$ ${Number(extractedData.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} `;
        }
        if (extractedData.cfop) {
          explanation += `com CFOP ${extractedData.cfop} indica a natureza da operação. `;
        }
        if (extractedData.valor_icms) {
          explanation += `O ICMS de R$ ${Number(extractedData.valor_icms).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} deve ser considerado para apuração dos tributos.`;
        }

        suggestions = [
          'Registrar como entrada de mercadorias/produtos no estoque',
          'Lançar o ICMS a recuperar (se aplicável)',
          'Verificar se há necessidade de provisão para impostos',
          'Conferir se o fornecedor está cadastrado corretamente'
        ];
        break;

      case 'nfse':
        explanation = `Esta Nota Fiscal de Serviço Eletrônica (NFSe) representa uma prestação de serviços. `;
        if (extractedData.valor_servicos) {
          explanation += `O valor dos serviços de R$ ${Number(extractedData.valor_servicos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} `;
        }
        if (extractedData.valor_iss) {
          explanation += `com ISS de R$ ${Number(extractedData.valor_iss).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} `;
          explanation += extractedData.iss_retido ? '(retido na fonte)' : '(a recolher)';
        }

        suggestions = [
          'Registrar a receita de serviços prestados',
          'Lançar o ISS a recolher ou retido na fonte',
          'Verificar outros tributos incidentes (PIS, COFINS, etc.)',
          'Conferir se o tomador está cadastrado corretamente'
        ];
        break;

      case 'receipt':
        explanation = `Este recibo representa um comprovante de pagamento que deve ser registrado na contabilidade. `;
        if (extractedData.valor) {
          explanation += `O valor de R$ ${Number(extractedData.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} `;
        }
        if (extractedData.descricao) {
          explanation += `referente a "${extractedData.descricao}" `;
        }
        explanation += 'deve ser classificado na conta contábil apropriada.';

        suggestions = [
          'Identificar a natureza do gasto (despesa operacional, investimento, etc.)',
          'Classificar na conta contábil correta',
          'Verificar se há retenções de impostos',
          'Conferir se o documento é válido fiscalmente'
        ];
        break;

      case 'das':
        explanation = `Este DAS (Documento de Arrecadação do Simples Nacional) representa o pagamento unificado dos tributos do Simples Nacional. `;
        if (extractedData.valor_total) {
          explanation += `O valor total de R$ ${Number(extractedData.valor_total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} `;
        }
        if (extractedData.periodo_apuracao) {
          explanation += `referente ao período ${extractedData.periodo_apuracao} `;
        }
        explanation += 'engloba diversos tributos federais, estaduais e municipais.';

        suggestions = [
          'Registrar como tributos a pagar ou pagos',
          'Ratear entre os diferentes tributos (IRPJ, CSLL, PIS, COFINS, etc.)',
          'Verificar se o valor está de acordo com o faturamento',
          'Conferir se o pagamento foi efetuado no prazo'
        ];
        break;

      case 'extrato':
        explanation = `Este extrato bancário mostra a movimentação financeira da conta. `;
        if (extractedData.saldo_inicial && extractedData.saldo_final) {
          explanation += `O saldo inicial de R$ ${Number(extractedData.saldo_inicial).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} `;
          explanation += `evoluiu para R$ ${Number(extractedData.saldo_final).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. `;
        }
        explanation += 'Todas as movimentações devem ser conciliadas com os lançamentos contábeis.';

        suggestions = [
          'Realizar conciliação bancária',
          'Identificar lançamentos não registrados na contabilidade',
          'Verificar tarifas e encargos bancários',
          'Conferir se todos os depósitos e saques estão corretos'
        ];
        break;

      default:
        explanation = 'Este documento contém informações que podem ser relevantes para a contabilidade. ';
        explanation += 'Recomenda-se análise detalhada para determinar o tratamento contábil adequado.';

        suggestions = [
          'Analisar a natureza do documento',
          'Determinar o impacto contábil',
          'Verificar se há obrigações fiscais',
          'Consultar a legislação aplicável'
        ];
    }

    return {
      success: true,
      data: {
        explanation,
        suggestions
      }
    };
  } catch (error: any) {
    console.error('Erro ao traduzir para linguagem contábil:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido',
    };
  }
}

