import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'ContabilPRO - Sistema Contabil Brasileiro',
  description: 'Sistema Contabil completo para empresas brasileiras com NFe, Open Finance e IA',
  keywords: ['contabilidade', 'sistema Contabil', 'NFe', 'Open Finance', 'Brasil', 'multi-tenant'],
  authors: [{ name: 'ContabilPRO Team' }],
  creator: 'ContabilPRO',
  publisher: 'ContabilPRO',
  robots: {
    index: false,
    follow: false,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

// Layout raiz obrigatorio com html/body - layouts especificos em route groups
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='pt-BR' suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
