import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/auth/rbac'
import { createServerClient } from '@/lib/supabase'
import { clientSchema } from '@/lib/validation'

const updateClientSchema = clientSchema
  .omit({
    id: true,
    tenant_id: true,
    created_at: true,
    updated_at: true,
  })
  .partial()

// GET /api/bff/clients/[id] - Buscar cliente por ID
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Guard RBAC - verificar permissão
    const context = await requirePermission('clientes.read')

    const { id } = await params

    // Buscar cliente no Supabase
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', context.tenantId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
      }

      console.error('Erro ao buscar cliente:', error)
      return NextResponse.json({ error: 'Erro ao buscar cliente' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro na API de cliente:', error)

    if (error instanceof Error && error.message.includes('Permissão negada')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// PUT /api/bff/clients/[id] - Atualizar cliente
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Guard RBAC - verificar permissão
    const context = await requirePermission('clientes.write')

    const { id } = await params
    const body = await request.json()
    const validatedData = updateClientSchema.parse(body)

    // Atualizar cliente no Supabase
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('clients')
      .update(validatedData)
      .eq('id', id)
      .eq('tenant_id', context.tenantId)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Cliente não encontrado' }, { status: 404 })
      }

      console.error('Erro ao atualizar cliente:', error)
      return NextResponse.json({ error: 'Erro ao atualizar cliente' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro na API de cliente:', error)

    if (error instanceof Error && error.message.includes('Permissão negada')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// DELETE /api/bff/clients/[id] - Deletar cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Guard RBAC - verificar permissão
    const context = await requirePermission('clientes.delete')

    const { id } = await params

    // Deletar cliente no Supabase
    const supabase = await createServerClient()

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
      .eq('tenant_id', context.tenantId)

    if (error) {
      console.error('Erro ao deletar cliente:', error)
      return NextResponse.json({ error: 'Erro ao deletar cliente' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro na API de cliente:', error)

    if (error instanceof Error && error.message.includes('Permissão negada')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
