const config = {
  // Localização dos arquivos .feature
  features: ['packages/bdd/features/**/*.feature'],
  
  // Localização dos step definitions
  steps: ['packages/bdd/steps/**/*.ts'],
  
  // Configurações de formato e relatórios
  format: [
    'progress-bar',
    'json:test-results/cucumber-report.json',
    'html:test-results/cucumber-report.html',
    '@cucumber/pretty-formatter'
  ],
  
  // Configurações de execução
  parallel: 2,
  retry: 1,
  
  // Tags para filtrar cenários
  tags: process.env.CUCUMBER_TAGS || 'not @skip',
  
  // Configurações específicas do ambiente
  worldParameters: {
    baseUrl: process.env.BASE_URL || 'http://localhost:3001',
    headless: process.env.HEADLESS !== 'false',
    slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
    timeout: process.env.TIMEOUT ? parseInt(process.env.TIMEOUT) : 30000,
  },
  
  // Configurações de timeout
  timeout: 60000,
  
  // Configurações de linguagem
  language: 'pt',
  
  // Hooks e setup
  require: [
    'packages/bdd/support/world.ts',
    'packages/bdd/support/hooks.ts'
  ],
  
  // Configurações de publicação (para CI/CD)
  publish: process.env.CI === 'true',
  
  // Configurações de dry-run para validação
  dryRun: process.env.DRY_RUN === 'true',
}

module.exports = config
