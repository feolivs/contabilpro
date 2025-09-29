'use client'

import { CommandPalette } from './command-palette'
import { searchClients } from '@/actions/clients'

/**
 * Wrapper do CommandPalette que integra com a Server Action
 * Este componente pode ser adicionado ao layout principal
 */
export function CommandPaletteWrapper() {
  return <CommandPalette searchClients={searchClients} />
}

