'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClient, useDeleteClient } from '@/hooks/use-clients'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { ArrowLeft, Edit, Trash2, Loader2, Building2, Mail, Phone, MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface ClientDetailPageProps {
  params: Promise<{ id: string }>
}

export default function ClientDetailPage({ params }: ClientDetailPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const router = useRouter()
  const deleteClient = useDeleteClient()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Resolve params
  useState(() => {
    params.then(setResolvedParams)
  })

  const { data: client, isLoading } = useClient(resolvedParams?.id || '')

  const handleDelete = async () => {
    if (!client) return

    try {
      await deleteClient.mutateAsync(client.id)
      toast.success('Cliente excluído com sucesso!')
      router.push('/dashboard/clients')
    } catch (error) {
      console.error('Error deleting client:', error)
      toast.error('Erro ao excluir cliente')
    }
  }

  if (isLoading || !resolvedParams) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-600 dark:text-slate-400">Cliente não encontrado</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{client.name}</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">Detalhes do cliente</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/clients/${client.id}/edit`}>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
          <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </Button>
        </div>
      </div>

      {/* Client Information */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Cliente</CardTitle>
          <CardDescription>Dados cadastrais e de contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">Nome da Empresa</span>
              </div>
              <p className="text-lg font-medium text-slate-900 dark:text-white">{client.name}</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Building2 className="h-4 w-4" />
                <span className="font-medium">CNPJ</span>
              </div>
              <p className="text-lg font-medium text-slate-900 dark:text-white">{client.cnpj}</p>
            </div>

            {client.email && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Mail className="h-4 w-4" />
                  <span className="font-medium">Email</span>
                </div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{client.email}</p>
              </div>
            )}

            {client.phone && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium">Telefone</span>
                </div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{client.phone}</p>
              </div>
            )}

            {client.address && (
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">Endereço</span>
                </div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">{client.address}</p>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Cadastrado em</span>
              </div>
              <p className="text-lg font-medium text-slate-900 dark:text-white">
                {format(new Date(client.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>

            {client.updated_at && client.updated_at !== client.created_at && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Última atualização</span>
                </div>
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  {format(new Date(client.updated_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activity Section (Placeholder for Phase 2) */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades Recentes</CardTitle>
          <CardDescription>Documentos e transações do cliente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <p>Nenhuma atividade registrada ainda</p>
            <p className="text-sm mt-2">
              Documentos importados e relatórios gerados aparecerão aqui
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cliente <strong>{client.name}</strong>? Esta ação não
              pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteClient.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteClient.isPending}
            >
              {deleteClient.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

