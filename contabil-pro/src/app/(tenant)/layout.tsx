import { Inter } from 'next/font/google'
import { headers } from 'next/headers'

import { AppSidebar } from '@/components/app-sidebar'
import { Providers } from '@/components/providers'
import { SiteHeader } from '@/components/site-header'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { filterNavigationByPermissions, tenantNavigation } from '@/config/navigation'
import { getPermissionsForRoles, getRBACContext } from '@/lib/rbac'

import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const context = await getRBACContext()
  const fallbackHeaders = await headers()

  const tenantSlug = context?.tenantSlug ?? fallbackHeaders.get('x-tenant') ?? ''
  const roles =
    context?.roles ??
    fallbackHeaders
      .get('x-roles')
      ?.split(',')
      .map(r => r.trim().toLowerCase())
      .filter(Boolean) ??
    []
  const permissions = getPermissionsForRoles(roles)
  const navGroups = filterNavigationByPermissions(tenantNavigation, permissions)

  return (
    <div className={inter.className} data-tenant={tenantSlug} data-roles={roles.join(',')}>
      <Providers>
        <SidebarProvider>
          <AppSidebar navGroups={navGroups} tenantSlug={tenantSlug} />
          <SidebarInset>
            <SiteHeader navGroups={navGroups} />
            <main className='flex-1 overflow-auto p-6'>{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </Providers>
    </div>
  )
}
