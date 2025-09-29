'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { IconAlertTriangle, IconTrendingUp } from '@tabler/icons-react'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface CashFlowProjectionProps {
  data?: Array<{
    date: string
    projected: number
    confirmed: number
  }>
  riskDays?: number | null
}

const mockData = [
  { date: '2025-10-01', projected: 50000, confirmed: 50000 },
  { date: '2025-10-05', projected: 48000, confirmed: 48000 },
  { date: '2025-10-10', projected: 52000, confirmed: 52000 },
  { date: '2025-10-15', projected: 45000, confirmed: 45000 },
  { date: '2025-10-20', projected: 38000, confirmed: 0 },
  { date: '2025-10-25', projected: 42000, confirmed: 0 },
  { date: '2025-10-30', projected: 48000, confirmed: 0 },
  { date: '2025-11-05', projected: 35000, confirmed: 0 },
  { date: '2025-11-10', projected: 28000, confirmed: 0 },
  { date: '2025-11-15', projected: 22000, confirmed: 0 },
  { date: '2025-11-20', projected: 18000, confirmed: 0 },
  { date: '2025-11-25', projected: -5000, confirmed: 0 }, // Risco!
  { date: '2025-11-30', projected: -12000, confirmed: 0 },
]

const chartConfig = {
  confirmed: {
    label: 'Confirmado',
    color: 'hsl(var(--chart-1))',
  },
  projected: {
    label: 'Projetado',
    color: 'hsl(var(--chart-2))',
  },
}

export function CashFlowProjection({ data = mockData, riskDays = 52 }: CashFlowProjectionProps) {
  const hasRisk = riskDays !== null && riskDays > 0

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">Fluxo de Caixa Projetado</CardTitle>
            <CardDescription className="text-xs">Próximos 60 dias</CardDescription>
          </div>
          {hasRisk && (
            <Badge
              variant="outline"
              className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400"
            >
              <IconAlertTriangle className="h-3 w-3 mr-1" />
              Risco
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasRisk && (
          <Alert className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
            <IconAlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <AlertDescription className="text-xs">
              <span className="font-semibold">Atenção:</span> Risco de caixa negativo em{' '}
              <span className="font-semibold">{riskDays} dias</span>. Considere antecipar
              recebíveis ou postergar despesas.
            </AlertDescription>
          </Alert>
        )}

        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillConfirmed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="fillProjected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                })
              }}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                  notation: 'compact',
                }).format(value)
              }
              className="text-xs"
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(value).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                    })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="confirmed"
              type="monotone"
              fill="url(#fillConfirmed)"
              stroke="var(--chart-1)"
              strokeWidth={2}
              name="Confirmado"
            />
            <Area
              dataKey="projected"
              type="monotone"
              fill="url(#fillProjected)"
              stroke="var(--chart-2)"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Projetado"
            />
          </AreaChart>
        </ChartContainer>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-chart-1" />
              <span className="text-muted-foreground">Confirmado</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-chart-2" />
              <span className="text-muted-foreground">Projetado</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <IconTrendingUp className="h-3 w-3" />
            <span>Baseado em histórico</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

