import { headers } from 'next/headers'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermission } from '@/lib/auth/rbac'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'

export default async function PropostasPage() {
  await requirePermission('propostas.read')

  const headersList = await headers()
  const dashboardUrl = buildTenantUrlFromHeaders(headersList, '/dashboard')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Propostas</h1>
          <p className='text-muted-foreground'>
            Gestão de propostas comerciais e acompanhamento de negociações.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='sm' disabled>
            Filtrar propostas
          </Button>
          <Button size='sm' disabled>
            Nova proposta
          </Button>
        </div>
      </div>

      {/* Pipeline de Propostas */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm text-muted-foreground'>RASCUNHO</CardTitle>
            <CardDescription className='text-2xl font-bold text-foreground'>0</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded border border-dashed p-3 text-center text-sm text-muted-foreground'>
              Nenhuma proposta
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm text-muted-foreground'>ENVIADA</CardTitle>
            <CardDescription className='text-2xl font-bold text-foreground'>0</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded border border-dashed p-3 text-center text-sm text-muted-foreground'>
              Nenhuma proposta
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm text-muted-foreground'>NEGOCIAÇÃO</CardTitle>
            <CardDescription className='text-2xl font-bold text-foreground'>0</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded border border-dashed p-3 text-center text-sm text-muted-foreground'>
              Nenhuma proposta
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm text-muted-foreground'>FECHADA</CardTitle>
            <CardDescription className='text-2xl font-bold text-foreground'>0</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='rounded border border-dashed p-3 text-center text-sm text-muted-foreground'>
              Nenhuma proposta
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Propostas */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Propostas</CardTitle>
          <CardDescription>Histórico completo de propostas comerciais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center'>
            <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
              <div className='flex h-20 w-20 items-center justify-center rounded-full bg-muted'>
                <svg
                  className='h-10 w-10 text-muted-foreground'
                  fill='none'
                  height='24'
                  stroke='currentColor'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                  width='24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2' />
                  <circle cx='9' cy='7' r='4' />
                  <path d='M22 21v-2a4 4 0 0 0-3-3.87' />
                  <path d='M16 3.13a4 4 0 0 1 0 7.75' />
                </svg>
              </div>
              <h3 className='mt-4 text-lg font-semibold'>Nenhuma proposta criada</h3>
              <p className='mb-4 mt-2 text-sm text-muted-foreground'>
                Crie sua primeira proposta comercial para começar a acompanhar negociações e fechar
                novos contratos.
              </p>
              <div className='flex items-center gap-2'>
                <Button disabled>Criar proposta</Button>
                <Button variant='outline' disabled>
                  Importar template
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className='text-center'>
        <Link href={dashboardUrl} className='text-sm text-primary hover:underline'>
          ← Voltar para o dashboard
        </Link>
      </div>
    </div>
  )
}
