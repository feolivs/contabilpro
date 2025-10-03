import { Inter } from 'next/font/google'

import { AppSidebar } from '@/components/app-sidebar'
import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/site-header'
import { ServiceWorkerRegister } from '@/components/notifications/service-worker-register'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { filterNavigationByPermissions, tenantNavigation } from '@/config/navigation'
import { getPermissionsForRoles, getRBACContext } from '@/lib/auth/rbac'

import '../globals.css'
import '../react-pdf.css'

const inter = Inter({ subsets: ['latin'] })

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await getRBACContext()

  const roles = context?.roles ?? ['owner']
  const permissions = getPermissionsForRoles(roles)
  const navGroups = filterNavigationByPermissions(tenantNavigation, permissions)

  return (
    <div className={inter.className} data-roles={roles.join(',')}>
      <Providers>
        <ServiceWorkerRegister />
        <SidebarProvider>
          <AppSidebar navGroups={navGroups} />
          <SidebarInset>
            <SiteHeader navGroups={navGroups} />
            <main className='flex-1 overflow-auto p-6'>{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </Providers>
    </div>
  )
}
