import { headers } from 'next/headers'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { requirePermission } from '@/lib/rbac'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'

export default async function CopilotoPage() {
  await requirePermission('copiloto.read')

  const headersList = await headers()
  const dashboardUrl = buildTenantUrlFromHeaders(headersList, '/dashboard')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Copiloto IA</h1>
          <p className='text-muted-foreground'>
            Central de conversa e ações guiadas por inteligência artificial.
          </p>
        </div>
      </div>

      {/* Layout do Assistente */}
      <div className='grid gap-6 lg:grid-cols-4'>
        {/* Chat Principal */}
        <div className='lg:col-span-3'>
          <Card className='h-[600px] flex flex-col'>
            <CardHeader className='pb-3'>
              <div className='flex items-center gap-2'>
                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary'>
                  <svg
                    className='h-4 w-4 text-primary-foreground'
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
                    <path d='M12 2L2 7l10 5 10-5-10-5z' />
                    <path d='M2 17l10 5 10-5' />
                    <path d='M2 12l10 5 10-5' />
                  </svg>
                </div>
                <div>
                  <CardTitle className='text-lg'>Assistente ContabilPRO</CardTitle>
                  <CardDescription>Como posso ajudar você hoje?</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='flex-1 flex flex-col'>
              {/* Área de Chat */}
              <div className='flex-1 rounded-lg border border-dashed p-8 flex items-center justify-center'>
                <div className='text-center'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-muted mx-auto mb-4'>
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
                      <path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' />
                    </svg>
                  </div>
                  <h3 className='font-semibold mb-2'>Inicie uma conversa</h3>
                  <p className='text-sm text-muted-foreground mb-4'>
                    Digite uma pergunta ou use um dos comandos sugeridos abaixo.
                  </p>
                </div>
              </div>

              {/* Input de Chat */}
              <div className='mt-4 flex gap-2'>
                <div className='flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                  Digite sua mensagem... (ex: /resumo, /conciliar, /explicar)
                </div>
                <Button disabled>Enviar</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel Lateral */}
        <div className='space-y-4'>
          {/* Contexto */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>Contexto</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <div className='rounded-lg bg-muted p-2 text-xs'>
                <span className='font-medium'>Cliente:</span> Todos
              </div>
              <div className='rounded-lg bg-muted p-2 text-xs'>
                <span className='font-medium'>Período:</span> Mês atual
              </div>
              <div className='rounded-lg bg-muted p-2 text-xs'>
                <span className='font-medium'>Conta:</span> Todas
              </div>
            </CardContent>
          </Card>

          {/* Sugestões */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>Sugestões</CardTitle>
            </CardHeader>
            <CardContent className='space-y-2'>
              <Button variant='outline' size='sm' className='w-full justify-start text-xs' disabled>
                📊 Resumo do mês
              </Button>
              <Button variant='outline' size='sm' className='w-full justify-start text-xs' disabled>
                🔄 Conciliação pendente
              </Button>
              <Button variant='outline' size='sm' className='w-full justify-start text-xs' disabled>
                📈 Análise de tendências
              </Button>
              <Button variant='outline' size='sm' className='w-full justify-start text-xs' disabled>
                ⚠️ Alertas fiscais
              </Button>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-sm'>Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='rounded-lg border border-dashed p-4 text-center'>
                <p className='text-xs text-muted-foreground'>
                  Insights aparecerão aqui conforme você usa o sistema
                </p>
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
