import { After, AfterAll, Before, BeforeAll, Status } from '@cucumber/cucumber'

import type { CustomWorld } from './world'

// Hook executado antes de todos os testes
BeforeAll(async function () {
  console.log('🚀 Iniciando testes BDD do ContabilPRO')

  // Verificar se o servidor está rodando
  try {
    const response = await fetch('http://localhost:3001/api/health')
    if (!response.ok) {
      throw new Error('Servidor não está respondendo')
    }
    console.log('✅ Servidor está rodando')
  } catch (error) {
    console.error('❌ Erro ao conectar com o servidor:', error)
    console.log('💡 Certifique-se de que o servidor está rodando com: npm run dev')
    process.exit(1)
  }
})

// Hook executado antes de cada cenário
Before(async function (this: CustomWorld, scenario) {
  console.log(`\n🧪 Executando: ${scenario.pickle.name}`)

  // Inicializar browser e página
  await this.init()

  // Configurar interceptadores de rede se necessário
  await this.page.route('**/api/**', async route => {
    // Log de requisições API para debug
    console.log(`📡 API Call: ${route.request().method()} ${route.request().url()}`)
    await route.continue()
  })

  // Configurar dados de teste base se necessário
  await this.setupTestData?.()
})

// Hook executado após cada cenário
After(async function (this: CustomWorld, scenario) {
  // Capturar screenshot em caso de falha
  if (scenario.result?.status === Status.FAILED) {
    console.log('❌ Cenário falhou, capturando screenshot...')
    await this.takeScreenshot(`failed-${scenario.pickle.name.replace(/\s+/g, '-')}`)

    // Capturar logs do console
    const logs = await this.page.evaluate(() => {
      return (window as any).testLogs || []
    })

    if (logs.length > 0) {
      this.attach(JSON.stringify(logs, null, 2), 'application/json')
    }
  }

  // Limpar dados de teste
  await this.cleanupTestData?.()

  // Fechar browser
  await this.cleanup()

  const status = scenario.result?.status === Status.PASSED ? '✅' : '❌'
  console.log(`${status} ${scenario.pickle.name} - ${scenario.result?.status}`)
})

// Hook executado após todos os testes
AfterAll(async function () {
  console.log('\n🏁 Testes BDD finalizados')

  // Gerar relatório consolidado se necessário
  console.log('📊 Relatórios disponíveis em: test-results/')
})

// Hook específico para cenários com tag @database
Before({ tags: '@database' }, async function (this: CustomWorld) {
  console.log('🗄️ Preparando dados de teste no banco...')
  // Implementar setup específico de banco de dados
})

After({ tags: '@database' }, async function (this: CustomWorld) {
  console.log('🧹 Limpando dados de teste do banco...')
  // Implementar limpeza específica de banco de dados
})

// Hook específico para cenários com tag @api
Before({ tags: '@api' }, async function (this: CustomWorld) {
  console.log('🔌 Configurando mocks de API...')
  // Implementar mocks específicos de API
})

// Hook específico para cenários com tag @slow
Before({ tags: '@slow' }, async function (this: CustomWorld) {
  console.log('🐌 Cenário lento detectado, aumentando timeouts...')
  this.timeout = 60000 // 60 segundos para cenários lentos
  this.page.setDefaultTimeout(this.timeout)
})

// Hook para capturar erros não tratados
Before(async function (this: CustomWorld) {
  // Capturar erros JavaScript da página
  this.page.on('pageerror', error => {
    console.error('💥 Erro JavaScript na página:', error.message)
    this.attach(`JavaScript Error: ${error.message}\n${error.stack}`, 'text/plain')
  })

  // Capturar falhas de requisições
  this.page.on('requestfailed', request => {
    console.error('🚫 Requisição falhou:', request.url(), request.failure()?.errorText)
    this.attach(
      `Request Failed: ${request.url()}\nError: ${request.failure()?.errorText}`,
      'text/plain'
    )
  })

  // Capturar logs do console
  this.page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('🔴 Console Error:', msg.text())
      this.attach(`Console Error: ${msg.text()}`, 'text/plain')
    }
  })
})
