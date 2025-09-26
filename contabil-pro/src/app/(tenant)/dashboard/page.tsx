import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { SectionCards } from '@/components/section-cards'

export default function DashboardPage() {
  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-muted-foreground'>Visão geral do seu sistema contábil</p>
      </div>

      <SectionCards />

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <div className='md:col-span-2 lg:col-span-2'>
          <ChartAreaInteractive />
        </div>
        <div className='space-y-4'>
          <div className='rounded-lg border p-4'>
            <h3 className='font-semibold mb-2'>Atividades Recentes</h3>
            <div className='space-y-2 text-sm text-muted-foreground'>
              <p>• NFe #123 emitida</p>
              <p>• Conciliação bancária realizada</p>
              <p>• 5 lançamentos classificados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
