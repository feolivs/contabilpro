import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { verifySession } from './auth'

export type Permission = string

export interface RBACContext {
  userId: string
  userEmail: string
  tenantId: string
  tenantSlug: string
  roles: string[]
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: ['*'], // Role mais alto - acesso total ao sistema
  super_admin: ['*'],
  admin: [
    'dashboard.*',
    'clientes.*',
    'lancamentos.*',
    'bancos.*',
    'fiscal.*',
    'documentos.*',
    'tarefas.*',
    'propostas.*',
    'relatorios.*',
    'copiloto.*',
    'config.*',
  ],
  contador: [
    'dashboard.*',
    'clientes.*',
    'lancamentos.*',
    'bancos.*',
    'fiscal.*',
    'documentos.*',
    'tarefas.*',
    'relatorios.*',
    'copiloto.*',
    'config.read',
  ],
  assistente: [
    'dashboard.read',
    'clientes.read',
    'clientes.write',
    'lancamentos.read',
    'lancamentos.write',
    'documentos.read',
    'documentos.write',
    'tarefas.read',
    'relatorios.read',
  ],
  cliente: [
    'dashboard.read',
    'clientes.read',
    'lancamentos.read',
    'documentos.read',
    'relatorios.read',
  ],
  user: ['dashboard.read', 'clientes.read', 'lancamentos.read'],
}

export async function getRBACContext(): Promise<RBACContext | null> {
  const headersList = await headers()

  let userId = headersList.get('x-user') ?? ''
  let userEmail = headersList.get('x-user-email') ?? ''
  let tenantId = headersList.get('x-tenant-id') ?? ''
  let tenantSlug = headersList.get('x-tenant') ?? ''
  let roles =
    headersList
      .get('x-roles')
      ?.split(',')
      .map(r => r.trim().toLowerCase())
      .filter(Boolean) ?? []

  if (!userId || !tenantId || !tenantSlug || roles.length === 0) {
    const session = await verifySession()

    if (!session) {
      return null
    }

    const metadata = (session.user.app_metadata ?? {}) as Record<string, unknown>

    if (!userId) {
      userId = session.user.id
    }

    if (!userEmail) {
      userEmail = session.user.email ?? ''
    }

    if (!tenantId) {
      tenantId = session.tenant_id
    }

    if (!tenantSlug && typeof metadata.tenant_slug === 'string') {
      tenantSlug = metadata.tenant_slug
    }

    if (roles.length === 0) {
      if (Array.isArray(metadata.roles) && metadata.roles.length > 0) {
        roles = metadata.roles.map(value => String(value)).map(r => r.trim().toLowerCase())
      } else if (typeof metadata.role === 'string') {
        roles = [metadata.role.trim().toLowerCase()]
      } else {
        roles = [(session.role ?? 'user').trim().toLowerCase()]
      }
    }
  }

  if (!userId || !tenantId || !tenantSlug) {
    return null
  }

  if (roles.length === 0) {
    roles = ['user']
  }

  return {
    userId,
    userEmail,
    tenantId,
    tenantSlug,
    roles,
  }
}

export function getPermissionsForRoles(roles: string[]): Permission[] {
  return roles.flatMap(role => ROLE_PERMISSIONS[role] || [])
}

export function hasPermissionFromPermissions(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  if (userPermissions.includes('*')) {
    return true
  }

  if (userPermissions.includes(requiredPermission)) {
    return true
  }

  if (!requiredPermission.includes('.')) {
    return false
  }

  return userPermissions.some(permission => {
    if (permission === '*') {
      return true
    }

    if (permission.endsWith('.*')) {
      const prefix = permission.slice(0, -2)
      return requiredPermission.startsWith(prefix + '.')
    }

    return false
  })
}

export async function can(permission: Permission): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return hasPermission(context.roles, permission)
}

export async function canAny(permissions: Permission[]): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return permissions.some(permission => hasPermission(context.roles, permission))
}

export async function canAll(permissions: Permission[]): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return permissions.every(permission => hasPermission(context.roles, permission))
}

export async function requirePermission(permission: Permission): Promise<RBACContext> {
  const context = await getRBACContext()

  if (!context) {
    redirect('/login')
    throw new Error('Usuario nao autenticado')
  }

  if (!hasPermission(context.roles, permission)) {
    throw new Error(`Permissao negada: ${permission}`)
  }

  return context
}

export async function requireAnyPermission(permissions: Permission[]): Promise<RBACContext> {
  const context = await getRBACContext()

  if (!context) {
    redirect('/login')
    throw new Error('Usuario nao autenticado')
  }

  if (!permissions.some(permission => hasPermission(context.roles, permission))) {
    throw new Error(`Permissao negada: ${permissions.join(' ou ')}`)
  }

  return context
}

function hasPermission(userRoles: string[], requiredPermission: Permission): boolean {
  const userPermissions = getPermissionsForRoles(userRoles)
  return hasPermissionFromPermissions(userPermissions, requiredPermission)
}

export async function getUserPermissions(): Promise<Permission[]> {
  const context = await getRBACContext()

  if (!context) {
    return []
  }

  return getPermissionsForRoles(context.roles)
}

export async function hasRole(role: string): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return context.roles.includes(role)
}

export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return roles.some(role => context.roles.includes(role))
}

export function createPermissionGuard(permission: Permission) {
  return async function PermissionGuard({
    children,
    fallback = null,
  }: {
    children: React.ReactNode
    fallback?: React.ReactNode
  }) {
    const hasAccess = await can(permission)

    if (!hasAccess) {
      return fallback
    }

    return children
  }
}
