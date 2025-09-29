'use client'

import * as React from 'react'

import type { TrendPoint } from '@/types/dashboard'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useIsMobile } from '@/hooks/use-mobile'

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'

export const description = 'Receita e despesa agregadas por dia'

const chartConfig = {
  revenue: {
    label: 'Receita',
    color: 'hsl(var(--chart-1))',
  },
  expense: {
    label: 'Despesas',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  data: TrendPoint[]
}

type TimeRange = '7d' | '30d' | '90d'

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<TimeRange>('90d')

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange('7d')
    }
  }, [isMobile])

  const sortedData = React.useMemo(
    () => [...data].sort((a, b) => new Date(a.bucket).getTime() - new Date(b.bucket).getTime()),
    [data]
  )

  const filteredData = React.useMemo(() => {
    if (sortedData.length === 0) {
      return []
    }

    const endDate = new Date(sortedData[sortedData.length - 1].bucket)
    let days = 90
    if (timeRange === '30d') {
      days = 30
    } else if (timeRange === '7d') {
      days = 7
    }

    const startDate = new Date(endDate)
    startDate.setDate(startDate.getDate() - (days - 1))

    return sortedData.filter(point => {
      const pointDate = new Date(point.bucket)
      return pointDate >= startDate && pointDate <= endDate
    })
  }, [sortedData, timeRange])

  const chartData = filteredData.length > 0 ? filteredData : sortedData

  return (
    <Card className='@container/card'>
      <CardHeader>
        <CardTitle>Receita x Despesa</CardTitle>
        <CardDescription>
          <span className='hidden @[540px]/card:block'>Desempenho acumulado por dia</span>
          <span className='@[540px]/card:hidden'>Visao diaria</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type='single'
            value={timeRange}
            onValueChange={value => value && setTimeRange(value as TimeRange)}
            variant='outline'
            className='hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex'
          >
            <ToggleGroupItem value='90d'>90 dias</ToggleGroupItem>
            <ToggleGroupItem value='30d'>30 dias</ToggleGroupItem>
            <ToggleGroupItem value='7d'>7 dias</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={value => setTimeRange(value as TimeRange)}>
            <SelectTrigger
              className='flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden'
              size='sm'
              aria-label='Selecionar intervalo'
            >
              <SelectValue placeholder='Selecionar intervalo' />
            </SelectTrigger>
            <SelectContent className='rounded-xl'>
              <SelectItem value='90d' className='rounded-lg'>
                Ultimos 90 dias
              </SelectItem>
              <SelectItem value='30d' className='rounded-lg'>
                Ultimos 30 dias
              </SelectItem>
              <SelectItem value='7d' className='rounded-lg'>
                Ultimos 7 dias
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className='px-2 pt-4 sm:px-6 sm:pt-6'>
        <ChartContainer config={chartConfig} className='aspect-auto h-[250px] w-full'>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id='fillRevenue' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--chart-1)' stopOpacity={0.8} />
                <stop offset='95%' stopColor='var(--chart-1)' stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id='fillExpense' x1='0' y1='0' x2='0' y2='1'>
                <stop offset='5%' stopColor='var(--chart-2)' stopOpacity={0.8} />
                <stop offset='95%' stopColor='var(--chart-2)' stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey='bucket'
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={value =>
                new Date(value).toLocaleDateString('pt-BR', {
                  month: 'short',
                  day: 'numeric',
                })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={value =>
                    new Date(value).toLocaleDateString('pt-BR', {
                      day: 'numeric',
                      month: 'long',
                    })
                  }
                  indicator='dot'
                />
              }
            />
            <Area
              dataKey='expense'
              type='natural'
              fill='url(#fillExpense)'
              stroke='var(--chart-2)'
              stackId='a'
              name='Despesas'
            />
            <Area
              dataKey='revenue'
              type='natural'
              fill='url(#fillRevenue)'
              stroke='var(--chart-1)'
              stackId='a'
              name='Receita'
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
