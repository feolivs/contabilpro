import { Given, Then, When } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

import type { CustomWorld } from '../support/world'

// Steps para autenticação
Given(
  'que existe um tenant {string} com slug {string}',
  async function (this: CustomWorld, tenantName: string, slug: string) {
    // Implementar criação de tenant de teste
    await this.createTestTenant(tenantName, slug)
  }
)

Given(
  'existe um usuário {string} associado ao tenant',
  async function (this: CustomWorld, email: string) {
    // Implementar criação de usuário de teste
    await this.createTestUser(email, 'test-tenant-id')
  }
)

Given('que estou na página de login', async function (this: CustomWorld) {
  await this.goto('/login')
  await this.waitForSelector('[data-testid="login-form"]')
})

Given('que não estou autenticado', async function (this: CustomWorld) {
  // Garantir que não há sessão ativa
  await this.page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
})

Given('que estou logado no sistema', async function (this: CustomWorld) {
  await this.login('demo@contabilpro.com', 'senha123')
})

Given(
  'que estou logado como {string} do tenant {string}',
  async function (this: CustomWorld, email: string, tenantName: string) {
    await this.login(email, 'senha123')
  }
)

When('eu preencho o email {string}', async function (this: CustomWorld, email: string) {
  await this.fill('[data-testid="email-input"]', email)
})

When('eu preencho a senha {string}', async function (this: CustomWorld, password: string) {
  await this.fill('[data-testid="password-input"]', password)
})

When('eu clico no botão {string}', async function (this: CustomWorld, buttonText: string) {
  const buttonSelector = `button:has-text("${buttonText}"), [data-testid*="${buttonText.toLowerCase()}"]`
  await this.click(buttonSelector)
})

When('eu tento acessar a página {string}', async function (this: CustomWorld, path: string) {
  await this.goto(path)
})

When('eu clico no menu do usuário', async function (this: CustomWorld) {
  await this.click('[data-testid="user-menu"]')
})

When('eu clico em {string}', async function (this: CustomWorld, text: string) {
  await this.click(`text=${text}`)
})

Then('eu devo ser redirecionado para o dashboard', async function (this: CustomWorld) {
  await this.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 })
  expect(this.page.url()).toContain('/dashboard')
})

Then('eu devo ver a mensagem {string}', async function (this: CustomWorld, message: string) {
  await this.waitForText(message)
  const isVisible = await this.isVisible(`text=${message}`)
  expect(isVisible).toBe(true)
})

Then(
  'eu devo ver a mensagem de erro {string}',
  async function (this: CustomWorld, errorMessage: string) {
    await this.waitForSelector('[data-testid="error-message"], .error, .alert-error')
    const errorText = await this.getText('[data-testid="error-message"], .error, .alert-error')
    expect(errorText).toContain(errorMessage)
  }
)

Then('eu devo ser redirecionado para a página de login', async function (this: CustomWorld) {
  await this.waitForSelector('[data-testid="login-form"]', { timeout: 10000 })
  expect(this.page.url()).toContain('/login')
})

Then('eu devo permanecer na página de login', async function (this: CustomWorld) {
  const isLoginFormVisible = await this.isVisible('[data-testid="login-form"]')
  expect(isLoginFormVisible).toBe(true)
  expect(this.page.url()).toContain('/login')
})

Then('minha sessão deve ser encerrada', async function (this: CustomWorld) {
  // Verificar se tokens foram removidos
  const hasSession = await this.page.evaluate(() => {
    return localStorage.getItem('supabase.auth.token') !== null
  })
  expect(hasSession).toBe(false)
})

// Steps para isolamento de dados por tenant
Given(
  'existe um cliente {string} no tenant {string}',
  async function (this: CustomWorld, clientName: string, tenantName: string) {
    // Implementar criação de cliente específico do tenant
    await this.createTestClient(clientName, '12345678901', 'tenant-1-id')
  }
)

When('eu acesso a página de clientes', async function (this: CustomWorld) {
  await this.goto('/clientes')
  await this.waitForSelector('[data-testid="clients-list"]')
})

Then('eu devo ver apenas {string}', async function (this: CustomWorld, clientName: string) {
  const clientExists = await this.isVisible(`text=${clientName}`)
  expect(clientExists).toBe(true)
})

Then('eu não devo ver {string}', async function (this: CustomWorld, clientName: string) {
  const clientExists = await this.isVisible(`text=${clientName}`)
  expect(clientExists).toBe(false)
})
