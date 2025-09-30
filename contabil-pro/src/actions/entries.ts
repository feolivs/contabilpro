'use server'

import { revalidatePath } from 'next/cache'

import { requireAuth, setRLSContext } from '@/lib/auth'
import { entrySchema } from '@/lib/validations'

import { type z } from 'zod'
import {
  EntryFormState,
  EntryImportState,
  initialEntryFormState,
  initialEntryImportState,
  type Entry,
  type EntryWithRelations,
  type EntryFilters,
  type EntryImportRow,
  type EntryImportResult
} from '@/types/entries'

const baseEntrySchema = entrySchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
})

const updateEntrySchema = baseEntrySchema.partial()

export async function createEntry(input: z.infer<typeof baseEntrySchema>) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
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
      `
      )
      .single()

    if (error) {
      throw new Error(`Erro ao criar lancamento: ${error.message}`)
    }

    revalidatePath('/lancamentos')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar lancamento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function createEntryFromForm(
  _prevState: EntryFormState,
  formData: FormData
): Promise<EntryFormState> {
  const input = {
    client_id: (formData.get('client_id') ?? '').toString(),
    account_id: (formData.get('account_id') ?? '').toString(),
    description: (formData.get('description') ?? '').toString(),
    amount: Number(formData.get('amount') ?? 0),
    type: (formData.get('type') ?? '').toString(),
    date: formData.get('date') ? new Date(formData.get('date')!.toString()) : new Date(),
    document_id: formData.get('document_id') ? formData.get('document_id')!.toString() : undefined,
  }

  const parsed = baseEntrySchema.safeParse(input)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Nao foi possivel validar o lancamento.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const result = await createEntry(parsed.data)

  if (!result.success) {
    return {
      status: 'error',
      message: result.error ?? 'Erro desconhecido ao criar lancamento.',
    }
  }

  return {
    status: 'success',
    message: 'Lancamento registrado com sucesso.',
  }
}

export async function getEntries() {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const { data, error } = await supabase
      .from('entries')
      .select(
        `
        *,
        client:clients(name),
        account:accounts(name, code)
      `
      )
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar lancamentos: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar lancamentos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function getEntryById(id: string) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const { data, error } = await supabase
      .from('entries')
      .select(
        `
        *,
        client:clients(name, document, email, phone),
        account:accounts(name, code)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Erro ao buscar lancamento: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar lancamento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function updateEntry(id: string, input: z.infer<typeof updateEntrySchema>) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const validatedData = updateEntrySchema.parse(input)
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== undefined && value !== null)
    )

    if (Object.keys(cleanData).length === 0) {
      throw new Error('Nenhum dado informado para atualizacao.')
    }

    const { data, error } = await supabase
      .from('entries')
      .update(cleanData)
      .eq('id', id)
      .select(
        `
        *,
        client:clients(name),
        account:accounts(name, code)
      `
      )
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar lancamento: ${error.message}`)
    }

    revalidatePath('/lancamentos')
    revalidatePath(`/lancamentos/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar lancamento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function updateEntryFromForm(
  _prevState: EntryFormState,
  formData: FormData
): Promise<EntryFormState> {
  const id = (formData.get('id') ?? '').toString()

  if (!id) {
    return {
      status: 'error',
      message: 'Lancamento nao encontrado para edicao.',
    }
  }

  const amountRaw = formData.get('amount')?.toString().trim()
  let amount: number | undefined

  if (amountRaw && amountRaw.length > 0) {
    const parsedAmount = Number(amountRaw)

    if (Number.isNaN(parsedAmount)) {
      return {
        status: 'error',
        message: 'Valor informado invalido.',
      }
    }

    amount = parsedAmount
  }

  const dateRaw = formData.get('date')?.toString().trim()
  let date: Date | undefined

  if (dateRaw && dateRaw.length > 0) {
    const parsedDate = new Date(dateRaw)

    if (Number.isNaN(parsedDate.getTime())) {
      return {
        status: 'error',
        message: 'Data informada invalida.',
      }
    }

    date = parsedDate
  }

  const input = {
    client_id: formData.get('client_id') ? formData.get('client_id')!.toString() : undefined,
    account_id: formData.get('account_id') ? formData.get('account_id')!.toString() : undefined,
    description: formData.get('description') ? formData.get('description')!.toString() : undefined,
    amount,
    type: formData.get('type') ? formData.get('type')!.toString() : undefined,
    date,
    document_id: formData.get('document_id') ? formData.get('document_id')!.toString() : undefined,
  }

  const parsed = updateEntrySchema.safeParse(input)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Nao foi possivel validar o lancamento.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const cleanData = Object.fromEntries(
    Object.entries(parsed.data).filter(([, value]) => value !== undefined && value !== null)
  )

  if (Object.keys(cleanData).length === 0) {
    return {
      status: 'error',
      message: 'Nenhum dado informado para atualizacao.',
    }
  }

  const result = await updateEntry(id, cleanData)

  if (!result.success) {
    return {
      status: 'error',
      message: result.error ?? 'Erro desconhecido ao atualizar lancamento.',
    }
  }

  return {
    status: 'success',
    message: 'Lancamento atualizado com sucesso.',
  }
}

