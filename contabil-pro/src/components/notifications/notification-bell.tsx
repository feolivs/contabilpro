'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

import {
  getNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
} from '@/actions/notifications'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import type { Notification } from '@/types/notifications'
import { formatNotificationTime, getNotificationUrl } from '@/types/notifications'

import { IconBell, IconCheck } from '@tabler/icons-react'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load notifications and unread count
  useEffect(() => {
    loadNotifications()
    loadUnreadCount()

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const loadNotifications = async () => {
    setIsLoading(true)
    const result = await getNotifications({ limit: 10 })
    if (result.success && result.data) {
      setNotifications(result.data)
    }
    setIsLoading(false)
  }

  const loadUnreadCount = async () => {
    const result = await getUnreadCount()
    if (result.success && result.data !== undefined) {
      setUnreadCount(result.data)
    }
  }

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const result = await markAsRead(id)
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true, read_at: new Date().toISOString() } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }
  }

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead()
    if (result.success) {
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
      )
      setUnreadCount(0)
    }
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (open) {
      loadNotifications()
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <IconBell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
          <span className='sr-only'>Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-80'>
        <DropdownMenuLabel className='flex items-center justify-between'>
          <span>Notificações</span>
          {unreadCount > 0 && (
            <Button
              variant='ghost'
              size='sm'
              onClick={handleMarkAllAsRead}
              className='h-auto p-1 text-xs'
            >
              <IconCheck className='mr-1 h-3 w-3' />
              Marcar todas como lidas
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className='h-[400px]'>
          {isLoading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='text-sm text-muted-foreground'>Carregando...</div>
            </div>
          ) : notifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-8'>
              <IconBell className='mb-2 h-12 w-12 text-muted-foreground' />
              <p className='text-sm text-muted-foreground'>Nenhuma notificação</p>
            </div>
          ) : (
            notifications.map(notification => (
              <Link
                key={notification.id}
                href={getNotificationUrl(notification)}
                onClick={() => {
                  if (!notification.read) {
                    markAsRead(notification.id, {} as React.MouseEvent)
                  }
                  setIsOpen(false)
                }}
              >
                <DropdownMenuItem
                  className={cn(
                    'flex cursor-pointer flex-col items-start gap-1 p-3',
                    !notification.read && 'bg-accent'
                  )}
                >
                  <div className='flex w-full items-start justify-between gap-2'>
                    <div className='flex-1'>
                      <p
                        className={cn('text-sm font-medium', !notification.read && 'font-semibold')}
                      >
                        {notification.title}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground line-clamp-2'>
                        {notification.message}
                      </p>
                      <p className='mt-1 text-xs text-muted-foreground'>
                        {formatNotificationTime(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-6 w-6 shrink-0'
                        onClick={e => handleMarkAsRead(notification.id, e)}
                      >
                        <IconCheck className='h-4 w-4' />
                        <span className='sr-only'>Marcar como lida</span>
                      </Button>
                    )}
                  </div>
                </DropdownMenuItem>
              </Link>
            ))
          )}
        </ScrollArea>
        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href='/notificacoes' className='w-full cursor-pointer text-center'>
                Ver todas as notificações
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
