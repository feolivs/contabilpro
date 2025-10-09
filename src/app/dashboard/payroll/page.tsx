import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PayrollUploadForm } from '@/components/features/payroll/payroll-upload-form'
import { PayrollList } from '@/components/features/payroll/payroll-list'
import { PayrollStats } from '@/components/features/payroll/payroll-stats'

export default function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Folha de Pagamento
          </h1>
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

