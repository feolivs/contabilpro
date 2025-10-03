'use client'

import Link from 'next/link'

import { deleteNotification, markAsRead } from '@/actions/notifications'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/notifications'
import {
  formatNotificationTime,
  getNotificationPriority,
  getNotificationUrl,
} from '@/types/notifications'

import {
  IconAlertCircle,
  IconAlertTriangle,
  IconBell,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconFileUpload,
  IconInfoCircle,
  IconMessageCircle,
  IconTrash,
  IconXCircle,
} from '@tabler/icons-react'
import { toast } from 'sonner'

interface NotificationItemProps {
  notification: Notification
  onUpdate?: () => void
}

const iconMap = {
  tax_obligation_due_7d: IconCalendar,
  tax_obligation_due_3d: IconAlertCircle,
  tax_obligation_due_today: IconAlertTriangle,
  tax_obligation_overdue: IconXCircle,
  task_reminder: IconCheckCircle,
  document_uploaded: IconFileUpload,
  client_message: IconMessageCircle,
  system: IconInfoCircle,
}

const colorMap = {
  tax_obligation_due_7d: 'text-blue-500 bg-blue-50 dark:bg-blue-950',
  tax_obligation_due_3d: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-950',
  tax_obligation_due_today: 'text-orange-500 bg-orange-50 dark:bg-orange-950',
  tax_obligation_overdue: 'text-red-500 bg-red-50 dark:bg-red-950',
  task_reminder: 'text-green-500 bg-green-50 dark:bg-green-950',
  document_uploaded: 'text-purple-500 bg-purple-50 dark:bg-purple-950',
  client_message: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-950',
  system: 'text-gray-500 bg-gray-50 dark:bg-gray-950',
}

export function NotificationItem({ notification, onUpdate }: NotificationItemProps) {
  const Icon = iconMap[notification.type] || IconBell
  const priority = getNotificationPriority(notification.type)
  const url = getNotificationUrl(notification)

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const result = await markAsRead(notification.id)
    if (result.success) {
      toast.success('Notificação marcada como lida')
      onUpdate?.()
    } else {
      toast.error(result.error || 'Erro ao marcar notificação como lida')
    }
  }

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const result = await deleteNotification(notification.id)
    if (result.success) {
      toast.success('Notificação deletada')
      onUpdate?.()
    } else {
      toast.error(result.error || 'Erro ao deletar notificação')
    }
  }

  return (
    <Link
      href={url}
      onClick={() => !notification.read && markAsRead(notification.id, {} as React.MouseEvent)}
    >
      <Card
        className={cn(
          'p-4 transition-colors hover:bg-accent cursor-pointer',
          !notification.read && 'border-l-4 border-l-primary bg-accent/50'
        )}
      >
        <div className='flex items-start gap-4'>
          {/* Icon */}
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              colorMap[notification.type]
            )}
          >
            <Icon className='h-5 w-5' />
          </div>

          {/* Content */}
          <div className='flex-1 space-y-1'>
            <div className='flex items-start justify-between gap-2'>
              <div className='flex-1'>
                <p className={cn('text-sm font-medium', !notification.read && 'font-semibold')}>
                  {notification.title}
                </p>
                <p className='mt-1 text-sm text-muted-foreground line-clamp-2'>
                  {notification.message}
                </p>
              </div>

              {/* Priority Badge */}
              {priority === 'urgent' && (
                <span className='inline-flex items-center rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900 dark:text-red-300'>
                  Urgente
                </span>
              )}
              {priority === 'high' && (
                <span className='inline-flex items-center rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700 dark:bg-orange-900 dark:text-orange-300'>
                  Alta
                </span>
              )}
            </div>

            {/* Footer */}
            <div className='flex items-center justify-between gap-2 pt-2'>
              <p className='text-xs text-muted-foreground'>
                {formatNotificationTime(notification.created_at)}
              </p>

              {/* Actions */}
              <div className='flex items-center gap-1'>
                {!notification.read && (
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 px-2 text-xs'
                    onClick={handleMarkAsRead}
                  >
                    <IconCheck className='mr-1 h-3 w-3' />
                    Marcar como lida
                  </Button>
                )}
                <Button
                  variant='ghost'
                  size='sm'
                  className='h-8 px-2 text-xs text-destructive hover:text-destructive'
                  onClick={handleDelete}
                >
                  <IconTrash className='mr-1 h-3 w-3' />
                  Deletar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}
