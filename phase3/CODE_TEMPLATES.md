# 💻 TEMPLATES DE CÓDIGO - FASE 1 DIA 2

**Objetivo:** Código pronto para copiar e adaptar  
**Uso:** Acelerar implementação dos componentes

---

## 📦 CONSTANTES E HELPERS

### **Constantes de Meses e Anos**

```typescript
// src/lib/constants.ts

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export const MONTH_OPTIONS = [
  ...MONTHS.map((month, index) => ({
    value: (index + 1).toString(),
    label: month,
  })),
  { value: '13', label: '13º Salário' },
]

export const YEARS = Array.from(
  { length: 11 },
  (_, i) => new Date().getFullYear() - 5 + i
)

export const YEAR_OPTIONS = YEARS.map((year) => ({
  value: year.toString(),
  label: year.toString(),
}))
```

### **Helpers de Formatação**

```typescript
// src/lib/formatters.ts

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPayrollReference(month: number, year: number): string {
  if (month === 13) {
    return `13º Salário ${year}`
  }

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
  ]

  return `${monthNames[month - 1]} ${year}`
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}
```

---

## 🎨 COMPONENTES UI

### **PayrollUploadForm - Versão Simplificada**

```typescript
// src/components/features/payroll/payroll-upload-form.tsx

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { usePayrollUpload } from '@/hooks/use-payroll-upload'
import { useClientStore } from '@/stores/client-store'
import { MONTH_OPTIONS, YEAR_OPTIONS } from '@/lib/constants'

const payrollUploadSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 10 * 1024 * 1024,
    'Arquivo muito grande (máximo 10MB)'
  ),
  referenceMonth: z.number().min(1).max(13),
  referenceYear: z.number().min(2020).max(2030),
  inssEmployerEnabled: z.boolean().default(true),
  fgtsEnabled: z.boolean().default(true),
})

type PayrollUploadFormData = z.infer<typeof payrollUploadSchema>

export function PayrollUploadForm() {
  const { selectedClient } = useClientStore()
  const { uploadPayroll, isLoading } = usePayrollUpload()
  const [file, setFile] = useState<File | null>(null)

  const form = useForm<PayrollUploadFormData>({
    resolver: zodResolver(payrollUploadSchema),
    defaultValues: {
      referenceMonth: new Date().getMonth() + 1,
      referenceYear: new Date().getFullYear(),
      inssEmployerEnabled: true,
      fgtsEnabled: true,
    },
  })

  const onSubmit = async (data: PayrollUploadFormData) => {
    if (!selectedClient) {
      toast.error('Selecione um cliente primeiro')
      return
    }

    try {
      const result = await uploadPayroll({
        clientId: selectedClient.id,
        file: data.file,
        referenceMonth: data.referenceMonth,
        referenceYear: data.referenceYear,
        config: {
          inssEmployerEnabled: data.inssEmployerEnabled,
          fgtsEnabled: data.fgtsEnabled,
        },
      })

      toast.success(
        `Folha processada! ${result.summary.totalEmployees} funcionários`
      )
      
      form.reset()
      setFile(null)
    } catch (error) {
      toast.error(
        `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Folha de Pagamento</CardTitle>
        <CardDescription>
          Envie um arquivo CSV ou Excel com os dados da folha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* File Input */}
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Arquivo</FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setFile(file)
                          onChange(file)
                        }
                      }}
                      {...field}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-primary-foreground
                        hover:file:bg-primary/90"
                    />
                  </FormControl>
                  <FormDescription>
                    Formatos aceitos: CSV, Excel (.xlsx, .xls)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Competência */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="referenceMonth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o mês" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MONTH_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="referenceYear"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o ano" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {YEAR_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Configurações */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Configurações</h3>
              
              <FormField
                control={form.control}
                name="inssEmployerEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">INSS Patronal</FormLabel>
                      <FormDescription>
                        Calcular INSS Patronal (20% sobre salários)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fgtsEnabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">FGTS</FormLabel>
                      <FormDescription>
                        Calcular FGTS (8% sobre salários)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isLoading || !file} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Processar Folha
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
```

---

### **PayrollCard - Versão Completa**

```typescript
// src/components/features/payroll/payroll-card.tsx

'use client'

import { Calendar, Users, MoreHorizontal, Eye, RefreshCw, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatCurrency, formatPayrollReference } from '@/lib/formatters'
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
            <p className="text-2xl font-bold text-green-600 mt-1">
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
              <span className="font-medium text-orange-600">
                {formatCurrency(payroll.total_inss_employer)}
              </span>
            </div>
          )}
          
          {payroll.fgts_enabled && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">FGTS:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(payroll.total_fgts)}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

---

### **Página Principal - /dashboard/payroll**

```typescript
// src/app/dashboard/payroll/page.tsx

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PayrollUploadForm } from '@/components/features/payroll/payroll-upload-form'
import { PayrollList } from '@/components/features/payroll/payroll-list'
import { PayrollStats } from '@/components/features/payroll/payroll-stats'

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Folha de Pagamento</h1>
          <p className="text-muted-foreground">
            Gerencie as folhas de pagamento dos seus clientes
          </p>
        </div>
      </div>

      <Tabs defaultValue="upload" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <PayrollUploadForm />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <PayrollStats />
          <PayrollList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## 🧪 TEMPLATES DE TESTES

### **Teste de Componente**

```typescript
// src/__tests__/components/features/payroll/payroll-card.test.tsx

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PayrollCard } from '@/components/features/payroll/payroll-card'

const mockPayroll = {
  id: '123',
  reference_month: 1,
  reference_year: 2025,
  total_employees: 15,
  total_gross_salary: 45000,
  total_net_salary: 38400,
  total_inss_employer: 9000,
  total_fgts: 3600,
  inss_employer_enabled: true,
  fgts_enabled: true,
}

describe('PayrollCard', () => {
  it('should render payroll information', () => {
    const onViewDetails = jest.fn()
    
    render(
      <PayrollCard
        payroll={mockPayroll}
        onViewDetails={onViewDetails}
      />
    )

    expect(screen.getByText('Janeiro 2025')).toBeInTheDocument()
    expect(screen.getByText('15')).toBeInTheDocument()
    expect(screen.getByText(/R\$ 38\.400,00/)).toBeInTheDocument()
  })

  it('should call onViewDetails when clicking menu item', async () => {
    const user = userEvent.setup()
    const onViewDetails = jest.fn()
    
    render(
      <PayrollCard
        payroll={mockPayroll}
        onViewDetails={onViewDetails}
      />
    )

    await user.click(screen.getByRole('button', { name: /more/i }))
    await user.click(screen.getByText(/ver detalhes/i))

    expect(onViewDetails).toHaveBeenCalledWith('123')
  })
})
```

---

**Fim dos Templates**

Para mais exemplos e código completo, consulte:
- `IMPLEMENTATION_GUIDE.md` - Guia técnico detalhado
- `NEXT_STEPS_ANALYSIS.md` - Análise completa
- Componentes existentes em `src/components/features/import/`

