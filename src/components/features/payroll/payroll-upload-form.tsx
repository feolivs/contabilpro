'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Upload, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { usePayrollUpload } from '@/hooks/use-payroll-upload'
import { useClientStore } from '@/stores/client-store'
import { MONTH_OPTIONS, YEAR_OPTIONS } from '@/lib/constants'
import {
  payrollUploadSchema,
  type PayrollUploadFormData,
} from '@/lib/validators'

export function PayrollUploadForm() {
  const { selectedClient } = useClientStore()
  const { mutateAsync: uploadPayroll, isPending: isLoading } = usePayrollUpload()
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
        `Folha processada com sucesso! ${result.summary.totalEmployees} funcionários`
      )

      form.reset()
      setFile(null)
    } catch (error) {
      toast.error(
        `Erro ao processar folha: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
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
                      value={undefined}
                      className="block w-full text-sm text-slate-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-primary file:text-primary-foreground
                        hover:file:bg-primary/90 cursor-pointer"
                    />
                  </FormControl>
                  <FormDescription>
                    Formatos aceitos: CSV, Excel (.xlsx, .xls) - Máximo 10MB
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
            <Button
              type="submit"
              disabled={isLoading || !file}
              className="w-full"
            >
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

