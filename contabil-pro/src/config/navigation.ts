import type { Permission } from '@/lib/rbac'

export type IconName =
  | 'layoutDashboard'
  | 'users'
  | 'building'
  | 'fileText'
  | 'receipt'
  | 'checkSquare'
  | 'clipboardCheck'
  | 'handshake'
  | 'barChart'
  | 'sparkles'
  | 'settings'

export interface NavigationItem {
  title: string
  href: string
  icon: IconName
  permissions?: Permission[]
  children?: NavigationItem[]
}

export interface NavigationGroup {
  label: string
  items: NavigationItem[]
}

type PermissionList = Permission[] | undefined

function matchesPermission(userPermissions: Permission[], required: PermissionList): boolean {
  if (!required || required.length === 0) {
    return true
  }

  if (userPermissions.includes('*')) {
    return true
  }

  return required.some(permission => {
    if (userPermissions.includes(permission)) {
      return true
    }

    if (!permission.includes('.')) {
      return false
    }

    return userPermissions.some(userPermission => {
      if (userPermission === '*' || userPermission === permission) {
        return true
      }

      if (userPermission.endsWith('.*')) {
        const prefix = userPermission.slice(0, -2)
        return permission.startsWith(prefix + '.')
      }

      return false
    })
  })
}

export function filterNavigationByPermissions(
  groups: NavigationGroup[],
  permissions: Permission[]
): NavigationGroup[] {
  return groups
    .map(group => {
      const items = group.items
        .map(item => {
          if (!item.children || item.children.length === 0) {
            return matchesPermission(permissions, item.permissions) ? item : null
          }

          const filteredChildren = item.children.filter(child =>
            matchesPermission(permissions, child.permissions)
          )

          if (filteredChildren.length === 0) {
            return matchesPermission(permissions, item.permissions)
              ? { ...item, children: [] }
              : null
          }

          return { ...item, children: filteredChildren }
        })
        .filter((item): item is NavigationItem => Boolean(item))

      if (items.length === 0) {
        return null
      }

      return { ...group, items }
    })
    .filter((group): group is NavigationGroup => Boolean(group))
}

export function flattenNavigation(groups: NavigationGroup[]): NavigationItem[] {
  const items: NavigationItem[] = []

  for (const group of groups) {
    for (const item of group.items) {
      items.push(item)
      if (item.children) {
        items.push(...item.children)
      }
    }
  }

  return items
}

export const tenantNavigation: NavigationGroup[] = [
  {
    label: 'Visao geral',
    items: [
      {
        title: 'Dashboard',
        href: '/dashboard',
        icon: 'layoutDashboard',
        permissions: ['dashboard.read'],
      },
    ],
  },
  {
    label: 'Cadastros',
    items: [
      {
        title: 'Clientes',
        href: '/clientes',
        icon: 'users',
        permissions: ['clientes.read'],
      },
      {
        title: 'Contas bancarias',
        href: '/bancos',
        icon: 'building',
        permissions: ['bancos.read'],
      },
      {
        title: 'Documentos',
        href: '/documentos',
        icon: 'fileText',
        permissions: ['documentos.read'],
      },
    ],
  },
  {
    label: 'Operacoes',
    items: [
      {
        title: 'Lancamentos',
        href: '/lancamentos',
        icon: 'receipt',
        permissions: ['lancamentos.read'],
      },
      {
        title: 'Fiscal',
        href: '/fiscal',
        icon: 'checkSquare',
        permissions: ['fiscal.read'],
      },
      {
        title: 'Tarefas',
        href: '/tarefas',
        icon: 'clipboardCheck',
        permissions: ['tarefas.read'],
      },
      {
        title: 'Propostas',
        href: '/propostas',
        icon: 'handshake',
        permissions: ['propostas.read'],
      },
    ],
  },
  {
    label: 'Inteligencia',
    items: [
      {
        title: 'Relatorios',
        href: '/relatorios',
        icon: 'barChart',
        permissions: ['relatorios.read'],
      },
      {
        title: 'Copiloto',
        href: '/copiloto',
        icon: 'sparkles',
        permissions: ['copiloto.read'],
      },
    ],
  },
  {
    label: 'Administracao',
    items: [
      {
        title: 'Configuracoes',
        href: '/config',
        icon: 'settings',
        permissions: ['config.read'],
      },
    ],
  },
]
