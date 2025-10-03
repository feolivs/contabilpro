'use client'

import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { IconBookmark, IconPlus, IconTrash } from '@tabler/icons-react'
import { toast } from 'sonner'

interface SavedFilter {
  id: string
  name: string
  filters: Record<string, any>
  createdAt: string
}

interface SavedFiltersProps {
  currentFilters: Record<string, any>
  onApplyFilter: (filters: Record<string, any>) => void
  storageKey?: string
}

/**
 * Componente de Filtros Salvos
 *
 * Permite salvar e carregar combinações de filtros personalizados.
 * Os filtros são armazenados no localStorage do navegador.
 */
export function SavedFilters({
  currentFilters,
  onApplyFilter,
  storageKey = 'saved-filters-clients',
}: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [filterName, setFilterName] = useState('')

  // Carregar filtros salvos do localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setSavedFilters(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error)
    }
  }, [storageKey])

  // Salvar filtros no localStorage
  const saveFiltersToStorage = (filters: SavedFilter[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters))
      setSavedFilters(filters)
    } catch (error) {
      console.error('Erro ao salvar filtros:', error)
      toast.error('Erro ao salvar filtro')
    }
  }

  // Salvar novo filtro
  const handleSaveFilter = () => {
    if (!filterName.trim()) {
      toast.error('Digite um nome para o filtro')
      return
    }

    // Verificar se já existe um filtro com esse nome
    if (savedFilters.some(f => f.name === filterName)) {
      toast.error('Já existe um filtro com esse nome')
      return
    }

    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name: filterName.trim(),
      filters: currentFilters,
      createdAt: new Date().toISOString(),
    }

    const updated = [...savedFilters, newFilter]
    saveFiltersToStorage(updated)

    toast.success(`Filtro "${filterName}" salvo com sucesso!`)
    setFilterName('')
    setShowSaveDialog(false)
  }

  // Aplicar filtro salvo
  const handleApplyFilter = (filter: SavedFilter) => {
    onApplyFilter(filter.filters)
    toast.success(`Filtro "${filter.name}" aplicado`)
  }

  // Excluir filtro
  const handleDeleteFilter = (filterId: string) => {
    const filter = savedFilters.find(f => f.id === filterId)
    const updated = savedFilters.filter(f => f.id !== filterId)
    saveFiltersToStorage(updated)

    if (filter) {
      toast.success(`Filtro "${filter.name}" excluído`)
    }
  }

  // Verificar se há filtros ativos
  const hasActiveFilters = Object.keys(currentFilters).length > 0

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='outline' size='sm'>
            <IconBookmark className='mr-2 h-4 w-4' />
            Filtros Salvos
            {savedFilters.length > 0 && (
              <span className='ml-2 rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground'>
                {savedFilters.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[250px]'>
          {savedFilters.length === 0 ? (
            <div className='p-4 text-center text-sm text-muted-foreground'>Nenhum filtro salvo</div>
          ) : (
            <>
              {savedFilters.map(filter => (
                <DropdownMenuItem
                  key={filter.id}
                  className='flex items-center justify-between'
                  onSelect={e => {
                    e.preventDefault()
                  }}
                >
                  <button className='flex-1 text-left' onClick={() => handleApplyFilter(filter)}>
                    {filter.name}
                  </button>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-6 w-6 p-0'
                    onClick={e => {
                      e.stopPropagation()
                      handleDeleteFilter(filter.id)
                    }}
                  >
                    <IconTrash className='h-3 w-3' />
                  </Button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onSelect={() => setShowSaveDialog(true)} disabled={!hasActiveFilters}>
            <IconPlus className='mr-2 h-4 w-4' />
            Salvar filtros atuais
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialog para salvar novo filtro */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Salvar Filtros</DialogTitle>
            <DialogDescription>
              Dê um nome para esta combinação de filtros para reutilizá-la depois.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='filter-name'>Nome do filtro</Label>
              <Input
                id='filter-name'
                placeholder='Ex: Clientes MEI Ativos'
                value={filterName}
                onChange={e => setFilterName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    handleSaveFilter()
                  }
                }}
              />
            </div>

            {/* Preview dos filtros atuais */}
            <div className='rounded-md border p-3'>
              <p className='text-sm font-medium mb-2'>Filtros que serão salvos:</p>
              <div className='space-y-1'>
                {Object.entries(currentFilters).map(([key, value]) => (
                  <div key={key} className='text-xs text-muted-foreground'>
                    <span className='font-medium'>{key}:</span>{' '}
                    {Array.isArray(value) ? value.join(', ') : String(value)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowSaveDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveFilter}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Versão compacta do SavedFilters
 */
export function SavedFiltersCompact({
  currentFilters,
  onApplyFilter,
  storageKey = 'saved-filters-clients',
}: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setSavedFilters(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Erro ao carregar filtros salvos:', error)
    }
  }, [storageKey])

  if (savedFilters.length === 0) return null

  return (
    <div className='flex items-center gap-2'>
      <span className='text-sm text-muted-foreground'>Filtros salvos:</span>
      <div className='flex flex-wrap gap-1'>
        {savedFilters.slice(0, 3).map(filter => (
          <Button
            key={filter.id}
            variant='outline'
            size='sm'
            onClick={() => {
              onApplyFilter(filter.filters)
              toast.success(`Filtro "${filter.name}" aplicado`)
            }}
          >
            {filter.name}
          </Button>
        ))}
        {savedFilters.length > 3 && (
          <span className='text-xs text-muted-foreground self-center'>
            +{savedFilters.length - 3} mais
          </span>
        )}
      </div>
    </div>
  )
}
