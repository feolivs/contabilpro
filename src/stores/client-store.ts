import { create } from 'zustand'

interface Client {
  id: string
  name: string
  cnpj: string
}

interface ClientState {
  selectedClient: Client | null
  setSelectedClient: (client: Client | null) => void
}

export const useClientStore = create<ClientState>((set) => ({
  selectedClient: null,
  setSelectedClient: (client) => set({ selectedClient: client }),
}))

