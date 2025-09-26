import { headers } from 'next/headers'

export type Permission = string // e.g., 'clientes.*', 'clientes.read', 'lancamentos.write', '*'

export interface RBACContext {
  userId: string
  userEmail: string
  tenantId: string
  tenantSlug: string
  roles: string[]
}

/**
 * Mapeamento de roles para permissões
 */
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  // Super admin - acesso total
  super_admin: ['*'],

  // Admin do tenant - acesso total ao tenant
  admin: [
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

  // Contador - acesso completo exceto configurações
  contador: [
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

  // Assistente - acesso limitado
  assistente: [
    'clientes.read',
    'clientes.write',
    'lancamentos.read',
    'lancamentos.write',
    'documentos.read',
    'documentos.write',
    'tarefas.read',
    'relatorios.read',
  ],

  // Cliente - apenas visualização
  cliente: ['clientes.read', 'lancamentos.read', 'documentos.read', 'relatorios.read'],

  // Usuário padrão - acesso mínimo
  user: ['clientes.read', 'lancamentos.read'],
}

/**
 * Obter contexto RBAC dos headers do middleware
 */
export async function getRBACContext(): Promise<RBACContext | null> {
  const headersList = await headers()

  const userId = headersList.get('x-user')
  const userEmail = headersList.get('x-user-email')
  const tenantId = headersList.get('x-tenant-id')
  const tenantSlug = headersList.get('x-tenant')
  const rolesHeader = headersList.get('x-roles')

  if (!userId || !tenantId || !tenantSlug) {
    return null
  }

  const roles = rolesHeader ? rolesHeader.split(',') : ['user']

  return {
    userId,
    userEmail: userEmail || '',
    tenantId,
    tenantSlug,
    roles,
  }
}

/**
 * Verificar se o usuário tem uma permissão específica
 */
export async function can(permission: Permission): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return hasPermission(context.roles, permission)
}

/**
 * Verificar se o usuário tem qualquer uma das permissões
 */
export async function canAny(permissions: Permission[]): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return permissions.some(permission => hasPermission(context.roles, permission))
}

/**
 * Verificar se o usuário tem todas as permissões
 */
export async function canAll(permissions: Permission[]): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return permissions.every(permission => hasPermission(context.roles, permission))
}

/**
 * Middleware de autorização para Server Actions
 */
export async function requirePermission(permission: Permission): Promise<RBACContext> {
  const context = await getRBACContext()

  if (!context) {
    throw new Error('Usuário não autenticado')
  }

  if (!hasPermission(context.roles, permission)) {
    throw new Error(`Permissão negada: ${permission}`)
  }

  return context
}

/**
 * Middleware de autorização para múltiplas permissões (OR)
 */
export async function requireAnyPermission(permissions: Permission[]): Promise<RBACContext> {
  const context = await getRBACContext()

  if (!context) {
    throw new Error('Usuário não autenticado')
  }

  if (!permissions.some(permission => hasPermission(context.roles, permission))) {
    throw new Error(`Permissão negada: ${permissions.join(' ou ')}`)
  }

  return context
}

/**
 * Verificar se roles têm uma permissão específica
 */
function hasPermission(userRoles: string[], requiredPermission: Permission): boolean {
  // Obter todas as permissões dos roles do usuário
  const userPermissions = userRoles.flatMap(role => ROLE_PERMISSIONS[role] || [])

  // Verificar se tem permissão total (*)
  if (userPermissions.includes('*')) {
    return true
  }

  // Verificar permissão exata
  if (userPermissions.includes(requiredPermission)) {
    return true
  }

  // Verificar wildcards (e.g., 'clientes.*' permite 'clientes.read')
  return userPermissions.some(permission => {
    if (permission.endsWith('.*')) {
      const prefix = permission.slice(0, -2)
      return requiredPermission.startsWith(prefix + '.')
    }
    return false
  })
}

/**
 * Obter todas as permissões de um usuário
 */
export async function getUserPermissions(): Promise<Permission[]> {
  const context = await getRBACContext()

  if (!context) {
    return []
  }

  return context.roles.flatMap(role => ROLE_PERMISSIONS[role] || [])
}

/**
 * Verificar se usuário tem role específico
 */
export async function hasRole(role: string): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return context.roles.includes(role)
}

/**
 * Verificar se usuário tem qualquer um dos roles
 */
export async function hasAnyRole(roles: string[]): Promise<boolean> {
  const context = await getRBACContext()

  if (!context) {
    return false
  }

  return roles.some(role => context.roles.includes(role))
}

/**
 * Helper para criar guards condicionais em componentes
 */
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
