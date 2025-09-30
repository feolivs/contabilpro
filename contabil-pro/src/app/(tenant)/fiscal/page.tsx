import { headers } from 'next/headers'
import Link from 'next/link'

import { buildTenantUrlFromHeaders } from '@/lib/navigation'
import { requirePermission } from '@/lib/auth/rbac'

export default async function FiscalPage() {
  await requirePermission('fiscal.read')

  const headersList = await headers()
  const dashboardUrl = buildTenantUrlFromHeaders(headersList, '/dashboard')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Fiscal</h1>
          <p className='text-muted-foreground'>Gestão de obrigações fiscais, DAS, NFe e NFS-e.</p>
        </div>
        <Link href={dashboardUrl} className='text-sm text-primary hover:underline'>
          ← Voltar para o dashboard
        </Link>
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
              <line x1='16' x2='8' y1='13' y2='13' />
              <line x1='16' x2='8' y1='17' y2='17' />
              <polyline points='10,9 9,9 8,9' />
            </svg>
          </div>
          <h3 className='mt-4 text-lg font-semibold'>Área fiscal em construção</h3>
          <p className='mb-4 mt-2 text-sm text-muted-foreground'>
            Em breve você verá aqui a gestão completa de obrigações fiscais, cálculo de DAS,
            importação de NFe e emissão de NFS-e.
          </p>
        </div>
      </div>
    </div>
  )
}
