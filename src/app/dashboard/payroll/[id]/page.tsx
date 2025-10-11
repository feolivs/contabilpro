'use client'

import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, DollarSign, Users, Download, Trash2 } from 'lucide-react'
import { usePayrollDetail, formatCurrency, formatPayrollReference } from '@/hooks/use-payroll'
import { useClientStore } from '@/stores/client-store'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'

export default function PayrollDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedClient } = useClientStore()
  const payrollId = params.id as string

  const { data: payroll, isLoading, error } = usePayrollDetail(payrollId)

  const handleDelete = async () => {
    try {
      // TODO: Implementar delete mutation
      toast.success('Folha de pagamento excluída com sucesso')
      router.push('/dashboard/payroll')
    } catch (err) {
      toast.error('Erro ao excluir folha de pagamento')
    }
  }

  const handleExport = () => {
    toast.info('Funcionalidade de exportação em desenvolvimento')
    // TODO: Implementar exportação para Excel/PDF
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !payroll) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-muted-foreground">
          Folha de pagamento não encontrada
        </p>
        <Button onClick={() => router.push('/dashboard/payroll')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    )
  }

  const summary = payroll.summary
  const entries = payroll.entries || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/dashboard/payroll')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Folha de Pagamento
            </h1>
            <p className="text-muted-foreground">
              {formatPayrollReference(summary.reference_month, summary.reference_year)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta folha de pagamento? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total_employees}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salário Bruto</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.total_gross_salary)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salário Líquido</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.total_net_salary)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encargos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                (summary.total_inss_employee || 0) +
                (summary.total_inss_employer || 0) +
                (summary.total_fgts || 0) +
                (summary.total_irrf || 0)
              )}
            </div>
            <div className="flex gap-2 mt-2">
              {summary.inss_employer_enabled && (
                <Badge variant="secondary" className="text-xs">INSS Patronal</Badge>
              )}
              {summary.fgts_enabled && (
                <Badge variant="secondary" className="text-xs">FGTS</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Funcionário</CardTitle>
          <CardDescription>
            Lista completa de {entries.length} funcionário(s) nesta folha
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Salário Bruto</TableHead>
                  <TableHead className="text-right">INSS Func.</TableHead>
                  <TableHead className="text-right">IRRF</TableHead>
                  <TableHead className="text-right">Outros Desc.</TableHead>
                  <TableHead className="text-right">Salário Líquido</TableHead>
                  <TableHead className="text-right">INSS Patr.</TableHead>
                  <TableHead className="text-right">FGTS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      Nenhum funcionário encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">
                        {entry.employee_code || '-'}
                      </TableCell>
                      <TableCell>{entry.employee_name || 'Sem nome'}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.gross_salary)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.inss_employee || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.irrf || 0)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(entry.other_discounts || 0)}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(entry.net_salary)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(entry.inss_employer || 0)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatCurrency(entry.fgts || 0)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

