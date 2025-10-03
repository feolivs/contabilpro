'use client'

import { useEffect, useState } from 'react'

import { getClientsForDropdown } from '@/actions/clients-simple'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useUpdateDocument } from '@/hooks/use-documents'

import { Loader2 } from 'lucide-react'

interface LinkClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  documentName: string
  currentClientId: string | null
}

export function LinkClientDialog({
  open,
  onOpenChange,
  documentId,
  documentName,
  currentClientId,
}: LinkClientDialogProps) {
  const [clientId, setClientId] = useState<string>(currentClientId || '')
  const [clients, setClients] = useState<
    Array<{
      id: string
      name: string
      document: string
      document_type: string
    }>
  >([])
  const [loading, setLoading] = useState(false)

  const updateMutation = useUpdateDocument()

  useEffect(() => {
    if (open) {
      loadClients()
      setClientId(currentClientId || '')
    }
  }, [open, currentClientId])

  const loadClients = async () => {
    setLoading(true)
    const result = await getClientsForDropdown()
    if (result.success) {
      setClients(result.clients)
    }
    setLoading(false)
  }

  const handleSave = () => {
    updateMutation.mutate(
      {
        id: documentId,
        client_id: clientId || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{currentClientId ? 'Alterar Cliente' : 'Vincular Cliente'}</DialogTitle>
          <DialogDescription>
            Selecione o cliente para vincular ao documento "{documentName}"
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          <div className='space-y-2'>
            <Label htmlFor='client-select'>
              Cliente
              {loading && <Loader2 className='inline-block ml-2 h-3 w-3 animate-spin' />}
            </Label>
            <Select
              value={clientId || 'none'}
              onValueChange={value => setClientId(value === 'none' ? '' : value)}
              disabled={loading || updateMutation.isPending}
            >
              <SelectTrigger id='client-select'>
                <SelectValue placeholder='Selecione um cliente...' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>
                  <span className='text-muted-foreground'>Nenhum (remover vínculo)</span>
                </SelectItem>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id}>
                    <div className='flex items-center gap-2'>
                      <span className='font-medium'>{client.name}</span>
                      <span className='text-xs text-muted-foreground'>
                        {client.document_type === 'cpf' ? 'CPF' : 'CNPJ'}: {client.document}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clientId && (
              <p className='text-xs text-muted-foreground'>
                ✓ Documento será vinculado ao cliente selecionado
              </p>
            )}
            {!clientId && currentClientId && (
              <p className='text-xs text-amber-600'>⚠ O vínculo atual será removido</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            onClick={() => onOpenChange(false)}
            disabled={updateMutation.isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending || loading}>
            {updateMutation.isPending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
