import { headers } from 'next/headers'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermission } from '@/lib/rbac'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'

export default async function RelatoriosPage() {
  await requirePermission('relatorios.read')

  const headersList = await headers()
  const dashboardUrl = buildTenantUrlFromHeaders(headersList, '/dashboard')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Relatórios</h1>
          <p className='text-muted-foreground'>
            Análise e exportação de dados contábeis e financeiros.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='sm' disabled>
            Filtros avançados
          </Button>
          <Button size='sm' disabled>
            Novo relatório
          </Button>
        </div>
      </div>

      {/* Layout 2 Colunas */}
      <div className='grid gap-6 lg:grid-cols-4'>
        {/* Filtros */}
        <div className='lg:col-span-1'>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>Filtros</CardTitle>
              <CardDescription>Configure os parâmetros do relatório</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <label className='text-sm font-medium'>Período</label>
                <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                  Selecione um período
                </div>
              </div>

              <div>
                <label className='text-sm font-medium'>Contas</label>
                <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                  Todas as contas
                </div>
              </div>

              <div>
                <label className='text-sm font-medium'>Clientes</label>
                <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                  Todos os clientes
                </div>
              </div>

              <Button className='w-full' disabled>
                Aplicar filtros
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Área Principal */}
        <div className='lg:col-span-3'>
          <Card className='h-[600px]'>
            <CardHeader>
              <CardTitle className='text-lg'>Demonstrativo de Resultados</CardTitle>
              <CardDescription>Receitas, despesas e resultado por período</CardDescription>
            </CardHeader>
            <CardContent className='flex-1'>
              {/* Placeholder para Tabela */}
              <div className='space-y-4'>
                <div className='rounded-lg border border-dashed p-8 text-center'>
                  <div className='mx-auto flex max-w-[420px] flex-col items-center justify-center text-center'>
                    <div className='flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
                      <svg
                        className='h-8 w-8 text-muted-foreground'
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
                        <path d='M3 3v18h18' />
                        <path d='M18.7 8l-5.1 5.2-2.8-2.7L7 14.3' />
                      </svg>
                    </div>
                    <h3 className='mt-4 text-lg font-semibold'>Selecione um período</h3>
                    <p className='mb-4 mt-2 text-sm text-muted-foreground'>
                      Configure os filtros ao lado para gerar seu relatório
                      com dados de receitas, despesas e análises.
                    </p>
                  </div>
                </div>

                {/* Placeholder para Gráficos */}
                <div className='grid gap-4 md:grid-cols-2'>
                  <div className='rounded-lg border border-dashed p-4 text-center'>
                    <p className='text-sm text-muted-foreground'>Gráfico de Tendência</p>
                  </div>
                  <div className='rounded-lg border border-dashed p-4 text-center'>
                    <p className='text-sm text-muted-foreground'>Composição por Categoria</p>
                  </div>
                </div>

                {/* Ações */}
                <div className='flex justify-end gap-2'>
                  <Button variant='outline' disabled>
                    Exportar CSV
                  </Button>
                  <Button variant='outline' disabled>
                    Exportar PDF
                  </Button>
                  <Button disabled>
                    Salvar filtros
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className='text-center'>
        <Link
          href={dashboardUrl}
          className='text-sm text-primary hover:underline'
        >
          ← Voltar para o dashboard
        </Link>
      </div>
    </div>
  )
}
