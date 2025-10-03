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
}

export function AppSidebar({ navGroups, ...props }: AppSidebarProps) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <AppSummary />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <SidebarNavigation groups={navGroups} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}

function AppSummary() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg font-semibold'>
            CP
          </div>
          <div className='flex flex-col gap-0.5 leading-none'>
            <span className='font-medium'>ContabilPRO</span>
            <span className='truncate text-sm text-muted-foreground'>Sistema Contábil</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
