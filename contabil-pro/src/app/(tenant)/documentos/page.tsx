import { headers } from 'next/headers'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/rbac'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'

export default async function DocumentosPage() {
  await requirePermission('documentos.read')

  const headersList = await headers()
  const dashboardUrl = buildTenantUrlFromHeaders(headersList, '/dashboard')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Documentos</h1>
          <p className='text-muted-foreground'>
            Central de arquivos, uploads e gestão documental.
          </p>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button variant='outline' size='sm' disabled>
            Buscar documentos
          </Button>
          <Button size='sm' disabled>
            Upload de arquivo
          </Button>
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
              <path d='M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' />
              <polyline points='14,2 14,8 20,8' />
              <line x1='12' x2='8' y1='18' y2='18' />
              <line x1='12' x2='8' y1='14' y2='14' />
            </svg>
          </div>
          <h3 className='mt-4 text-lg font-semibold'>Nenhum documento encontrado</h3>
          <p className='mb-4 mt-2 text-sm text-muted-foreground'>
            Arraste PDFs, imagens ou CSVs para fazer upload, ou use o botão acima
            para começar a organizar seus documentos.
          </p>
          <div className='flex items-center gap-2'>
            <Button disabled>
              Fazer upload
            </Button>
            <Button variant='outline' disabled>
              Importar pasta
            </Button>
          </div>
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
