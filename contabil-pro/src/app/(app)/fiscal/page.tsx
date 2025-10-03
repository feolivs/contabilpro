import Link from 'next/link'

import { getTaxObligations, getTaxObligationStats } from '@/actions/tax-obligations'
import { FiscalCalendar } from '@/components/fiscal/fiscal-calendar'
import { FiscalStats } from '@/components/fiscal/fiscal-stats'
import { ObligationsList } from '@/components/fiscal/obligations-list'
import { Button } from '@/components/ui/button'
import { requirePermission } from '@/lib/auth/rbac'

import { IconPlus } from '@tabler/icons-react'
import { addDays, addMonths, endOfMonth, startOfMonth } from 'date-fns'

export default async function FiscalPage() {
  await requirePermission('fiscal.read')

  // Buscar obrigações dos próximos 3 meses
  const threeMonthsFromNow = addMonths(new Date(), 3)
  const obligationsResult = await getTaxObligations({
    from_date: startOfMonth(new Date()).toISOString().split('T')[0],
    to_date: endOfMonth(threeMonthsFromNow).toISOString().split('T')[0],
  })

  // Buscar estatísticas
  const statsResult = await getTaxObligationStats()

  const obligations = obligationsResult.success ? obligationsResult.data : []
  const stats = statsResult.success
    ? statsResult.data
    : {
        total: 0,
        pending: 0,
        calculated: 0,
        paid: 0,
        overdue: 0,
        total_amount: 0,
        pending_amount: 0,
        overdue_amount: 0,
      }

  // Filtrar obrigações dos próximos 30 dias para a lista
  const thirtyDaysFromNow = addDays(new Date(), 30)
  const upcomingObligations = obligations.filter(o => {
    const dueDate = new Date(o.due_date)
    return dueDate <= thirtyDaysFromNow
  })

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Fiscal</h1>
          <p className='text-muted-foreground'>Gestão de obrigações fiscais, DAS, NFe e NFS-e.</p>
        </div>
        <div className='flex items-center gap-2'>
          <Button size='sm' disabled>
            <IconPlus className='h-4 w-4 mr-2' />
            Nova Obrigação
          </Button>
          <Link href='/dashboard'>
            <Button variant='outline' size='sm'>
              ← Voltar
            </Button>
          </Link>
        </div>
      </div>

      {/* Estatísticas */}
      <FiscalStats stats={stats} />

      {/* Grid: Calendário + Lista */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Calendário (2 colunas) */}
        <div className='lg:col-span-2'>
          <FiscalCalendar obligations={obligations} />
        </div>

        {/* Lista de próximas obrigações (1 coluna) */}
        <div className='lg:col-span-1'>
          <ObligationsList obligations={upcomingObligations} />
        </div>
      </div>
    </div>
  )
}
