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
    await requireAuth(); // Apenas verificar autenticação
    const supabase = await createServerClient();

    console.log('[getClientsForDropdown] Buscando clientes...');

    const { data, error } = await supabase
      .from('clients')
      .select('id, name, document, document_type')
      .eq('status', 'ativo') // Apenas clientes ativos (status em português)
      .order('name', { ascending: true })
      .limit(500); // Limite razoável para dropdown

    if (error) {
      console.error('[getClientsForDropdown] Erro na query:', error);
      return {
        success: false,
        clients: [],
        error: error.message
      };
    }

    console.log('[getClientsForDropdown] Clientes encontrados:', data?.length || 0);

    return {
      success: true,
      clients: data || [],
    };
  } catch (error: any) {
    console.error('[getClientsForDropdown] Erro geral:', error);
    return {
      success: false,
      clients: [],
      error: error.message || 'Erro ao buscar clientes',
    };
  }
}

