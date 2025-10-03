'use client'

import { useEffect, useState } from 'react'

import { getNotifications } from '@/actions/notifications'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Notification, NotificationFilters } from '@/types/notifications'

import { NotificationItem } from './notification-item'
import { IconBell } from '@tabler/icons-react'

interface NotificationListProps {
  initialNotifications?: Notification[]
  initialFilter?: 'all' | 'unread' | 'read'
}

export function NotificationList({
  initialNotifications = [],
  initialFilter = 'all',
}: NotificationListProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>(initialFilter)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const pageSize = 10

  useEffect(() => {
    loadNotifications()
  }, [filter])

  const loadNotifications = async (pageNum = 0) => {
    setIsLoading(true)

    const filters: NotificationFilters = {
      limit: pageSize,
      offset: pageNum * pageSize,
    }

    if (filter === 'unread') {
      filters.read = false
    } else if (filter === 'read') {
      filters.read = true
    }

    const result = await getNotifications(filters)

    if (result.success && result.data) {
      if (pageNum === 0) {
        setNotifications(result.data)
      } else {
        setNotifications(prev => [...prev, ...result.data!])
      }
      setHasMore(result.data.length === pageSize)
      setPage(pageNum)
    }

    setIsLoading(false)
  }

  const handleFilterChange = (newFilter: 'all' | 'unread' | 'read') => {
    setFilter(newFilter)
    setPage(0)
    setHasMore(true)
  }

  const handleLoadMore = () => {
    loadNotifications(page + 1)
  }

  const handleUpdate = () => {
    loadNotifications(0)
  }

  const filteredNotifications = notifications

  return (
    <div className='space-y-4'>
      {/* Filters */}
      <Tabs
        value={filter}
        onValueChange={value => handleFilterChange(value as 'all' | 'unread' | 'read')}
      >
        <TabsList>
          <TabsTrigger value='all'>
            Todas
            {filter === 'all' && (
              <span className='ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs'>
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value='unread'>
            Não lidas
            {filter === 'unread' && (
              <span className='ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs'>
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value='read'>
            Lidas
            {filter === 'read' && (
              <span className='ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-xs'>
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* List */}
      {isLoading && page === 0 ? (
        <div className='flex items-center justify-center py-12'>
          <div className='text-sm text-muted-foreground'>Carregando notificações...</div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-12'>
          <IconBell className='mb-4 h-16 w-16 text-muted-foreground' />
          <h3 className='mb-2 text-lg font-semibold'>Nenhuma notificação</h3>
          <p className='text-sm text-muted-foreground'>
            {filter === 'unread'
              ? 'Você não tem notificações não lidas'
              : filter === 'read'
                ? 'Você não tem notificações lidas'
                : 'Você não tem notificações'}
          </p>
        </div>
      ) : (
        <>
          <div className='space-y-3'>
            {filteredNotifications.map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onUpdate={handleUpdate}
              />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className='flex justify-center pt-4'>
              <Button variant='outline' onClick={handleLoadMore} disabled={isLoading}>
                {isLoading ? 'Carregando...' : 'Carregar mais'}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
