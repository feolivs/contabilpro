import type { IWorldOptions } from '@cucumber/cucumber'
import { setWorldConstructor, World } from '@cucumber/cucumber'
import type { Browser, BrowserContext, Page } from '@playwright/test'
import { chromium, firefox, webkit } from '@playwright/test'

export interface CustomWorldOptions extends IWorldOptions {
  parameters: {
    baseUrl: string
    headless: boolean
    slowMo: number
    timeout: number
  }
}

export class CustomWorld extends World {
  public browser!: Browser
  public context!: BrowserContext
  public page!: Page
  public baseUrl: string
  public headless: boolean
  public slowMo: number
  public timeout: number

  constructor(options: CustomWorldOptions) {
    super(options)

    this.baseUrl = options.parameters.baseUrl
    this.headless = options.parameters.headless
    this.slowMo = options.parameters.slowMo
    this.timeout = options.parameters.timeout
  }

  async init() {
    // Escolher browser baseado na variável de ambiente
    const browserType = process.env.BROWSER || 'chromium'

    switch (browserType) {
      case 'firefox':
        this.browser = await firefox.launch({
          headless: this.headless,
          slowMo: this.slowMo,
        })
        break
      case 'webkit':
        this.browser = await webkit.launch({
          headless: this.headless,
          slowMo: this.slowMo,
        })
        break
      default:
        this.browser = await chromium.launch({
          headless: this.headless,
          slowMo: this.slowMo,
        })
    }

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      // Configurações para testes locais
      baseURL: this.baseUrl,
    })

    this.page = await this.context.newPage()

    // Configurar timeout padrão
    this.page.setDefaultTimeout(this.timeout)
    this.page.setDefaultNavigationTimeout(this.timeout)
  }

  async cleanup() {
    if (this.page) {
      await this.page.close()
    }
    if (this.context) {
      await this.context.close()
    }
    if (this.browser) {
      await this.browser.close()
    }
  }

  // Métodos auxiliares para testes
  async goto(path: string) {
    await this.page.goto(path)
  }

  async waitForSelector(selector: string, options?: { timeout?: number }) {
    return await this.page.waitForSelector(selector, options)
  }

  async click(selector: string) {
    await this.page.click(selector)
  }

  async fill(selector: string, value: string) {
    await this.page.fill(selector, value)
  }

  async getText(selector: string): Promise<string> {
    return (await this.page.textContent(selector)) || ''
  }

  async isVisible(selector: string): Promise<boolean> {
    return await this.page.isVisible(selector)
  }

  async waitForText(text: string, options?: { timeout?: number }) {
    await this.page.waitForSelector(`text=${text}`, options)
  }

  async takeScreenshot(name: string) {
    const screenshot = await this.page.screenshot({
      path: `test-results/screenshots/${name}.png`,
      fullPage: true,
    })

    // Anexar screenshot ao relatório Cucumber
    this.attach(screenshot, 'image/png')
  }

  // Métodos específicos para autenticação
  async login(email: string, password: string) {
    await this.goto('/login')
    await this.fill('[data-testid="email-input"]', email)
    await this.fill('[data-testid="password-input"]', password)
    await this.click('[data-testid="login-button"]')
    await this.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
  }

  async logout() {
    await this.click('[data-testid="user-menu"]')
    await this.click('[data-testid="logout-button"]')
    await this.waitForSelector('[data-testid="login-form"]')
  }

  // Métodos para manipulação de dados de teste
  async createTestTenant(name: string, slug: string) {
    // Implementar criação de tenant via API ou interface
    // Para testes, pode usar dados mockados
  }

  async createTestUser(email: string, tenantId: string, role: string = 'owner') {
    // Implementar criação de usuário via API
  }

  async createTestClient(name: string, document: string, tenantId: string) {
    // Implementar criação de cliente via API ou interface
  }

  async cleanupTestData() {
    // Implementar limpeza de dados de teste
    // Importante para manter testes isolados
  }

  // Método para configurar dados de teste base
  async setupTestData() {
    // Implementar configuração de dados de teste base
    // Este método é chamado antes de cada cenário
    // Pode ser usado para criar dados necessários para os testes

    // Exemplo: criar tenant padrão, usuário de teste, etc.
    // await this.createTestTenant('Test Tenant', 'test-tenant')
    // await this.createTestUser('test@example.com', 'test-tenant-id', 'owner')
  }
}

setWorldConstructor(CustomWorld)
