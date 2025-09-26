'use server'

import { revalidatePath } from 'next/cache'

import { type z } from 'zod'

import { requireAuth, setRLSContext } from '@/lib/auth'
import { entrySchema } from '@/lib/validations'

const baseEntrySchema = entrySchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
})

export type EntryFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fieldErrors?: Record<string, string[]>
}

export const initialEntryFormState: EntryFormState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
}

// Server Action para criar lançamento contábil
export async function createEntry(input: z.infer<typeof baseEntrySchema>) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de segurança')
    }

    const validatedData = baseEntrySchema.parse(input)

    const { data, error } = await supabase
      .from('entries')
      .insert({
        ...validatedData,
        tenant_id: session.tenant_id,
      })
      .select(
        `
        *,
        client:clients(name),
        account:accounts(name, code)
      `,
      )
      .single()

    if (error) {
      throw new Error(`Erro ao criar lançamento: ${error.message}`)
    }

    revalidatePath('/lancamentos')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar lançamento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function createEntryFromForm(
  _prevState: EntryFormState,
  formData: FormData,
): Promise<EntryFormState> {
  const input = {
    client_id: (formData.get('client_id') ?? '').toString(),
    account_id: (formData.get('account_id') ?? '').toString(),
    description: (formData.get('description') ?? '').toString(),
    amount: Number(formData.get('amount') ?? 0),
    type: (formData.get('type') ?? '').toString(),
    date: formData.get('date') ? new Date(formData.get('date')!.toString()) : new Date(),
    document_id: formData.get('document_id')
      ? formData.get('document_id')!.toString()
      : undefined,
    tenant_id: undefined,
    created_at: undefined,
  }

  const parsed = baseEntrySchema.safeParse(input)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Não foi possível validar o lançamento.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const result = await createEntry(parsed.data)

  if (!result.success) {
    return {
      status: 'error',
      message: result.error ?? 'Erro desconhecido ao criar lançamento.',
    }
  }

  return {
    status: 'success',
    message: 'Lançamento registrado com sucesso.',
  }
}

// Server Action para listar lançamentos
export async function getEntries() {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de segurança')
    }

    const { data, error } = await supabase
      .from('entries')
      .select(
        `
        *,
        client:clients(name),
        account:accounts(name, code)
      `,
      )
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar lançamentos: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar lançamentos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

// Server Action para classificar lançamento com IA
export async function classifyEntry(entryId: string) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de segurança')
    }

    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (entryError) {
      throw new Error(`Erro ao buscar lançamento: ${entryError.message}`)
    }

    // Simular classificação IA (placeholder)
    const aiClassification = {
      confidence: 0.85,
      suggested_account: 'receitas-vendas',
      keywords: ['venda', 'produto'],
      explanation: 'Classificado como receita de vendas baseado na descrição',
    }

    const { error: insightError } = await supabase.from('ai_insights').insert({
      tenant_id: entry.tenant_id,
      entry_id: entryId,
      type: 'classification',
      confidence: aiClassification.confidence,
      data: aiClassification,
      status: aiClassification.confidence >= 0.85 ? 'awaiting_confirmation' : 'needs_review',
    })

    if (insightError) {
      throw new Error(`Erro ao gravar insight: ${insightError.message}`)
    }

    revalidatePath('/lancamentos')
    return { success: true, data: aiClassification }
  } catch (error) {
    console.error('Erro ao classificar lançamento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}
