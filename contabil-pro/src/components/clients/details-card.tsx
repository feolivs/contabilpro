import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDocument } from '@/lib/validation'

import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface DetailItem {
  label: string
  value: string | number | null | undefined
  format?: 'currency' | 'date' | 'document' | 'phone' | 'percentage'
}

interface ClientDetailsCardProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
  data: DetailItem[]
}

function formatValue(
  value: string | number | null | undefined,
  formatType?: 'currency' | 'date' | 'document' | 'phone' | 'percentage'
): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  switch (formatType) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(Number(value))

    case 'date':
      try {
        const date = new Date(value)
        return format(date, 'dd/MM/yyyy', { locale: ptBR })
      } catch {
        return String(value)
      }

    case 'document':
      return formatDocument(String(value))

    case 'phone':
      const phone = String(value).replace(/\D/g, '')
      if (phone.length === 11) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7)}`
      }
      if (phone.length === 10) {
        return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`
      }
      return String(value)

    case 'percentage':
      return `${Number(value).toFixed(1)}%`

    default:
      return String(value)
  }
}

export function ClientDetailsCard({ title, icon: Icon, data }: ClientDetailsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg'>
          {Icon && <Icon className='h-5 w-5 text-muted-foreground' />}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className='space-y-3'>
          {data.map((item, index) => (
            <div key={index} className='flex justify-between gap-4'>
              <dt className='text-sm text-muted-foreground'>{item.label}:</dt>
              <dd className='text-sm font-medium text-right'>
                {formatValue(item.value, item.format)}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}

// Variante compacta para uso em modais ou sidebars
export function ClientDetailsCardCompact({ title, icon: Icon, data }: ClientDetailsCardProps) {
  return (
    <div className='space-y-2'>
      <h3 className='flex items-center gap-2 text-sm font-semibold'>
        {Icon && <Icon className='h-4 w-4 text-muted-foreground' />}
        {title}
      </h3>
      <dl className='space-y-2 pl-6'>
        {data.map((item, index) => (
          <div key={index} className='flex justify-between gap-4 text-xs'>
            <dt className='text-muted-foreground'>{item.label}:</dt>
            <dd className='font-medium text-right'>{formatValue(item.value, item.format)}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