export async function deleteEntry(id: string) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const { error } = await supabase.from('entries').delete().eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir lancamento: ${error.message}`)
    }

    revalidatePath('/lancamentos')
    revalidatePath(`/lancamentos/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir lancamento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function classifyEntry(entryId: string) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entryId)
      .single()

    if (entryError) {
      throw new Error(`Erro ao buscar lancamento: ${entryError.message}`)
    }

    const aiClassification = {
      confidence: 0.85,
      suggested_account: 'receitas-vendas',
      keywords: ['venda', 'produto'],
      explanation: 'Classificado como receita de vendas baseado na descricao',
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
    revalidatePath(`/lancamentos/${entryId}`)
    return { success: true, data: aiClassification }
  } catch (error) {
    console.error('Erro ao classificar lancamento:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

const allowedEntryImportFields = new Set([
  'client_id',
  'account_id',
  'description',
  'amount',
  'type',
  'date',
  'document_id',
])

export async function importEntriesFromCSV(
  _prevState: EntryImportState,
  formData: FormData
): Promise<EntryImportState> {
  const file = formData.get('file')

  if (!(file instanceof File) || file.size === 0) {
    return {
      status: 'error',
      message: 'Selecione um arquivo CSV valido.',
    }
  }

  try {
    const raw = await file.text()
    const lines = raw
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0)

    if (lines.length < 2) {
      return {
        status: 'error',
        message: 'Arquivo CSV vazio ou sem cabecalho.',
      }
    }

    const headers = lines[0].split(',').map(header => header.trim().toLowerCase())

    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    let processed = 0
    let created = 0
    let skipped = 0

    const payload: Array<Record<string, unknown>> = []

    for (const line of lines.slice(1)) {
      processed += 1
      const values = line.split(',').map(value => value.trim())
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        if (allowedEntryImportFields.has(header)) {
          row[header] = values[index] ?? ''
        }
      })

      const normalizedType = row.type ? row.type.toLowerCase() : undefined
      const typeValue =
        normalizedType === 'debit' || normalizedType === 'credit' ? normalizedType : undefined

      const amountValue = row.amount?.replace(',', '.') ?? ''
      const parsedAmount = amountValue.length > 0 ? Number(amountValue) : Number.NaN

      const dateValue = row.date ?? ''
      const parsedDate = dateValue.length > 0 ? new Date(dateValue) : new Date('invalid')

      const candidate = {
        client_id: row.client_id ?? '',
        account_id: row.account_id ?? '',
        description: row.description ?? '',
        amount: parsedAmount,
        type: typeValue ?? '',
        date: parsedDate,
        document_id: row.document_id ? row.document_id : undefined,
      }

      const parsed = baseEntrySchema.safeParse(candidate)

      if (!parsed.success) {
        skipped += 1
        continue
      }

      payload.push({
        ...parsed.data,
        tenant_id: session.tenant_id,
      })
      created += 1
    }

    if (payload.length > 0) {
      const { error } = await supabase.from('entries').insert(payload)

      if (error) {
        throw new Error(`Erro ao importar lancamentos: ${error.message}`)
      }

      revalidatePath('/lancamentos')
    }

    return {
      status: 'success',
      message: 'Importacao de lancamentos concluida.',
      summary: {
        processed,
        created,
        skipped,
        errors: 0,
      },
    }
  } catch (error) {
    console.error('Erro ao importar lancamentos:', error)
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Erro desconhecido ao importar lancamentos.',
    }
  }
}
