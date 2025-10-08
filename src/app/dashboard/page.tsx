import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, Upload, TrendingUp } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get clients count
  const { count: clientsCount } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Bem-vindo, {user?.user_metadata?.name || 'Usuário'}!
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">
          Aqui está um resumo das suas atividades
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientsCount || 0}</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Clientes cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documentos Importados</CardTitle>
            <Upload className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              XML/OFX processados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Relatórios Gerados</CardTitle>
            <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              DRE e balanços
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Economia de Tempo</CardTitle>
            <TrendingUp className="h-4 w-4 text-slate-600 dark:text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0h</div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Horas economizadas
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>
              Acesse as funcionalidades mais usadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link
              href="/dashboard/clients/new"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium">Adicionar Cliente</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Cadastrar novo cliente
                </p>
              </div>
            </Link>
            <a
              href="/dashboard/import"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Upload className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium">Importar Documentos</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Upload de XML/OFX
                </p>
              </div>
            </a>
            <a
              href="/dashboard/reports"
              className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <FileText className="h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Gerar Relatório</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  DRE e balanços
                </p>
              </div>
            </a>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos Passos</CardTitle>
            <CardDescription>
              Complete a configuração do seu sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">1</span>
              </div>
              <div>
                <p className="font-medium">Cadastre seus clientes</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Adicione os dados dos seus clientes para começar
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">2</span>
              </div>
              <div>
                <p className="font-medium text-slate-600 dark:text-slate-400">
                  Importe documentos fiscais
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Faça upload de XML e OFX para automação
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400">3</span>
              </div>
              <div>
                <p className="font-medium text-slate-600 dark:text-slate-400">
                  Gere relatórios automaticamente
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  DRE e balanços em poucos cliques
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

