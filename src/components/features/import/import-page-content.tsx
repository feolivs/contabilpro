'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FileText, Building2, Receipt, History } from 'lucide-react'
import { FileUploadZone } from './file-upload-zone'

export function ImportPageContent() {
  const [activeTab, setActiveTab] = useState('xml')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Importar Documentos</h1>
          <p className="text-muted-foreground mt-2">
            Importe notas fiscais (NF-e, NFSe) e extratos bancários (OFX) para processamento automático
          </p>
        </div>
        <Link href="/dashboard/import/history">
          <Button variant="outline">
            <History className="h-4 w-4 mr-2" />
            Ver Histórico
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="xml" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Notas Fiscais (XML)</span>
          </TabsTrigger>
          <TabsTrigger value="ofx" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span>Extratos Bancários (OFX)</span>
          </TabsTrigger>
          <TabsTrigger value="payroll" className="flex items-center gap-2" disabled>
            <Receipt className="h-4 w-4" />
            <span>Folha de Pagamento</span>
          </TabsTrigger>
        </TabsList>

        {/* XML Tab */}
        <TabsContent value="xml" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Notas Fiscais Eletrônicas</CardTitle>
              <CardDescription>
                Faça upload de arquivos XML de NF-e ou NFSe. Os dados serão extraídos automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                documentType="nfe"
                acceptedFileTypes={{
                  'text/xml': ['.xml'],
                  'application/xml': ['.xml'],
                }}
                maxSize={10 * 1024 * 1024} // 10MB
                description="Arraste arquivos XML aqui ou clique para selecionar"
              />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Formatos Aceitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p><strong>NF-e:</strong> Nota Fiscal Eletrônica (modelo 55)</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p><strong>NFSe:</strong> Nota Fiscal de Serviços Eletrônica</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p><strong>NFC-e:</strong> Nota Fiscal de Consumidor Eletrônica (modelo 65)</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OFX Tab */}
        <TabsContent value="ofx" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Importar Extratos Bancários</CardTitle>
              <CardDescription>
                Faça upload de arquivos OFX exportados do seu banco. As transações serão importadas automaticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUploadZone
                documentType="ofx"
                acceptedFileTypes={{
                  'application/x-ofx': ['.ofx'],
                  'application/octet-stream': ['.ofx'],
                }}
                maxSize={10 * 1024 * 1024} // 10MB
                description="Arraste arquivos OFX aqui ou clique para selecionar"
              />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Como Exportar OFX do Banco</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p>Acesse o internet banking do seu banco</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p>Vá em &quot;Extratos&quot; ou &quot;Movimentações&quot;</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p>Selecione o período desejado</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5" />
                <p>Escolha o formato <strong>OFX</strong> ou <strong>Money</strong> para download</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab (Disabled) */}
        <TabsContent value="payroll">
          <Card>
            <CardHeader>
              <CardTitle>Importar Folha de Pagamento</CardTitle>
              <CardDescription>
                Em breve: Importe dados de folha de pagamento para lançamentos automáticos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Esta funcionalidade estará disponível em breve.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

