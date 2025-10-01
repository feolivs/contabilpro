'use server';

// ============================================
// SERVER ACTIONS: Documentos
// ============================================

import { createHash } from 'crypto';
import { revalidatePath } from 'next/cache';
import { requireAuth, setRLSContext } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
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
    const supabase = await setRLSContext(session);

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
      .eq('tenant_id', session.tenant_id)
      .eq('hash', hash)
      .single();

    if (existing) {
      return {
        success: true,
        document: existing as Document,
        duplicate: true,
      };
    }

    // 5. Gerar path usando função do banco
    const { data: pathData, error: pathError } = await supabase.rpc(
      'generate_document_path',
      {
        p_tenant_id: session.tenant_id,
        p_type: input.type || 'other',
        p_filename: file.name,
        p_hash: hash,
      }
    );

    if (pathError || !pathData) {
      throw new Error('Erro ao gerar path do documento');
    }

    const storagePath = pathData as string;

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
        tenant_id: session.tenant_id,
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

    // 9. Revalidar página
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
    const session = await requireAuth();
    const supabase = await setRLSContext(session);

    // Validar e aplicar defaults
    const validated = documentFiltersSchema.parse(filters || {});

    // Construir query (RLS vai filtrar automaticamente por tenant_id)
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
      throw new Error(`Erro ao buscar documentos: ${error.message}`);
    }

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
    const supabase = await setRLSContext(session);

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
// ACTION 4: Deletar Documento
// ============================================
export async function deleteDocument(
  documentId: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const session = await requireAuth();
    const supabase = await setRLSContext(session);

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
    const supabase = await setRLSContext(session);

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
      .eq('tenant_id', session.tenant_id)
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
    const session = await requireAuth();
    const supabase = await setRLSContext(session);

    const { data: pathData, error: pathError } = await supabase.rpc(
      'generate_document_path',
      {
        p_tenant_id: session.tenant_id,
        p_type: type || 'other',
        p_filename: filename,
        p_hash: hash,
      }
    );

    if (pathError || !pathData) {
      return { success: false, error: 'Erro ao gerar path' };
    }

    return { success: true, path: pathData as string };
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
    const supabase = await setRLSContext(session);

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

    // 2. Inserir metadados usando função RPC que garante contexto RLS
    const { data: document, error: insertError } = await supabase
      .rpc('insert_document_with_context', {
        p_tenant_id: session.tenant_id,
        p_data: {
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
        },
      });

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
