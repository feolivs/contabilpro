'use client'

import { searchClients } from '@/actions/clients'

import { CommandPalette } from './command-palette'

/**
 * Wrapper do CommandPalette que integra com a Server Action
 * Este componente pode ser adicionado ao layout principal
 */
export function CommandPaletteWrapper() {
  return <CommandPalette searchClients={searchClients} />
}
