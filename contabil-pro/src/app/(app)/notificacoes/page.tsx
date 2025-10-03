import { Suspense } from 'react'

import { getNotifications, getNotificationStats } from '@/actions/notifications'
import { NotificationList } from '@/components/notifications/notification-list'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { IconBell, IconBellRinging, IconCheck, IconX } from '@tabler/icons-react'

export const metadata = {
  title: 'Notificações | ContabilPRO',
  description: 'Gerencie suas notificações',
}

async function NotificationStats() {
  const statsResult = await getNotificationStats()

  if (!statsResult.success || !statsResult.data) {
    return null
  }

  const stats = statsResult.data

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Total</CardTitle>
          <IconBell className='h-4 w-4 text-muted-foreground' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.total}</div>
          <p className='text-xs text-muted-foreground'>Todas as notificações</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Não Lidas</CardTitle>
          <IconBellRinging className='h-4 w-4 text-orange-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.unread}</div>
          <p className='text-xs text-muted-foreground'>Aguardando sua atenção</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <CardTitle className='text-sm font-medium'>Lidas</CardTitle>
          <IconCheck className='h-4 w-4 text-green-500' />
        </CardHeader>
        <CardContent>
          <div className='text-2xl font-bold'>{stats.read}</div>
          <p className='text-xs text-muted-foreground'>Já visualizadas</p>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationStatsLoading() {
  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {[1, 2, 3].map(i => (
        <Card key={i}>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <Skeleton className='h-4 w-20' />
            <Skeleton className='h-4 w-4 rounded-full' />
          </CardHeader>
          <CardContent>
            <Skeleton className='h-8 w-16' />
            <Skeleton className='mt-2 h-3 w-32' />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

async function NotificationContent() {
  const notificationsResult = await getNotifications({ limit: 10 })

  if (!notificationsResult.success) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center py-12'>
          <IconX className='mb-4 h-16 w-16 text-destructive' />
          <h3 className='mb-2 text-lg font-semibold'>Erro ao carregar notificações</h3>
          <p className='text-sm text-muted-foreground'>
            {notificationsResult.error || 'Erro desconhecido'}
          </p>
        </CardContent>
      </Card>
    )
  }

  return <NotificationList initialNotifications={notificationsResult.data || []} />
}

function NotificationContentLoading() {
  return (
    <div className='space-y-3'>
      {[1, 2, 3, 4, 5].map(i => (
        <Card key={i} className='p-4'>
          <div className='flex items-start gap-4'>
            <Skeleton className='h-10 w-10 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-4 w-3/4' />
              <Skeleton className='h-3 w-full' />
              <Skeleton className='h-3 w-1/2' />
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default async function NotificacoesPage() {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Notificações</h1>
          <p className='text-muted-foreground'>
            Gerencie todas as suas notificações em um só lugar
          </p>
        </div>
      </div>

      {/* Stats */}
      <Suspense fallback={<NotificationStatsLoading />}>
        <NotificationStats />
      </Suspense>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Notificações</CardTitle>
          <CardDescription>Visualize, marque como lida ou delete suas notificações</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<NotificationContentLoading />}>
            <NotificationContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  )
}
