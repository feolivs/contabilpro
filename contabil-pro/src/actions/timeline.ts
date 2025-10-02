'use server';

// ============================================
// SERVER ACTIONS: Timeline
// ============================================

import { requireAuth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';
import type { TimelineEvent, TimelineFilters } from '@/types/timeline';

// ============================================
// Tipo de Resposta Padrão
// ============================================
type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ============================================
// ACTION 1: Buscar Timeline do Cliente
// ============================================
export async function getClientTimeline(
  filters: TimelineFilters
): Promise<ActionResponse<{ events: TimelineEvent[]; total: number }>> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // Validar client_id obrigatório
    if (!filters.client_id) {
      return { success: false, error: 'client_id é obrigatório' };
    }

    // Configurar paginação
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 20;

    // Construir query base
    let query = supabase
      .from('client_timeline')
      .select(
        `
        *,
        user:users(id, name),
        client:clients(id, name),
        document:documents(id, name),
        task:tasks(id, title),
        entry:entries(id, description)
      `,
        { count: 'exact' }
      )
      .eq('client_id', filters.client_id);

    // Filtrar por tipo de evento
    if (filters.event_type) {
      if (Array.isArray(filters.event_type)) {
        query = query.in('event_type', filters.event_type);
      } else {
        query = query.eq('event_type', filters.event_type);
      }
    }

    // Filtrar por data
    if (filters.from_date) {
      query = query.gte('created_at', filters.from_date);
    }

    if (filters.to_date) {
      query = query.lte('created_at', filters.to_date);
    }

    // Ordenar por data (mais recente primeiro)
    query = query.order('created_at', { ascending: false });

    // Paginação
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Executar query
    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar timeline:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: {
        events: data as TimelineEvent[],
        total: count || 0,
      },
    };
  } catch (error) {
    console.error('Erro ao buscar timeline:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

// ============================================
// ACTION 2: Registrar Evento Manual (Opcional)
// ============================================
export async function logTimelineEvent(input: {
  client_id: string;
  event_type: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}): Promise<ActionResponse<TimelineEvent>> {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    // Buscar tenant_id do cliente
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('tenant_id')
      .eq('id', input.client_id)
      .single();

    if (clientError || !client) {
      return { success: false, error: 'Cliente não encontrado' };
    }

    // Inserir evento
    const { data, error } = await supabase
      .from('client_timeline')
      .insert({
        tenant_id: client.tenant_id,
        client_id: input.client_id,
        event_type: input.event_type,
        title: input.title,
        description: input.description,
        metadata: input.metadata || {},
        user_id: session.user.id,
      })
      .select(
        `
        *,
        user:users(id, name),
        client:clients(id, name)
      `
      )
      .single();

    if (error) {
      console.error('Erro ao registrar evento:', error);
      return { success: false, error: error.message };
    }

    return {
      success: true,
      data: data as TimelineEvent,
    };
  } catch (error) {
    console.error('Erro ao registrar evento:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

