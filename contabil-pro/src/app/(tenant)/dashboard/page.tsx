import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { SectionCards } from '@/components/section-cards'

export default function DashboardPage() {
  return (
    <div className='space-y-6 p-6'>
      <header className='space-y-1'>
        <h1 className='text-3xl font-bold tracking-tight'>Dashboard</h1>
        <p className='text-sm text-muted-foreground'>Resumo do dia para o escritorio selecionado.</p>
      </header>

      <SectionCards />

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <div className='md:col-span-2 lg:col-span-2'>
          <ChartAreaInteractive />
        </div>
        <aside className='space-y-3 rounded-lg border p-4'>
          <h2 className='font-semibold'>Atividades recentes</h2>
          <ul className='space-y-2 text-sm text-muted-foreground'>
            <li>- NFe 123 emitida para Fornecedor Alfa</li>
            <li>- Conciliacao bancaria concluida para Banco XPTO</li>
            <li>- 5 lancamentos classificados pela IA</li>
          </ul>
        </aside>
      </div>
    </div>
  )
}
