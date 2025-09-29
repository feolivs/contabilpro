'use client'

import type { ComponentType } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { IconName, NavigationGroup, NavigationItem } from '@/config/navigation'
import { buildTenantUrl, isPathActiveWithTenant } from '@/lib/navigation'

import {
  BarChart3,
  Building2,
  CheckSquare,
  ClipboardCheck,
  FileText,
  Handshake,
  LayoutDashboard,
  Receipt,
  Settings,
  Sparkles,
  Users,
} from 'lucide-react'

const ICONS: Record<IconName, ComponentType<{ className?: string }>> = {
  layoutDashboard: LayoutDashboard,
  users: Users,
  building: Building2,
  fileText: FileText,
  receipt: Receipt,
  checkSquare: CheckSquare,
  clipboardCheck: ClipboardCheck,
  handshake: Handshake,
  barChart: BarChart3,
  sparkles: Sparkles,
  settings: Settings,
}

interface SidebarNavigationProps {
  groups: NavigationGroup[]
  tenantSlug?: string
}

export function SidebarNavigation({ groups, tenantSlug }: SidebarNavigationProps) {
  const pathname = usePathname()

  return groups.map(group => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map(item => (
            <SidebarMenuItem key={item.href}>
              <NavigationLink item={item} pathname={pathname} tenantSlug={tenantSlug} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}

function NavigationLink({
  item,
  pathname,
  tenantSlug,
}: {
  item: NavigationItem
  pathname: string
  tenantSlug?: string
}) {
  const Icon = ICONS[item.icon] ?? LayoutDashboard
  const tenantUrl = buildTenantUrl(tenantSlug, item.href)
  const isActive = isPathActiveWithTenant(pathname, tenantUrl)

  return (
    <SidebarMenuButton asChild isActive={isActive}>
      <Link href={tenantUrl} className='flex items-center gap-2'>
        <Icon className='size-4' />
        <span className='truncate'>{item.title}</span>
      </Link>
    </SidebarMenuButton>
  )
}
