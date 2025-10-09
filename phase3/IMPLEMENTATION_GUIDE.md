# 🛠️ GUIA DE IMPLEMENTAÇÃO - FASE 1 DIA 2

**Objetivo:** Implementar Frontend UI completo para Folha de Pagamento  
**Tempo Estimado:** 1-2 dias (17h)  
**Complexidade:** Média

---

## 📐 ARQUITETURA DE COMPONENTES

### **Hierarquia de Componentes**

```
/dashboard/payroll (Page)
├── PayrollStats (Estatísticas)
├── Tabs
│   ├── Tab: Upload
│   │   └── PayrollUploadForm
│   │       ├── FileUploadZone (adaptado)
│   │       ├── Select (mês/ano)
│   │       ├── Switch (configurações)
│   │       └── Button (submit)
│   │
│   └── Tab: Histórico
│       ├── PayrollFilters
│       │   ├── Select (ano)
│       │   └── Select (mês)
│       │
│       └── PayrollList
│           └── PayrollCard (múltiplos)
│               ├── Badge (competência)
│               ├── Stats (funcionários, total)
│               └── Actions (ver, reprocessar, excluir)
│
/dashboard/payroll/[id] (Page)
└── PayrollDetailCard
    ├── Header (competência, status)
    ├── Summary (totais)
    ├── Breakdown (detalhes)
    └── Actions (download, editar)
```

---

## 🎨 DESIGN SYSTEM

### **Cores e Badges**

```typescript
// Status da folha
const statusConfig = {
  pending: { variant: 'secondary', label: 'Pendente', color: 'yellow' },
  processing: { variant: 'default', label: 'Processando', color: 'blue' },
  completed: { variant: 'outline', label: 'Concluído', color: 'green' },
  failed: { variant: 'destructive', label: 'Falhou', color: 'red' },
}

// Tipos de valores
const valueTypes = {
  positive: 'text-green-600 dark:text-green-400',
  negative: 'text-red-600 dark:text-red-400',
  neutral: 'text-slate-600 dark:text-slate-400',
}
```

### **Ícones (Lucide React)**

```typescript
import {
  Upload,           // Upload de arquivo
  FileText,         // Documento
  Users,            // Funcionários
  DollarSign,       // Valores monetários
  Calendar,         // Competência
  TrendingUp,       // Crescimento
  TrendingDown,     // Queda
  AlertCircle,      // Erro
  CheckCircle2,     // Sucesso
  Loader2,          // Loading
  MoreHorizontal,   // Menu de ações
  Eye,              // Ver detalhes
  RefreshCw,        // Reprocessar
  Trash2,           // Excluir
  Download,         // Download
} from 'lucide-react'
```

---

## 📝 SCHEMAS ZOD

### **1. PayrollUploadSchema**

```typescript
// src/lib/validators.ts

import { z } from 'zod'

export const payrollUploadSchema = z.object({
  file: z
    .instanceof(File, { message: 'Arquivo é obrigatório' })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      'Arquivo muito grande (máximo 10MB)'
    )
    .refine(
      (file) => {
        const validExtensions = ['.csv', '.xlsx', '.xls']
        return validExtensions.some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        )
      },
      'Formato inválido. Use CSV ou Excel (.csv, .xlsx, .xls)'
    ),
  referenceMonth: z
    .number()
    .min(1, 'Mês inválido')
    .max(13, 'Mês inválido (1-12 ou 13 para 13º salário)'),
  referenceYear: z
    .number()
    .min(2020, 'Ano muito antigo')
    .max(2030, 'Ano muito distante'),
  inssEmployerEnabled: z.boolean().default(true),
  fgtsEnabled: z.boolean().default(true),
})

export type PayrollUploadFormData = z.infer<typeof payrollUploadSchema>
```

### **2. PayrollFiltersSchema**

```typescript
export const payrollFiltersSchema = z.object({
  year: z.number().optional(),
  month: z.number().min(1).max(13).optional(),
})

export type PayrollFiltersData = z.infer<typeof payrollFiltersSchema>
```

---

## 🧩 COMPONENTES DETALHADOS

### **1. PayrollUploadForm**

**Arquivo:** `src/components/features/payroll/payroll-upload-form.tsx`

**Props:** Nenhuma (usa `useClientStore` internamente)

**Estado:**
```typescript
const [file, setFile] = useState<File | null>(null)
const [isUploading, setIsUploading] = useState(false)
```

**Hooks:**
```typescript
const { selectedClient } = useClientStore()
const { uploadPayroll, isLoading } = usePayrollUpload()
const form = useForm<PayrollUploadFormData>({
  resolver: zodResolver(payrollUploadSchema),
  defaultValues: {
    referenceMonth: new Date().getMonth() + 1,
    referenceYear: new Date().getFullYear(),
    inssEmployerEnabled: true,
    fgtsEnabled: true,
  },
})
```

