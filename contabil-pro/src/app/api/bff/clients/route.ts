import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { requirePermission } from '@/lib/rbac'
import { createServerClient } from '@/lib/supabase'
import { clientSchema } from '@/lib/validation'

const baseClientSchema = clientSchema.omit({
  id: true,
  tenant_id: true,
  created_at: true,
  updated_at: true,
})

// GET /api/bff/clients - Listar clientes
export async function GET() {
  try {
    // Guard RBAC - verificar permissao
    const context = await requirePermission('clientes.read')

    // Buscar clientes no Supabase
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('tenant_id', context.tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar clientes:', error)
      return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Erro na API de clientes:', error)

    if (error instanceof Error && error.message.includes('permissao negada')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

// POST /api/bff/clients - Criar cliente
export async function POST(request: NextRequest) {
  try {
    // Guard RBAC - verificar permissao
    const context = await requirePermission('clientes.write')

    const body = await request.json()
    const validatedData = baseClientSchema.parse(body)

    // Criar cliente no Supabase
    const supabase = await createServerClient()

    const { data, error } = await supabase
      .from('clients')
      .insert({
        ...validatedData,
        tenant_id: context.tenantId,
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar cliente:', error)
      return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 })
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Erro na API de clientes:', error)

    if (error instanceof Error && error.message.includes('permissao negada')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}
