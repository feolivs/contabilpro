import { requirePermission } from '@/lib/auth/rbac';
import { TasksPageContent } from '@/components/tasks/tasks-page-content';

export default async function TarefasPage() {
  await requirePermission('tarefas.read');

  return <TasksPageContent />;
}
