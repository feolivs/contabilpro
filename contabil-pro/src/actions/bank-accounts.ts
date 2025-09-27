'use server'

import { revalidatePath } from 'next/cache'

import { type z } from 'zod'

import { requireAuth, setRLSContext } from '@/lib/auth'
import { bankAccountSchema, bankTransactionSchema } from '@/lib/validations'

const baseBankAccountSchema = bankAccountSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
})

const updateBankAccountSchema = baseBankAccountSchema.partial()

const baseBankTransactionSchema = bankTransactionSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
})

export type BankAccountFormState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  fieldErrors?: Record<string, string[]>
}

export const initialBankAccountFormState: BankAccountFormState = {
  status: 'idle',
  message: null,
  fieldErrors: {},
}

export type BankTransactionImportState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  summary?: {
    processed: number
    imported: number
    skipped: number
  }
}

export const initialBankTransactionImportState: BankTransactionImportState = {
  status: 'idle',
  message: null,
}

export async function getBankAccounts() {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erro ao buscar contas bancarias: ${error.message}`)
    }

    return { success: true, data }
  } catch (error) {
    console.error('Erro ao buscar contas bancarias:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function getBankAccountById(id: string) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const { data: account, error: accountError } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single()

    if (accountError) {
      throw new Error(`Erro ao buscar conta bancaria: ${accountError.message}`)
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from('bank_transactions')
      .select('*')
      .eq('bank_account_id', id)
      .order('date', { ascending: false })

    if (transactionsError) {
      throw new Error(`Erro ao buscar transacoes bancarias: ${transactionsError.message}`)
    }

    return {
      success: true,
      data: {
        account,
        transactions: transactions ?? [],
      },
    }
  } catch (error) {
    console.error('Erro ao buscar conta bancaria:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function createBankAccount(input: z.infer<typeof baseBankAccountSchema>) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const validatedData = baseBankAccountSchema.parse(input)

    const { data, error } = await supabase
      .from('bank_accounts')
      .insert({
        ...validatedData,
        tenant_id: session.tenant_id,
      })
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erro ao criar conta bancaria: ${error.message}`)
    }

    revalidatePath('/bancos')
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao criar conta bancaria:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function createBankAccountFromForm(
  _prevState: BankAccountFormState,
  formData: FormData
): Promise<BankAccountFormState> {
  const balanceRaw = formData.get('balance')?.toString().trim()
  let balance: number | undefined

  if (balanceRaw && balanceRaw.length > 0) {
    const parsedBalance = Number(balanceRaw.replace(',', '.'))

    if (Number.isNaN(parsedBalance)) {
      return {
        status: 'error',
        message: 'Saldo inicial invalido.',
      }
    }

    balance = parsedBalance
  }

  const input = {
    name: (formData.get('name') ?? '').toString(),
    bank_code: (formData.get('bank_code') ?? '').toString(),
    bank_name: (formData.get('bank_name') ?? '').toString(),
    agency: (formData.get('agency') ?? '').toString(),
    account_number: (formData.get('account_number') ?? '').toString(),
    account_type: (formData.get('account_type') ?? 'checking').toString(),
    balance,
  }

  const parsed = baseBankAccountSchema.safeParse(input)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Nao foi possivel validar a conta bancaria.',
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const result = await createBankAccount(parsed.data)

  if (!result.success) {
    return {
      status: 'error',
      message: result.error ?? 'Erro desconhecido ao criar conta bancaria.',
    }
  }

  return {
    status: 'success',
    message: 'Conta bancaria criada com sucesso.',
  }
}

