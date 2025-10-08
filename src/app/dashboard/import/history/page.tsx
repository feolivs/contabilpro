import { Metadata } from 'next'
import { ImportHistoryContent } from '@/components/features/import/import-history-content'

export const metadata: Metadata = {
  title: 'Histórico de Importações | ContabilPRO',
  description: 'Visualize e gerencie o histórico de documentos importados',
}

export default function ImportHistoryPage() {
  return <ImportHistoryContent />
}

