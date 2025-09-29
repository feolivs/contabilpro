import type { RecentActivityItem } from '@/actions/dashboard'

import { Calendar, FileText, Sparkles, TrendingDown, TrendingUp, Wallet } from 'lucide-react'

interface RecentActivityListProps {
  items: RecentActivityItem[]
}

const DATE_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  dateStyle: 'short',
  timeStyle: 'short',
})

const SOURCE_LABEL: Record<string, string> = {
  entry: 'Lancamento',
  bank_transaction: 'Transacao bancaria',
  document: 'Documento',
  task: 'Tarefa',
  ai_insight: 'Insight de IA',
}

const SOURCE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  entry: TrendingUp,
  bank_transaction: Wallet,
  document: FileText,
  task: Calendar,
  ai_insight: Sparkles,
}

export function RecentActivityList({ items }: RecentActivityListProps) {
  if (items.length === 0) {
    return (
      <div className='rounded-lg border border-dashed p-4 text-sm text-muted-foreground'>
        Nenhuma atividade recente registrada no periodo selecionado.
      </div>
    )
  }

  return (
    <ul className='space-y-3'>
      {items.map(item => {
        const Icon = SOURCE_ICON[item.source] ?? TrendingDown
        const label = SOURCE_LABEL[item.source] ?? 'Atividade'
        const timestamp = DATE_FORMATTER.format(new Date(item.created_at))

        return (
          <li
            key={`${item.source}-${item.reference ?? item.created_at}`}
            className='flex items-start gap-3 rounded-md border p-3 text-sm'
          >
            <span
              className='bg-muted text-muted-foreground flex size-8 items-center justify-center rounded-full'
              aria-hidden
            >
              <Icon className='size-4' />
            </span>
            <div className='flex-1 space-y-1'>
              <p className='font-medium'>{item.title}</p>
              <p className='text-muted-foreground text-sm'>{item.description}</p>
              <div className='text-muted-foreground text-xs'>
                {label} • {timestamp}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
