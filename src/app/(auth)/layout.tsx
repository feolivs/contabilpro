import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            ContabilPRO
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Automação Inteligente para Contadores
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}

