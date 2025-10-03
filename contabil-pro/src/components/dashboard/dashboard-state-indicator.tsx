/**
 * Indicador de Estado do Dashboard
 *
 * Mostra ao usuário o status dos dados (tempo real, cache, erro)
 * com timestamp e ações de recuperação
 */

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { ResilientResponse } from '@/lib/resilience'

import { AlertCircle, Clock, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface DashboardStateIndicatorProps {
  state: ResilientResponse<any>
  onRetry?: () => void
  className?: string
}

export function DashboardStateIndicator({
  state,
  onRetry,
  className = '',
}: DashboardStateIndicatorProps) {
  const { metadata } = state

  // Estado normal - dados em tempo real
  if (state.success && metadata.source === 'live' && !metadata.degraded) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Wifi className='h-4 w-4 text-green-500' />
        <span>Dados atualizados</span>
        <Badge variant='outline' className='text-xs'>
          Tempo real
        </Badge>
      </div>
    )
  }

  // Estado degradado - dados em cache
  if (metadata.source === 'cache' || metadata.source === 'fallback') {
    const isStale = metadata.degraded
    const timeAgo = metadata.lastSuccessAt
      ? formatTimeAgo(metadata.lastSuccessAt)
      : 'há alguns minutos'

    return (
      <Alert
        className={`${className} ${isStale ? 'border-yellow-200 bg-yellow-50' : 'border-blue-200 bg-blue-50'}`}
      >
        <Clock className='h-4 w-4' />
        <AlertDescription className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <span>
              {isStale
                ? `Dados de ${timeAgo} (alguns dados podem estar desatualizados)`
                : `Dados de ${timeAgo}`}
            </span>
            <Badge variant={isStale ? 'destructive' : 'secondary'} className='text-xs'>
              {isStale ? 'Desatualizado' : 'Cache'}
            </Badge>
          </div>
          {onRetry && (
            <Button variant='outline' size='sm' onClick={onRetry} className='ml-4'>
              <RefreshCw className='h-3 w-3 mr-1' />
              Atualizar
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Estado de erro
  if (!state.success) {
    return (
      <Alert className={`${className} border-red-200 bg-red-50`}>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <WifiOff className='h-4 w-4 text-red-500' />
            <span>{metadata.userMessage || 'Erro ao carregar dados'}</span>
            <Badge variant='destructive' className='text-xs'>
              Erro
            </Badge>
          </div>
          {onRetry && (
            <Button variant='outline' size='sm' onClick={onRetry} className='ml-4'>
              <RefreshCw className='h-3 w-3 mr-1' />
              Tentar novamente
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Estado desconhecido
  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      <AlertCircle className='h-4 w-4 text-gray-400' />
      <span>Estado desconhecido</span>
    </div>
  )
}

/**
 * Versão compacta para usar em cards
 */
export function DashboardStateIndicatorCompact({
  state,
  onRetry,
  className = '',
}: DashboardStateIndicatorProps) {
  const { metadata } = state

  if (state.success && metadata.source === 'live' && !metadata.degraded) {
    return (
      <Badge variant='outline' className={`text-xs ${className}`}>
        <Wifi className='h-3 w-3 mr-1 text-green-500' />
        Atual
      </Badge>
    )
  }

  if (metadata.source === 'cache' || metadata.source === 'fallback') {
    const timeAgo = metadata.lastSuccessAt ? formatTimeAgo(metadata.lastSuccessAt) : 'cache'

    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Badge variant={metadata.degraded ? 'destructive' : 'secondary'} className='text-xs'>
          <Clock className='h-3 w-3 mr-1' />
          {timeAgo}
        </Badge>
        {onRetry && (
          <Button variant='ghost' size='sm' onClick={onRetry} className='h-6 w-6 p-0'>
            <RefreshCw className='h-3 w-3' />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <Badge variant='destructive' className='text-xs'>
        <WifiOff className='h-3 w-3 mr-1' />
        Erro
      </Badge>
      {onRetry && (
        <Button variant='ghost' size='sm' onClick={onRetry} className='h-6 w-6 p-0'>
          <RefreshCw className='h-3 w-3' />
        </Button>
      )}
    </div>
  )
}

/**
 * Formatar tempo relativo de forma amigável
 */
function formatTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))

  if (diffMinutes < 1) return 'agora'
  if (diffMinutes < 60) return `${diffMinutes}min`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours}h`

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d`
}
