import { SearchForm } from '@/components/search-form'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import type { NavigationGroup } from '@/config/navigation'

import { SidebarNavigation } from './app-sidebar-nav'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  navGroups: NavigationGroup[]
  tenantSlug?: string
}

export function AppSidebar({ navGroups, tenantSlug, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <TenantSummary tenantSlug={tenantSlug} />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavigation groups={navGroups} tenantSlug={tenantSlug} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function TenantSummary({ tenantSlug }: { tenantSlug?: string }) {
  const initials = tenantSlug ? tenantSlug.slice(0, 2).toUpperCase() : '??'

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-semibold'>
            {initials}
          </div>
          <div className='flex flex-col gap-0.5 leading-none'>
            <span className='font-medium'>Escritorio ativo</span>
            <span className='truncate text-sm text-muted-foreground'>
              {tenantSlug ?? 'Selecione um tenant'}
            </span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
