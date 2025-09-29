'use client'

import { Fragment, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import type { NavigationGroup, NavigationItem } from '@/config/navigation'
import { flattenNavigation } from '@/config/navigation'

interface SiteHeaderProps {
  navGroups: NavigationGroup[]
}

export function SiteHeader({ navGroups }: SiteHeaderProps) {
  const pathname = usePathname()
  const flatNav = useMemo(() => flattenNavigation(navGroups), [navGroups])
  const trail = useMemo(() => buildBreadcrumbTrail(flatNav, pathname), [flatNav, pathname])
  const currentTitle = trail.length > 0 ? trail[trail.length - 1].title : 'Dashboard'

  return (
    <header className='flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)'>
      <div className='flex w-full items-center gap-3 px-4 lg:gap-4 lg:px-6'>
        <SidebarTrigger className='-ml-1' />
        <Separator orientation='vertical' className='mx-1 hidden h-6 sm:flex' />
        <div className='flex flex-1 flex-col gap-1 overflow-hidden'>
          <Breadcrumb aria-label='Navegacao atual'>
            <BreadcrumbList>
              {trail.map((crumb, index) => (
                <Fragment key={crumb.href}>
                  <BreadcrumbItem>
                    {index === trail.length - 1 ? (
                      <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={crumb.href}>{crumb.title}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < trail.length - 1 ? <BreadcrumbSeparator /> : null}
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
          <h1 className='truncate text-base font-semibold md:text-lg'>{currentTitle}</h1>
        </div>
        <div className='ml-auto flex items-center gap-2'>
          {/* Espaco reservado para acoes futuras */}
        </div>
      </div>
    </header>
  )
}

function buildBreadcrumbTrail(navItems: NavigationItem[], pathname: string) {
  const normalizedPath = pathname === '' ? '/' : pathname
  const segments = normalizedPath.split('/').filter(Boolean)

  if (segments.length === 0) {
    const dashboard = navItems.find(item => item.href === '/dashboard')
    return dashboard ? [{ title: dashboard.title, href: dashboard.href }] : []
  }

  const crumbs: Array<{ title: string; href: string }> = []
  let currentPath = ''

  segments.forEach(segment => {
    currentPath = currentPath ? currentPath + '/' + segment : '/' + segment
    const match = navItems.find(item => item.href === currentPath)
    if (match) {
      crumbs.push({ title: match.title, href: match.href })
    } else {
      crumbs.push({ title: formatSegmentLabel(segment), href: currentPath })
    }
  })

  return crumbs
}

function formatSegmentLabel(segment: string) {
  return segment.replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
}
