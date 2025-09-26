import Link from 'next/link'

import { ArrowRight, Calculator, CheckCircle, FileText, TrendingUp, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function LandingPage() {
  return (
    <div className='flex flex-col min-h-screen'>
      {/* Header */}
      <header className='px-4 lg:px-6 h-14 flex items-center border-b'>
        <Link className='flex items-center justify-center' href='/'>
          <Calculator className='h-6 w-6 mr-2' />
          <span className='font-bold text-xl'>ContabilPRO</span>
        </Link>
        <nav className='ml-auto flex gap-4 sm:gap-6'>
          <Link className='text-sm font-medium hover:underline underline-offset-4' href='#features'>
            Recursos
          </Link>
          <Link className='text-sm font-medium hover:underline underline-offset-4' href='#pricing'>
            Preços
          </Link>
          <Link className='text-sm font-medium hover:underline underline-offset-4' href='/login'>
            Entrar
          </Link>
        </nav>
      </header>

      <main className='flex-1'>
        {/* Hero Section */}
        <section className='w-full py-12 md:py-24 lg:py-32 xl:py-48'>
          <div className='container px-4 md:px-6'>
            <div className='flex flex-col items-center space-y-4 text-center'>
              <div className='space-y-2'>
                <Badge variant='secondary' className='mb-4'>
                  🚀 Novo: Integração com Open Finance
                </Badge>
                <h1 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none'>
                  Contabilidade Inteligente
                  <br />
                  <span className='text-primary'>com IA e Automação</span>
                </h1>
                <p className='mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400'>
                  Plataforma completa para escritórios contábeis com classificação automática,
                  conciliação bancária, emissão de NFe e cálculo de impostos.
                </p>
              </div>
              <div className='space-x-4'>
                <Button size='lg' asChild>
                  <Link href='/register'>
                    Começar Gratuitamente
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
                <Button variant='outline' size='lg' asChild>
                  <Link href='/demo'>Ver Demo</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section
          id='features'
          className='w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900'
        >
          <div className='container px-4 md:px-6'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
                Recursos Poderosos
              </h2>
              <p className='mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400 mt-4'>
                Tudo que você precisa para modernizar sua contabilidade
              </p>
            </div>

            <div className='grid gap-6 lg:grid-cols-3 lg:gap-12'>
              <Card>
                <CardHeader>
                  <Zap className='h-10 w-10 text-primary mb-2' />
                  <CardTitle>IA para Classificação</CardTitle>
                  <CardDescription>
                    Classificação automática de lançamentos com 95% de precisão
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2 text-sm'>
                    <li className='flex items-center'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                      Reconhecimento de padrões
                    </li>
                    <li className='flex items-center'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                      Sugestões inteligentes
                    </li>
                    <li className='flex items-center'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                      Aprendizado contínuo
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className='h-10 w-10 text-primary mb-2' />
                  <CardTitle>Automação Fiscal</CardTitle>
                  <CardDescription>NFe, NFS-e e cálculo automático de impostos</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2 text-sm'>
                    <li className='flex items-center'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                      Emissão de NFe
                    </li>
                    <li className='flex items-center'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                      Cálculo de DAS
                    </li>
                    <li className='flex items-center'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                      Obrigações fiscais
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className='h-10 w-10 text-primary mb-2' />
                  <CardTitle>Open Finance</CardTitle>
                  <CardDescription>Conciliação bancária automática e segura</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className='space-y-2 text-sm'>
                    <li className='flex items-center'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                      Conexão com bancos
                    </li>
                    <li className='flex items-center'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                      Conciliação automática
                    </li>
                    <li className='flex items-center'>
                      <CheckCircle className='h-4 w-4 text-green-500 mr-2' />
                      Segurança FAPI
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='w-full py-12 md:py-24 lg:py-32'>
          <div className='container px-4 md:px-6'>
            <div className='flex flex-col items-center space-y-4 text-center'>
              <div className='space-y-2'>
                <h2 className='text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl'>
                  Pronto para Modernizar?
                </h2>
                <p className='mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400'>
                  Junte-se a centenas de escritórios que já automatizaram sua contabilidade
                </p>
              </div>
              <div className='space-x-4'>
                <Button size='lg' asChild>
                  <Link href='/register'>
                    Começar Agora
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className='flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t'>
        <p className='text-xs text-gray-500 dark:text-gray-400'>
          © 2024 ContabilPRO. Todos os direitos reservados.
        </p>
        <nav className='sm:ml-auto flex gap-4 sm:gap-6'>
          <Link className='text-xs hover:underline underline-offset-4' href='/termos'>
            Termos de Uso
          </Link>
          <Link className='text-xs hover:underline underline-offset-4' href='/privacidade'>
            Privacidade
          </Link>
        </nav>
      </footer>
    </div>
  )
}
