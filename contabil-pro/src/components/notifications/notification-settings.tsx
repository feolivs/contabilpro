'use client'

import { useState, useEffect } from 'react'
import { IconBell, IconBellOff, IconCheck, IconX } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  isPushNotificationSupported,
  areNotificationsEnabled,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isSubscribedToPush,
  sendTestNotification,
  getNotificationPermission,
} from '@/lib/push-notifications'
import { toast } from 'sonner'

export function NotificationSettings() {
  const [isSupported, setIsSupported] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    checkNotificationStatus()
  }, [])

  const checkNotificationStatus = async () => {
    const supported = isPushNotificationSupported()
    setIsSupported(supported)

    if (supported) {
      const enabled = areNotificationsEnabled()
      setIsEnabled(enabled)

      const subscribed = await isSubscribedToPush()
      setIsSubscribed(subscribed)

      const perm = getNotificationPermission()
      setPermission(perm)
    }
  }

  const handleToggleNotifications = async (checked: boolean) => {
    setIsLoading(true)

    try {
      if (checked) {
        // Subscribe to push notifications
        const result = await subscribeToPushNotifications()

        if (result.success) {
          toast.success('Notificações push ativadas com sucesso!')
          await checkNotificationStatus()
        } else {
          toast.error(result.error || 'Erro ao ativar notificações push')
        }
      } else {
        // Unsubscribe from push notifications
        const result = await unsubscribeFromPushNotifications()

        if (result.success) {
          toast.success('Notificações push desativadas')
          await checkNotificationStatus()
        } else {
          toast.error(result.error || 'Erro ao desativar notificações push')
        }
      }
    } catch (error) {
      console.error('[Settings] Toggle error:', error)
      toast.error('Erro ao alterar configuração de notificações')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    try {
      await sendTestNotification()
      toast.success('Notificação de teste enviada!')
    } catch (error) {
      console.error('[Settings] Test notification error:', error)
      toast.error('Erro ao enviar notificação de teste')
    }
  }

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBellOff className="h-5 w-5" />
            Notificações Push
          </CardTitle>
          <CardDescription>
            Seu navegador não suporta notificações push
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              As notificações push não são suportadas neste navegador. 
              Tente usar Chrome, Firefox, Edge ou Safari.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBell className="h-5 w-5" />
          Notificações Push
        </CardTitle>
        <CardDescription>
          Receba alertas sobre obrigações fiscais, tarefas e documentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status */}
        <div className="space-y-2">
          <Label>Status</Label>
          <div className="flex items-center gap-2">
            {isEnabled && isSubscribed ? (
              <>
                <IconCheck className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-500">Ativadas</span>
              </>
            ) : permission === 'denied' ? (
              <>
                <IconX className="h-4 w-4 text-destructive" />
                <span className="text-sm text-destructive">Bloqueadas pelo navegador</span>
              </>
            ) : (
              <>
                <IconBellOff className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Desativadas</span>
              </>
            )}
          </div>
        </div>

        {/* Permission Denied Warning */}
        {permission === 'denied' && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              As notificações foram bloqueadas pelo navegador. 
              Para ativá-las, você precisa alterar as configurações do navegador.
            </p>
          </div>
        )}

        {/* Toggle */}
        {permission !== 'denied' && (
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
              <span>Habilitar notificações push</span>
              <span className="text-sm font-normal text-muted-foreground">
                Receba alertas mesmo quando o ContabilPRO não estiver aberto
              </span>
            </Label>
            <Switch
              id="push-notifications"
              checked={isEnabled && isSubscribed}
              onCheckedChange={handleToggleNotifications}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Test Button */}
        {isEnabled && isSubscribed && (
          <div className="space-y-2">
            <Label>Testar notificações</Label>
            <Button
              variant="outline"
              onClick={handleTestNotification}
              className="w-full"
            >
              <IconBell className="mr-2 h-4 w-4" />
              Enviar notificação de teste
            </Button>
          </div>
        )}

        {/* Info */}
        <div className="rounded-lg border bg-muted p-4">
          <p className="text-sm text-muted-foreground">
            <strong>Como funciona:</strong> Você receberá notificações sobre:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>• Obrigações fiscais vencendo em 7, 3 dias ou hoje</li>
            <li>• Obrigações fiscais atrasadas</li>
            <li>• Lembretes de tarefas importantes</li>
            <li>• Novos documentos enviados</li>
            <li>• Mensagens de clientes</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}

