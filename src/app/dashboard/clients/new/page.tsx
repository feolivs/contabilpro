'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCreateClient } from '@/hooks/use-clients'
import { ClientForm } from '@/components/features/clients/client-form'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import type { ClientFormData } from '@/lib/validators'

export default function NewClientPage() {
  const router = useRouter()
  const createClient = useCreateClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (data: ClientFormData) => {
    setIsLoading(true)

    try {
      await createClient.mutateAsync({
        name: data.name,
        cnpj: data.cnpj,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      })

      toast.success('Cliente cadastrado com sucesso!')
      router.push('/dashboard/clients')
    } catch (error) {
      console.error('Error creating client:', error)
      toast.error('Erro ao cadastrar cliente. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Novo Cliente</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Cadastre um novo cliente no sistema
          </p>
        </div>
      </div>

      {/* Form */}
      <ClientForm
        onSubmit={handleSubmit}
        isLoading={isLoading}
        submitLabel="Cadastrar Cliente"
        title="Informações do Cliente"
        description="Preencha os dados do novo cliente"
      />
    </div>
  )
}

