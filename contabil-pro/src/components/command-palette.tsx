'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { IconFileText, IconUsers, IconReceipt, IconSearch } from '@tabler/icons-react'
import { formatDocument } from '@/lib/document-utils'

interface SearchResult {
  id: string
  name: string
  document?: string
  email?: string
  type: 'client' | 'document' | 'entry'
}

interface CommandPaletteProps {
  searchClients: (query: string) => Promise<SearchResult[]>
}

/**
 * Command Palette - Busca global com atalho Cmd/Ctrl+K
 * 
 * Features:
 * - Atalho de teclado Cmd/Ctrl+K para abrir
 * - Debounce de 300ms na busca
 * - Navegação por teclado
 * - Acessibilidade (ARIA labels)
 * - Formatação de documentos (CPF/CNPJ)
 */
export function CommandPalette({ searchClients }: CommandPaletteProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Atalho Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  // Debounce search (300ms)
  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchClients(search)
        setResults(data)
      } catch (error) {
        console.error('Erro ao buscar:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, searchClients])

  // Limpar busca ao fechar
  const handleOpenChange = useCallback((open: boolean) => {
    setOpen(open)
    if (!open) {
      setSearch('')
      setResults([])
    }
  }, [])

  // Navegar para resultado
  const handleSelect = useCallback((result: SearchResult) => {
    const routes = {
      client: `/clientes/${result.id}`,
      document: `/documentos/${result.id}`,
      entry: `/lancamentos/${result.id}`,
    }
    
    router.push(routes[result.type])
    setOpen(false)
  }, [router])

  // Agrupar resultados por tipo
  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = []
    }
    acc[result.type].push(result)
    return acc
  }, {} as Record<string, SearchResult[]>)

  return (
    <CommandDialog open={open} onOpenChange={handleOpenChange}>
      <CommandInput
        placeholder="Buscar clientes, documentos, lançamentos..."
        value={search}
        onValueChange={setSearch}
        aria-label="Busca global"
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-6">
              <IconSearch className="h-4 w-4 animate-pulse" />
              <span className="text-sm text-muted-foreground">Buscando...</span>
            </div>
          ) : search.length < 2 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Digite pelo menos 2 caracteres para buscar
            </div>
          ) : (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum resultado encontrado
            </div>
          )}
        </CommandEmpty>

        {groupedResults.client && groupedResults.client.length > 0 && (
          <>
            <CommandGroup heading="Clientes">
              {groupedResults.client.map((client) => (
                <CommandItem
                  key={client.id}
                  value={`client-${client.id}`}
                  onSelect={() => handleSelect(client)}
                  className="flex items-center gap-3"
                >
                  <IconUsers className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="font-medium">{client.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {client.document && formatDocument(client.document)}
                      {client.email && ` • ${client.email}`}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
            {(groupedResults.document || groupedResults.entry) && <CommandSeparator />}
          </>
        )}

        {groupedResults.document && groupedResults.document.length > 0 && (
          <>
            <CommandGroup heading="Documentos">
              {groupedResults.document.map((doc) => (
                <CommandItem
                  key={doc.id}
                  value={`document-${doc.id}`}
                  onSelect={() => handleSelect(doc)}
                  className="flex items-center gap-3"
                >
                  <IconFileText className="h-4 w-4 text-muted-foreground" />
                  <span>{doc.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            {groupedResults.entry && <CommandSeparator />}
          </>
        )}

        {groupedResults.entry && groupedResults.entry.length > 0 && (
          <CommandGroup heading="Lançamentos">
            {groupedResults.entry.map((entry) => (
              <CommandItem
                key={entry.id}
                value={`entry-${entry.id}`}
                onSelect={() => handleSelect(entry)}
                className="flex items-center gap-3"
              >
                <IconReceipt className="h-4 w-4 text-muted-foreground" />
                <span>{entry.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      {/* Dica de atalho */}
      <div className="border-t p-2 text-center text-xs text-muted-foreground">
        Pressione <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd> para abrir
      </div>
    </CommandDialog>
  )
}

/**
 * Botão para abrir o Command Palette
 * Pode ser usado na navbar ou sidebar
 */
export function CommandPaletteTrigger() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen(true)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <button
      onClick={() => setOpen(true)}
      className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      aria-label="Busca global"
    >
      <IconSearch className="h-4 w-4" />
      <span>Buscar...</span>
      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
        <span className="text-xs">⌘</span>K
      </kbd>
    </button>
  )
}

