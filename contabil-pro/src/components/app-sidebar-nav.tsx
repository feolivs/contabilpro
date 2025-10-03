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
}

export function SidebarNavigation({ groups }: SidebarNavigationProps) {
  const pathname = usePathname()

  return groups.map(group => (
    <SidebarGroup key={group.label}>
      <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {group.items.map(item => (
            <SidebarMenuItem key={item.href}>
              <NavigationLink item={item} pathname={pathname} />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  ))
}

function NavigationLink({ item, pathname }: { item: NavigationItem; pathname: string }) {
  const Icon = ICONS[item.icon] ?? LayoutDashboard
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

  return (
    <SidebarMenuButton asChild isActive={isActive}>
      <Link href={item.href} className='flex items-center gap-2'>
        <Icon className='size-4' />
        <span className='truncate'>{item.title}</span>
      </Link>
    </SidebarMenuButton>
  )
}