**Fluxo de Upload:**
```typescript
const onSubmit = async (data: PayrollUploadFormData) => {
  if (!selectedClient) {
    toast.error('Selecione um cliente primeiro')
    return
  }

  try {
    setIsUploading(true)
    
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
      `Folha processada com sucesso! ${result.summary.totalEmployees} funcionários`
    )
    
    form.reset()
    setFile(null)
    
    // Opcional: redirecionar para histórico
    // router.push('/dashboard/payroll?tab=history')
  } catch (error) {
    toast.error(
      `Erro ao processar folha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
    )
  } finally {
    setIsUploading(false)
  }
}
```

**Layout:**
```tsx
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
        {/* File Upload */}
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Arquivo</FormLabel>
              <FormControl>
                <FileUploadZone
                  documentType="payroll"
                  acceptedFileTypes={{
                    'text/csv': ['.csv'],
                    'application/vnd.ms-excel': ['.xls'],
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
                  }}
                  maxSize={10 * 1024 * 1024}
                  description="Arraste o arquivo aqui ou clique para selecionar"
                  onFileSelect={(file) => {
                    setFile(file)
                    field.onChange(file)
                  }}
                />
              </FormControl>
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
                    {MONTHS.map((month, index) => (
                      <SelectItem key={index} value={(index + 1).toString()}>
                        {month}
                      </SelectItem>
                    ))}
                    <SelectItem value="13">13º Salário</SelectItem>
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
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
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
        <Button type="submit" disabled={isUploading || !file} className="w-full">
          {isUploading ? (
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
```

**Constantes:**
```typescript
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
]

const YEARS = Array.from(
  { length: 11 },
  (_, i) => new Date().getFullYear() - 5 + i
)
```

---

### **2. PayrollCard**

**Arquivo:** `src/components/features/payroll/payroll-card.tsx`

**Props:**
```typescript
interface PayrollCardProps {
  payroll: PayrollSummary
  onViewDetails: (id: string) => void
  onReprocess?: (id: string) => void
  onDelete?: (id: string) => void
}
```

**Layout:**
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardHeader className="pb-3">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-lg">
          {formatPayrollReference(payroll.reference_month, payroll.reference_year)}
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
        <p className="text-2xl font-bold">{payroll.total_employees}</p>
      </div>
      <div>
        <p className="text-sm text-muted-foreground">Salário Líquido</p>
        <p className="text-2xl font-bold text-green-600">
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
```

---

## 🔗 INTEGRAÇÃO COM HOOKS

### **usePayrollUpload**

```typescript
// Já implementado em src/hooks/use-payroll-upload.ts

const { uploadPayroll, isLoading, error } = usePayrollUpload()

// Uso:
const result = await uploadPayroll({
  clientId: 'uuid',
  file: File,
  referenceMonth: 1,
  referenceYear: 2025,
  config: {
    inssEmployerEnabled: true,
    fgtsEnabled: true,
  },
})

// Resultado:
{
  success: true,
  payrollSummary: { id, total_employees, ... },
  summary: { totalEmployees, totalGrossSalary, ... }
}
```

### **usePayroll**

```typescript
// Já implementado em src/hooks/use-payroll.ts

const { data: payrolls, isLoading } = usePayroll({
  clientId: 'uuid',
  referenceYear: 2025, // opcional
  enabled: true,
})

// Retorna: PayrollSummary[]
```

### **usePayrollDetail**

```typescript
// Já implementado em src/hooks/use-payroll.ts

const { data: payroll, isLoading } = usePayrollDetail({
  payrollId: 'uuid',
  enabled: true,
})

// Retorna: PayrollSummary
```

### **usePayrollStats**

```typescript
// Já implementado em src/hooks/use-payroll.ts

const { data: stats, isLoading } = usePayrollStats({
  clientId: 'uuid',
  referenceYear: 2025, // opcional
  enabled: true,
})

// Retorna:
{
  totalEmployees: number
  totalGrossSalary: number
  totalNetSalary: number
  averageGrossSalary: number
  averageNetSalary: number
  monthsWithData: number
}
```

---

## 🧪 TESTES

### **Teste de Componente: PayrollUploadForm**

```typescript
// src/__tests__/components/features/payroll/payroll-upload-form.test.tsx

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PayrollUploadForm } from '@/components/features/payroll/payroll-upload-form'

describe('PayrollUploadForm', () => {
  it('should render form fields', () => {
    render(<PayrollUploadForm />)
    
    expect(screen.getByLabelText(/arquivo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mês/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/ano/i)).toBeInTheDocument()
    expect(screen.getByText(/INSS Patronal/i)).toBeInTheDocument()
    expect(screen.getByText(/FGTS/i)).toBeInTheDocument()
  })

  it('should validate file type', async () => {
    const user = userEvent.setup()
    render(<PayrollUploadForm />)
    
    const file = new File(['content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByLabelText(/arquivo/i)
    
    await user.upload(input, file)
    
    await waitFor(() => {
      expect(screen.getByText(/formato inválido/i)).toBeInTheDocument()
    })
  })

  it('should submit form with valid data', async () => {
    const user = userEvent.setup()
    const mockUpload = jest.fn()
    
    render(<PayrollUploadForm />)
    
    const file = new File(['content'], 'folha.csv', { type: 'text/csv' })
    const input = screen.getByLabelText(/arquivo/i)
    
    await user.upload(input, file)
    await user.selectOptions(screen.getByLabelText(/mês/i), '1')
    await user.selectOptions(screen.getByLabelText(/ano/i), '2025')
    await user.click(screen.getByRole('button', { name: /processar/i }))
    
    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith({
        clientId: expect.any(String),
        file: expect.any(File),
        referenceMonth: 1,
        referenceYear: 2025,
        config: {
          inssEmployerEnabled: true,
          fgtsEnabled: true,
        },
      })
    })
  })
})
```

---

**Continua em IMPLEMENTATION_GUIDE_PART2.md...**

