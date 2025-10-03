import { headers } from 'next/headers'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { requirePermission } from '@/lib/auth/rbac'
import { buildTenantUrlFromHeaders } from '@/lib/navigation'
import { NotificationSettings } from '@/components/notifications/notification-settings'

export default async function ConfigPage() {
  await requirePermission('config.read')

  const headersList = await headers()
  const dashboardUrl = buildTenantUrlFromHeaders(headersList, '/dashboard')

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1'>
          <h1 className='text-3xl font-bold tracking-tight'>Configurações</h1>
          <p className='text-muted-foreground'>
            Gerencie preferências, integrações e configurações do sistema.
          </p>
        </div>
      </div>

      <Tabs defaultValue='perfil' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='perfil'>Perfil</TabsTrigger>
          <TabsTrigger value='empresa'>Empresa</TabsTrigger>
          <TabsTrigger value='notificacoes'>Notificações</TabsTrigger>
          <TabsTrigger value='preferencias'>Preferências</TabsTrigger>
          <TabsTrigger value='atalhos'>Atalhos</TabsTrigger>
          <TabsTrigger value='integracoes'>Integrações</TabsTrigger>
        </TabsList>

        <TabsContent value='perfil' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
              <CardDescription>Atualize seus dados pessoais e de contato</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <p className='text-sm font-medium'>Nome completo</p>
                  <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                    Usuário Teste
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium'>Email</p>
                  <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                    teste@contabilpro.com
                  </div>
                </div>
              </div>
              <Button disabled>Salvar alterações</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='empresa' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Dados da Empresa</CardTitle>
              <CardDescription>Informações do escritório contábil</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <p className='text-sm font-medium'>Razão social</p>
                  <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                    ContabilPRO Teste
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium'>CNPJ</p>
                  <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                    12.345.678/0001-95
                  </div>
                </div>
              </div>
              <Button disabled>Atualizar dados</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='notificacoes' className='space-y-4'>
          <NotificationSettings />
        </TabsContent>

        <TabsContent value='preferencias' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Preferências de Interface</CardTitle>
              <CardDescription>Personalize a aparência e comportamento do sistema</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-3'>
                <div>
                  <p className='text-sm font-medium'>Tema</p>
                  <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                    Sistema (automático)
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium'>Densidade</p>
                  <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                    Confortável
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium'>Idioma</p>
                  <div className='mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-muted-foreground'>
                    Português (Brasil)
                  </div>
                </div>
              </div>
              <Button disabled>Aplicar preferências</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='atalhos' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Atalhos de Teclado</CardTitle>
              <CardDescription>Mapa de teclas de atalho para navegação rápida</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex justify-between items-center py-2 border-b'>
                  <span className='text-sm'>Ir para Dashboard</span>
                  <kbd className='px-2 py-1 text-xs bg-muted rounded'>Ctrl + D</kbd>
                </div>
                <div className='flex justify-between items-center py-2 border-b'>
                  <span className='text-sm'>Novo Cliente</span>
                  <kbd className='px-2 py-1 text-xs bg-muted rounded'>Ctrl + N</kbd>
                </div>
                <div className='flex justify-between items-center py-2 border-b'>
                  <span className='text-sm'>Buscar</span>
                  <kbd className='px-2 py-1 text-xs bg-muted rounded'>Ctrl + K</kbd>
                </div>
                <div className='flex justify-between items-center py-2 border-b'>
                  <span className='text-sm'>Copiloto IA</span>
                  <kbd className='px-2 py-1 text-xs bg-muted rounded'>Ctrl + I</kbd>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='integracoes' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='h-8 w-8 rounded bg-green-100 flex items-center justify-center'>
                    🏦
                  </div>
                  Open Finance
                </CardTitle>
                <CardDescription>Conexão com bancos via Open Finance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Status: Não configurado</span>
                  <Button size='sm' disabled>
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <div className='h-8 w-8 rounded bg-blue-100 flex items-center justify-center'>
                    📄
                  </div>
                  NFe/NFS-e
                </CardTitle>
                <CardDescription>Importação de notas fiscais</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>Status: Não configurado</span>
                  <Button size='sm' disabled>
                    Configurar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className='text-center'>
        <Link href={dashboardUrl} className='text-sm text-primary hover:underline'>
          ← Voltar para o dashboard
        </Link>
      </div>
    </div>
  )
}
