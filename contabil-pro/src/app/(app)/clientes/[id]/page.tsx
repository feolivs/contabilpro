import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

import { getClientById } from '@/actions/clients'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermission } from '@/lib/auth/rbac'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'
import { ClientDetailsCard } from '@/components/clients/details-card'
import { ClientDocumentsSection } from '@/components/clients/client-documents-section'
import { ClientTasksSection } from '@/components/clients/client-tasks-section'
import {
  IconUser,
  IconFileText,
  IconMail,
  IconMapPin,
  IconCurrencyReal,
  IconSettings,
  IconNotes,
  IconClock
} from '@tabler/icons-react'

interface ClienteDetalheProps {
  params: Promise<{ id: string  }>
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) {
    return 'Sem registro'
  }

  const date = typeof value === 'string' ? new Date(value) : value

  if (Number.isNaN(date.getTime())) {
    return 'Sem registro'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default async function ClienteDetalhePage({ params }: ClienteDetalheProps) {
  const { id } = await params

  await requirePermission('clientes.read')

  const result = await getClientById(id)

  if (!result.success || !result.data) {
    notFound()
  }

  const client = result.data
  const headersList = await headers()
  const editUrl = buildTenantUrlFromHeaders(headersList, `/clientes/${id}/editar`)
  const listUrl = buildTenantUrlFromHeaders(headersList, '/clientes')

  // Preparar dados para os cards
  const dadosBasicos = [
    { label: 'Nome', value: client.name },
    { label: 'Documento', value: client.document, format: 'document' as const },
    { label: 'Tipo de Pessoa', value: client.tipo_pessoa === 'PF' ? 'Pessoa Física' : client.tipo_pessoa === 'PJ' ? 'Pessoa Jurídica' : null },
    { label: 'Status', value: client.status },
  ]

  const dadosFiscais = [
    { label: 'Regime Tributário', value: client.regime_tributario },
    { label: 'Inscrição Estadual', value: client.inscricao_estadual },
    { label: 'Inscrição Municipal', value: client.inscricao_municipal },
  ]

  const dadosContato = [
    { label: 'Email', value: client.email },
    { label: 'Telefone', value: client.phone, format: 'phone' as const },
    { label: 'Responsável', value: client.responsavel_nome },
    { label: 'Tel. Responsável', value: client.responsavel_telefone, format: 'phone' as const },
  ]

  const endereco = [
    { label: 'Endereço', value: client.address },
    { label: 'Cidade', value: client.city },
    { label: 'Estado', value: client.state },
    { label: 'CEP', value: client.cep || client.zip_code },
  ]

  const dadosFinanceiros = [
    { label: 'Valor do Plano', value: client.valor_plano, format: 'currency' as const },
    { label: 'Dia de Vencimento', value: client.dia_vencimento },
    { label: 'Forma de Cobrança', value: client.forma_cobranca },
  ]

  const dadosGestao = [
    { label: 'Última Atividade', value: client.ultima_atividade, format: 'date' as const },
    { label: 'Score de Risco', value: client.score_risco },
  ]

  // Badge de status
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    ativo: { label: 'Ativo', variant: 'default' },
    inativo: { label: 'Inativo', variant: 'secondary' },
    pendente: { label: 'Pendente', variant: 'outline' },
    suspenso: { label: 'Suspenso', variant: 'destructive' },
  }

  const statusInfo = statusConfig[client.status || 'ativo'] || { label: 'Ativo', variant: 'default' as const }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>{client.name}</h1>
          <p className='text-muted-foreground'>
            Detalhes completos do cadastro do cliente.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {client.regime_tributario && (
            <Badge variant="outline">{client.regime_tributario}</Badge>
          )}
          <Button asChild variant='outline' size='sm'>
            <Link href={listUrl}>Voltar</Link>
          </Button>
          <Button asChild size='sm'>
            <Link href={editUrl}>Editar cadastro</Link>
          </Button>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className='grid gap-6 md:grid-cols-2'>
        {/* Dados Básicos */}
        <ClientDetailsCard
          title="Dados Básicos"
          icon={IconUser}
          data={dadosBasicos}
        />

        {/* Dados Fiscais */}
        {(client.regime_tributario || client.inscricao_estadual || client.inscricao_municipal) && (
          <ClientDetailsCard
            title="Dados Fiscais"
            icon={IconFileText}
            data={dadosFiscais}
          />
        )}

        {/* Dados de Contato */}
        <ClientDetailsCard
          title="Dados de Contato"
          icon={IconMail}
          data={dadosContato}
        />

        {/* Endereço */}
        {(client.address || client.city || client.state || client.cep || client.zip_code) && (
          <ClientDetailsCard
            title="Endereço"
            icon={IconMapPin}
            data={endereco}
          />
        )}

        {/* Dados Financeiros */}
        {(client.valor_plano || client.dia_vencimento || client.forma_cobranca) && (
          <ClientDetailsCard
            title="Dados Financeiros"
            icon={IconCurrencyReal}
            data={dadosFinanceiros}
          />
        )}

        {/* Dados de Gestão */}
        {(client.ultima_atividade || client.score_risco) && (
          <ClientDetailsCard
            title="Gestão"
            icon={IconSettings}
            data={dadosGestao}
          />
        )}
      </div>

      {/* Observações */}
      {client.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <IconNotes className="h-5 w-5 text-muted-foreground" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-sm text-muted-foreground whitespace-pre-wrap'>{client.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Atividade Recente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconClock className="h-5 w-5 text-muted-foreground" />
            Atividade Recente
          </CardTitle>
          <CardDescription>Histórico de alterações e atividades.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-2 text-sm text-muted-foreground'>
          <p>
            Cadastro criado em{' '}
            <span className='font-medium text-foreground'>
              {formatDate(client.created_at ?? null)}
            </span>
          </p>
          <p>
            Última atualização em{' '}
            <span className='font-medium text-foreground'>
              {formatDate(client.updated_at ?? null)}
            </span>
          </p>
          {client.ultima_atividade && (
            <p>
              Última atividade registrada em{' '}
              <span className='font-medium text-foreground'>
                {formatDate(client.ultima_atividade)}
              </span>
            </p>
          )}
          <p className='pt-2 italic'>Em breve você verá tarefas e timeline vinculadas aqui.</p>
        </CardContent>
      </Card>

      {/* Tarefas do Cliente */}
      <ClientTasksSection
        clientId={client.id}
        clientName={client.name}
      />

      {/* Documentos do Cliente */}
      <ClientDocumentsSection
        clientId={client.id}
        clientName={client.name}
      />
    </div>
  )
}
