import { Inter } from 'next/font/google'
import { headers } from 'next/headers'

import { AppSidebar } from '@/components/app-sidebar'
import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  const headerList = headers()
  const tenantSlug = headerList.get('x-tenant') ?? ''
  const roles = headerList.get('x-roles') ?? ''

  return (
    <div className={inter.className} data-tenant={tenantSlug} data-roles={roles}>
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