export async function updateBankAccount(id: string, input: z.infer<typeof updateBankAccountSchema>) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const validatedData = updateBankAccountSchema.parse(input)
    const cleanData = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== undefined && value !== null)
    )

    if (Object.keys(cleanData).length === 0) {
      throw new Error('Nenhum dado informado para atualizacao.')
    }

    const { data, error } = await supabase
      .from('bank_accounts')
      .update(cleanData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar conta bancaria: ${error.message}`)
    }

    revalidatePath('/bancos')
    revalidatePath(`/bancos/${id}`)
    return { success: true, data }
  } catch (error) {
    console.error('Erro ao atualizar conta bancaria:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function updateBankAccountFromForm(
  _prevState: BankAccountFormState,
  formData: FormData
): Promise<BankAccountFormState> {
  const id = (formData.get('id') ?? '').toString()

  if (!id) {
    return {
      status: 'error',
      message: 'Conta bancaria nao encontrada para edicao.',
    }
  }

  const balanceRaw = formData.get('balance')?.toString().trim()
  let balance: number | undefined

  if (balanceRaw && balanceRaw.length > 0) {
    const parsedBalance = Number(balanceRaw.replace(',', '.'))

    if (Number.isNaN(parsedBalance)) {
      return {
        status: 'error',
        message: 'Saldo informado invalido.',
      }
    }

    balance = parsedBalance
  }

  const input = {
    name: formData.get('name') ? formData.get('name')!.toString() : undefined,
    bank_code: formData.get('bank_code') ? formData.get('bank_code')!.toString() : undefined,
    bank_name: formData.get('bank_name') ? formData.get('bank_name')!.toString() : undefined,
    agency: formData.get('agency') ? formData.get('agency')!.toString() : undefined,
    account_number: formData.get('account_number')
      ? formData.get('account_number')!.toString()
      : undefined,
    account_type: formData.get('account_type') ? formData.get('account_type')!.toString() : undefined,
    balance,
    is_active: formData.get('is_active') ? formData.get('is_active')!.toString() === 'true' : undefined,
  }

  const parsed = updateBankAccountSchema.safeParse(input)

  if (!parsed.success) {
    return {
      status: 'error',
      message: 'Nao foi possivel validar os dados da conta bancaria.',
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

  const result = await updateBankAccount(id, cleanData)

  if (!result.success) {
    return {
      status: 'error',
      message: result.error ?? 'Erro desconhecido ao atualizar conta bancaria.',
    }
  }

  return {
    status: 'success',
    message: 'Conta bancaria atualizada com sucesso.',
  }
}

export async function deleteBankAccount(id: string) {
  try {
    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    const { error } = await supabase.from('bank_accounts').delete().eq('id', id)

    if (error) {
      throw new Error(`Erro ao excluir conta bancaria: ${error.message}`)
    }

    revalidatePath('/bancos')
    revalidatePath(`/bancos/${id}`)
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir conta bancaria:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    }
  }
}

export async function importBankTransactionsFromCSV(
  _prevState: BankTransactionImportState,
  formData: FormData
): Promise<BankTransactionImportState> {
  const bankAccountId = (formData.get('bank_account_id') ?? '').toString()

  if (!bankAccountId) {
    return {
      status: 'error',
      message: 'Selecione uma conta bancaria para importar.',
    }
  }

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

    const headers = lines[0]
      .split(',')
      .map(header => header.trim().toLowerCase())

    const session = await requireAuth()
    const supabase = await setRLSContext(session)

    if (!supabase) {
      throw new Error('Falha ao preparar contexto de seguranca')
    }

    let processed = 0
    let imported = 0
    let skipped = 0

    const payload: Array<Record<string, unknown>> = []

    for (const line of lines.slice(1)) {
      processed += 1
      const values = line.split(',').map(value => value.trim())
      const row: Record<string, string> = {}

      headers.forEach((header, index) => {
        row[header] = values[index] ?? ''
      })

      const normalizedType = row.type ? row.type.toLowerCase() : undefined
      const typeValue = normalizedType === 'debit' || normalizedType === 'credit' ? normalizedType : undefined

      const statusValue = row.status ? row.status.toLowerCase() : 'pending'
      const normalizedStatus = ['pending', 'reconciled', 'ignored'].includes(statusValue)
        ? statusValue
        : 'pending'

      const amountValue = row.amount?.replace(',', '.') ?? ''
      const parsedAmount = amountValue.length > 0 ? Number(amountValue) : Number.NaN

      const dateValue = row.date ?? ''
      const parsedDate = dateValue.length > 0 ? new Date(dateValue) : new Date('invalid')

      const candidate = {
        bank_account_id: bankAccountId,
        external_id: row.external_id ?? '',
        description: row.description ?? '',
        amount: parsedAmount,
        date: parsedDate,
        type: typeValue ?? '',
        status: normalizedStatus,
      }

      const parsed = baseBankTransactionSchema.safeParse(candidate)

      if (!parsed.success) {
        skipped += 1
        continue
      }

      payload.push({
        ...parsed.data,
        tenant_id: session.tenant_id,
      })
      imported += 1
    }

    if (payload.length > 0) {
      const { error } = await supabase
        .from('bank_transactions')
        .upsert(payload, { onConflict: 'tenant_id,external_id', ignoreDuplicates: true })

      if (error) {
        throw new Error(`Erro ao importar transacoes: ${error.message}`)
      }

      revalidatePath('/bancos')
      revalidatePath(`/bancos/${bankAccountId}`)
    }

    return {
      status: 'success',
      message: 'Importacao de transacoes concluida.',
      summary: {
        processed,
        imported,
        skipped,
      },
    }
  } catch (error) {
    console.error('Erro ao importar transacoes bancarias:', error)
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Erro desconhecido ao importar transacoes.',
    }
  }
}
