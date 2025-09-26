import { Inter } from 'next/font/google'
import { headers } from 'next/headers'

import { AppSidebar } from '@/components/app-sidebar'
import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  // Ler contexto dos headers (injetados pelo middleware)
  const headersList = await headers()
  const tenantSlug = headersList.get('x-tenant')
  const tenantId = headersList.get('x-tenant-id')
  const userId = headersList.get('x-user')
  const userEmail = headersList.get('x-user-email')
  const roles = headersList.get('x-roles')?.split(',') || []

  // Layout do tenant sem lógica pesada - apenas UI
  return (
    <div className={inter.className}>
      <Providers>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SiteHeader />
            <main className='flex-1 overflow-auto p-6'>{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </Providers>
    </div>
  )
}
