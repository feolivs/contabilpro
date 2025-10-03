'use client'

import { Badge } from '@/components/ui/badge'
import { ChartContainer } from '@/components/ui/chart'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-react'
import { Line, LineChart } from 'recharts'

interface CompactKPICardProps {
  title: string
  value: string
  change: number
  trend: 'up' | 'down'
  sparklineData?: Array<{ value: number }>
  icon?: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'success' | 'danger' | 'warning'
  tooltip?: string
  isEmpty?: boolean
  emptyHint?: string
}

const variantStyles = {
  default: 'hover:bg-accent/50',
  success: 'hover:bg-green-50 dark:hover:bg-green-950/20',
  danger: 'hover:bg-red-50 dark:hover:bg-red-950/20',
  warning: 'hover:bg-amber-50 dark:hover:bg-amber-950/20',
}

const badgeVariants = {
  up: {
    success:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/[0.12] dark:text-green-400 dark:border-green-900',
    danger:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/[0.12] dark:text-red-400 dark:border-red-900',
  },
  down: {
    success:
      'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/[0.12] dark:text-green-400 dark:border-green-900',
    danger:
      'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/[0.12] dark:text-red-400 dark:border-red-900',
  },
}

export function CompactKPICard({
  title,
  value,
  change,
  trend,
  sparklineData = [],
  icon,
  onClick,
  variant = 'default',
  tooltip,
  isEmpty = false,
  emptyHint = 'Sem dados no período',
}: CompactKPICardProps) {
  const isPositive = change >= 0
  const Icon = isPositive ? IconTrendingUp : IconTrendingDown
  const badgeVariant = isPositive ? badgeVariants[trend].success : badgeVariants[trend].danger

  const cardContent = (
    <button
      onClick={onClick}
      className={cn(
        // Spec: altura 80-96px, largura fixa 280px, padding 12-16px
        'group relative flex h-[88px] w-[280px] flex-shrink-0 flex-col justify-between overflow-hidden rounded-lg border bg-card p-4 text-left transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        onClick && variantStyles[variant],
        onClick && 'cursor-pointer',
        !onClick && 'cursor-default'
      )}
    >
      {/* Sparkline de fundo - Spec: altura 24px, 40% opacidade, z-index baixo */}
      {!isEmpty && sparklineData.length > 0 && (
        <div className='absolute bottom-0 left-0 right-0 h-6 opacity-40 dark:opacity-30'>
          <ChartContainer
            config={{
              value: { label: 'Valor', color: 'hsl(var(--primary))' },
            }}
            className='h-full w-full'
          >
            <LineChart data={sparklineData}>
              <Line
                type='monotone'
                dataKey='value'
                stroke='currentColor'
                strokeWidth={1.5}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}

      {/* Header: Ícone + Label + Badge */}
      <div className='relative z-10 flex items-start justify-between gap-2'>
        <div className='flex items-center gap-2 min-w-0 flex-1'>
          {/* Spec: ícone 18-20px, opacidade 60-70% */}
          {icon && <div className='flex-shrink-0 text-muted-foreground opacity-[0.65]'>{icon}</div>}
          {/* Spec: label 12-13px, medium, cor 60-70%, 1 linha com ellipsis */}
          <span className='text-[13px] font-medium text-muted-foreground/70 truncate leading-none'>
            {title}
          </span>
        </div>
        {/* Spec: badge 11-12px, altura 18-20px, ícone ▲▼, cor semântica */}
        {!isEmpty && (
          <Badge
            variant='outline'
            className={cn(
              'flex-shrink-0 h-[18px] gap-0.5 px-1.5 text-[11px] font-semibold whitespace-nowrap',
              badgeVariant
            )}
          >
            {isPositive ? '▲' : '▼'}
            {change >= 0 ? '+' : ''}
            {change.toFixed(1)}%
          </Badge>
        )}
      </div>

      {/* Valor Principal */}
      <div className='relative z-10 flex items-baseline justify-between gap-2'>
        <div className='min-w-0 flex-1'>
          {/* Spec: valor 24-28px, semibold, line-height 1.1 */}
          {isEmpty ? (
            <div className='flex flex-col gap-1'>
              <div className='text-[26px] font-semibold tabular-nums leading-[1.1] tracking-tight text-muted-foreground/50'>
                —
              </div>
              <div className='text-[11px] text-muted-foreground/60 leading-tight'>{emptyHint}</div>
            </div>
          ) : (
            <div className='text-[26px] font-semibold tabular-nums leading-[1.1] tracking-tight truncate'>
              {value}
            </div>
          )}
        </div>
      </div>
    </button>
  )

  // Wrap com tooltip se fornecido
  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
          <TooltipContent>
            <p className='text-xs'>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return cardContent
}
