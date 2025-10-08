import { Metadata } from 'next'
import { ImportPageContent } from '@/components/features/import/import-page-content'

export const metadata: Metadata = {
  title: 'Importar Documentos | ContabilPRO',
  description: 'Importe notas fiscais (XML) e extratos bancários (OFX)',
}

export default function ImportPage() {
  return <ImportPageContent />
}

