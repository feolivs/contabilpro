import { TasksPageContent } from '@/components/tasks/tasks-page-content'
import { requirePermission } from '@/lib/auth/rbac'

export default async function TarefasPage() {
  await requirePermission('tarefas.read')

  return <TasksPageContent />
}
