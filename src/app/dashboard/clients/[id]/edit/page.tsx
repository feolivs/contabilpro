'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useClient, useUpdateClient } from '@/hooks/use-clients'
import { ClientForm } from '@/components/features/clients/client-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Loader2 } from 'lucide-react'
import type { ClientFormData } from '@/lib/validators'

interface EditClientPageProps {
  params: Promise<{ id: string }>
}

export default function EditClientPage({ params }: EditClientPageProps) {
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const router = useRouter()
  const updateClient = useUpdateClient()
  const [isLoading, setIsLoading] = useState(false)

  // Resolve params
  useState(() => {
    params.then(setResolvedParams)
  })

  const { data: client, isLoading: isLoadingClient } = useClient(resolvedParams?.id || '')

  const handleSubmit = async (data: ClientFormData) => {
    if (!client) return

    setIsLoading(true)

    try {
      await updateClient.mutateAsync({
        id: client.id,
        name: data.name,
        cnpj: data.cnpj,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      })

      toast.success('Cliente atualizado com sucesso!')
      router.push(`/dashboard/clients/${client.id}`)
    } catch (error) {
      console.error('Error updating client:', error)
      toast.error('Erro ao atualizar cliente. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingClient || !resolvedParams) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="space-y-6 max-w-2xl">
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
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/clients/${client.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Editar Cliente</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Atualize as informações de {client.name}
          </p>
        </div>
      </div>

      {/* Form */}
      <ClientForm
        defaultValues={{
          name: client.name,
          cnpj: client.cnpj,
          email: client.email || '',
          phone: client.phone || '',
          address: client.address || '',
        }}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Salvar Alterações"
        title="Informações do Cliente"
        description="Atualize os dados do cliente"
      />
    </div>
  )
}

