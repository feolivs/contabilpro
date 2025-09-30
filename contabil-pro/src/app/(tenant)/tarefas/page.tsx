import { headers } from 'next/headers'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'
import { requirePermission } from '@/lib/auth/rbac'

export default async function TarefasPage() {
  await requirePermission('tarefas.read')

  const headersList = await headers()
  const dashboardUrl = buildTenantUrlFromHeaders(headersList, '/dashboard')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Tarefas</h1>
          <p className='text-muted-foreground'>
            Execução e acompanhamento de prazos e responsabilidades.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='sm' disabled>
            Filtrar tarefas
          </Button>
          <Button size='sm' disabled>
            Nova tarefa
          </Button>
        </div>
      </div>

      {/* Kanban Placeholder */}
      <div className='grid gap-4 md:grid-cols-3'>
        <div className='rounded-lg border p-4'>
          <h3 className='font-semibold text-sm text-muted-foreground mb-3'>A FAZER</h3>
          <div className='space-y-2'>
            <div className='rounded border border-dashed p-3 text-center text-sm text-muted-foreground'>
              Nenhuma tarefa
            </div>
          </div>
        </div>

        <div className='rounded-lg border p-4'>
          <h3 className='font-semibold text-sm text-muted-foreground mb-3'>FAZENDO</h3>
          <div className='space-y-2'>
            <div className='rounded border border-dashed p-3 text-center text-sm text-muted-foreground'>
              Nenhuma tarefa
            </div>
          </div>
        </div>

        <div className='rounded-lg border p-4'>
          <h3 className='font-semibold text-sm text-muted-foreground mb-3'>FEITO</h3>
          <div className='space-y-2'>
            <div className='rounded border border-dashed p-3 text-center text-sm text-muted-foreground'>
              Nenhuma tarefa
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
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
              <path d='M9 12l2 2 4-4' />
              <path d='M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1h18z' />
              <path d='M3 12v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6' />
            </svg>
          </div>
          <h3 className='mt-4 text-lg font-semibold'>Sem tarefas pendentes</h3>
          <p className='mb-4 mt-2 text-sm text-muted-foreground'>
            Crie sua primeira tarefa para começar a organizar seu trabalho e acompanhar prazos
            importantes.
          </p>
          <Button disabled>Adicionar tarefa</Button>
        </div>
      </div>

      <div className='text-center'>
        <Link href={dashboardUrl} className='text-sm text-primary hover:underline'>
          ← Voltar para o dashboard
        </Link>
      </div>
    </div>
  )
}
