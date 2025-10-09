'use client'

import {
  Calendar,
  Users,
  MoreHorizontal,
  Eye,
  RefreshCw,
  Trash2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatPayrollReference } from '@/hooks/use-payroll'
import type { PayrollSummary } from '@/hooks/use-payroll'

interface PayrollCardProps {
  payroll: PayrollSummary
  onViewDetails: (id: string) => void
  onReprocess?: (id: string) => void
  onDelete?: (id: string) => void
}

export function PayrollCard({
  payroll,
  onViewDetails,
  onReprocess,
  onDelete,
}: PayrollCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">
              {formatPayrollReference(
                payroll.reference_month,
                payroll.reference_year
              )}
            </CardTitle>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onViewDetails(payroll.id)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>
              {onReprocess && (
                <DropdownMenuItem onClick={() => onReprocess(payroll.id)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reprocessar
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(payroll.id)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Funcionários</p>
            <div className="flex items-center space-x-2 mt-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <p className="text-2xl font-bold">{payroll.total_employees}</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Salário Líquido</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
              {formatCurrency(payroll.total_net_salary)}
            </p>
          </div>
        </div>

        <Separator className="my-4" />

        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Salário Bruto:</span>
            <span className="font-medium">
              {formatCurrency(payroll.total_gross_salary)}
            </span>
          </div>

          {payroll.inss_employer_enabled && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">INSS Patronal:</span>
              <span className="font-medium text-orange-600 dark:text-orange-400">
                {formatCurrency(payroll.total_inss_employer)}
              </span>
            </div>
          )}

          {payroll.fgts_enabled && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">FGTS:</span>
              <span className="font-medium text-blue-600 dark:text-blue-400">
                {formatCurrency(payroll.total_fgts)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

