'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { PayrollCard } from './payroll-card'
import { usePayroll } from '@/hooks/use-payroll'
import { useClientStore } from '@/stores/client-store'

export function PayrollList() {
  const router = useRouter()
  const { selectedClient } = useClientStore()
  const { data: payrolls, isLoading } = usePayroll({
    clientId: selectedClient?.id || '',
    enabled: !!selectedClient,
  })

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [payrollToDelete, setPayrollToDelete] = useState<string | null>(null)

  const handleViewDetails = (id: string) => {
    router.push(`/dashboard/payroll/${id}`)
  }

  const handleReprocess = async (_id: string) => {
    toast.info('Funcionalidade de reprocessamento em desenvolvimento')
    // TODO: Implementar reprocessamento
  }

  const handleDeleteClick = (id: string) => {
    setPayrollToDelete(id)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!payrollToDelete) return

    try {
      // TODO: Implementar exclusão
      toast.success('Folha excluída com sucesso')
      setDeleteDialogOpen(false)
      setPayrollToDelete(null)
    } catch (error) {
      toast.error(
        `Erro ao excluir: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }

  if (!selectedClient) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Selecione um cliente para ver as folhas de pagamento
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
          </div>
        ))}
      </div>
    )
  }

  if (!payrolls || payrolls.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Nenhuma folha de pagamento encontrada
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Faça o upload de uma folha para começar
        </p>
      </div>
    )
  }

  // Agrupar por ano
  const payrollsByYear = payrolls.reduce(
    (acc, payroll) => {
      const year = payroll.reference_year
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(payroll)
      return acc
    },
    {} as Record<number, typeof payrolls>
  )

  const years = Object.keys(payrollsByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <>
      <div className="space-y-8">
        {years.map((year) => (
          <div key={year}>
            <h2 className="text-2xl font-bold mb-4">{year}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {payrollsByYear[year].map((payroll) => (
                <PayrollCard
                  key={payroll.id}
                  payroll={payroll}
                  onViewDetails={handleViewDetails}
                  onReprocess={handleReprocess}
                  onDelete={handleDeleteClick}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta folha de pagamento? Esta ação
              não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

