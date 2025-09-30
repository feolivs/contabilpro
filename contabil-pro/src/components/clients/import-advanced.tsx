'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { IconUpload, IconCheck, IconX, IconAlertTriangle, IconFileText } from '@tabler/icons-react'
import { validateDocument } from '@/lib/validation'
import { importClientsFromCSV } from '@/actions/clients'

interface ParsedRow {
  line: number
  data: {
    name: string
    document: string
    email?: string
    phone?: string
    address?: string
  }
  errors: string[]
  warnings: string[]
}

/**
 * Componente de Importação Avançada de Clientes
 * 
 * Features:
 * - Upload de CSV
 * - Validação em tempo real
 * - Preview dos dados antes de importar
 * - Indicadores de erros e avisos
 * - Estatísticas de validação
 */
export function ClientImportAdvanced() {
  const [file, setFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedRow[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<any>(null)

  // Validar linha do CSV
  const validateRow = (row: any, lineNumber: number): ParsedRow => {
    const errors: string[] = []
    const warnings: string[] = []

    // Validar nome (obrigatório)
    if (!row.name || row.name.trim().length === 0) {
      errors.push('Nome é obrigatório')
    } else if (row.name.length < 3) {
      warnings.push('Nome muito curto')
    }

    // Validar documento (obrigatório)
    if (!row.document || row.document.trim().length === 0) {
      errors.push('Documento é obrigatório')
    } else if (!validateDocument(row.document)) {
      errors.push('CPF/CNPJ inválido')
    }

    // Validar email (opcional, mas se preenchido deve ser válido)
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      warnings.push('Email com formato inválido')
    }

    return {
      line: lineNumber,
      data: {
        name: row.name || '',
        document: row.document || '',
        email: row.email || '',
        phone: row.phone || '',
        address: row.address || '',
      },
      errors,
      warnings,
    }
  }

  // Parse do arquivo CSV
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setIsValidating(true)
    setParsedData([])
    setImportResult(null)

    try {
      const text = await selectedFile.text()
      const lines = text.split('\n').filter(line => line.trim())

      if (lines.length < 2) {
        alert('Arquivo vazio ou sem dados')
        setIsValidating(false)
        return
      }

      // Parse header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      // Validar headers obrigatórios
      if (!headers.includes('name') || !headers.includes('document')) {
        alert('CSV deve conter as colunas: name, document')
        setIsValidating(false)
        return
      }

      // Parse rows
      const parsed: ParsedRow[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const row: any = {}
        
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })

        parsed.push(validateRow(row, i + 1))
      }

      setParsedData(parsed)
    } catch (error) {
      console.error('Erro ao processar CSV:', error)
      alert('Erro ao processar arquivo CSV')
    } finally {
      setIsValidating(false)
    }
  }

  // Importar dados validados
  const handleImport = async () => {
    if (!file) return

    // Filtrar apenas linhas sem erros
    const validRows = parsedData.filter(row => row.errors.length === 0)
    
    if (validRows.length === 0) {
      alert('Nenhuma linha válida para importar')
      return
    }

    setIsImporting(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const result = await importClientsFromCSV({ status: 'idle', message: null }, formData)
      setImportResult(result)
    } catch (error) {
      console.error('Erro ao importar:', error)
      alert('Erro ao importar clientes')
    } finally {
      setIsImporting(false)
    }
  }

  // Estatísticas
  const stats = {
    total: parsedData.length,
    valid: parsedData.filter(r => r.errors.length === 0).length,
    withErrors: parsedData.filter(r => r.errors.length > 0).length,
    withWarnings: parsedData.filter(r => r.warnings.length > 0 && r.errors.length === 0).length,
  }

  return (
    <div className="space-y-6">
      {/* Upload */}
      <Card>
        <CardHeader>
          <CardTitle>1. Selecione o arquivo CSV</CardTitle>
          <CardDescription>
            O arquivo deve conter as colunas: name, document (obrigatórios), email, phone, address (opcionais)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="file">Arquivo CSV</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isValidating || isImporting}
              />
            </div>

            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <IconFileText className="h-4 w-4" />
                <span>{file.name}</span>
                <span>({(file.size / 1024).toFixed(2)} KB)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview e Validação */}
      {parsedData.length > 0 && (
        <>
          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle>2. Validação dos Dados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/20">
                    <IconFileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                    <div className="text-xs text-muted-foreground">Total de linhas</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/20">
                    <IconCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{stats.valid}</div>
                    <div className="text-xs text-muted-foreground">Válidas</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-yellow-100 p-2 dark:bg-yellow-900/20">
                    <IconAlertTriangle className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{stats.withWarnings}</div>
                    <div className="text-xs text-muted-foreground">Com avisos</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="rounded-full bg-red-100 p-2 dark:bg-red-900/20">
                    <IconX className="h-4 w-4 text-red-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">{stats.withErrors}</div>
                    <div className="text-xs text-muted-foreground">Com erros</div>
                  </div>
                </div>
              </div>

              {stats.valid > 0 && (
                <Alert className="mt-4">
                  <IconCheck className="h-4 w-4" />
                  <AlertDescription>
                    {stats.valid} {stats.valid === 1 ? 'cliente' : 'clientes'} pronto(s) para importar
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Preview da Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>3. Preview dos Dados</CardTitle>
              <CardDescription>
                Revise os dados antes de importar. Linhas com erros não serão importadas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Linha</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Documento</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Problemas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.slice(0, 50).map((row) => (
                      <TableRow key={row.line}>
                        <TableCell className="font-mono text-xs">{row.line}</TableCell>
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <Badge variant="destructive">Erro</Badge>
                          ) : row.warnings.length > 0 ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              Aviso
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{row.data.name}</TableCell>
                        <TableCell className="font-mono text-sm">{row.data.document}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {row.data.email || '-'}
                        </TableCell>
                        <TableCell>
                          {row.errors.length > 0 && (
                            <div className="text-xs text-destructive">
                              {row.errors.join(', ')}
                            </div>
                          )}
                          {row.warnings.length > 0 && row.errors.length === 0 && (
                            <div className="text-xs text-yellow-600">
                              {row.warnings.join(', ')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {parsedData.length > 50 && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Mostrando 50 de {parsedData.length} linhas
                </p>
              )}
            </CardContent>
          </Card>

          {/* Ações */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null)
                setParsedData([])
                setImportResult(null)
              }}
              disabled={isImporting}
            >
              Cancelar
            </Button>

            <Button
              onClick={handleImport}
              disabled={stats.valid === 0 || isImporting}
            >
              <IconUpload className="mr-2 h-4 w-4" />
              {isImporting ? 'Importando...' : `Importar ${stats.valid} cliente(s)`}
            </Button>
          </div>
        </>
      )}

      {/* Resultado */}
      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultado da Importação</CardTitle>
          </CardHeader>
          <CardContent>
            {importResult.status === 'success' ? (
              <Alert>
                <IconCheck className="h-4 w-4" />
                <AlertDescription>
                  {importResult.message}
                  {importResult.summary && (
                    <div className="mt-2 space-y-1">
                      <p>Processados: {importResult.summary.processed}</p>
                      <p className="text-green-600">Importados: {importResult.summary.created}</p>
                      <p className="text-red-600">Ignorados: {importResult.summary.skipped}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <IconX className="h-4 w-4" />
                <AlertDescription>{importResult.message}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

