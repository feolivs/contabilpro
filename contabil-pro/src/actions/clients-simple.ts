'use server';

import { requireAuth } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase';

/**
 * Busca lista simplificada de clientes para dropdowns
 * Retorna apenas id, name e document para uso em selects
 * 
 * @returns Lista de clientes ativos do tenant
 */
export async function getClientsForDropdown() {
  try {
    const session = await requireAuth();
    const supabase = await createServerClient();

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, document, document_type')
      .eq('tenant_id', session.tenant_id)
      .eq('status', 'active') // Apenas clientes ativos
      .order('name', { ascending: true })
      .limit(500); // Limite razoável para dropdown

    if (error) {
      console.error('[getClientsForDropdown] Erro:', error);
      return { 
        success: false, 
        clients: [], 
        error: error.message 
      };
    }

    return {
      success: true,
      clients: data || [],
    };
  } catch (error: any) {
    console.error('[getClientsForDropdown] Erro:', error);
    return {
      success: false,
      clients: [],
      error: error.message || 'Erro ao buscar clientes',
    };
  }
}

