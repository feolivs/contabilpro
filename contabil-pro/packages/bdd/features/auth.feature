# language: pt
Funcionalidade: Autenticação e Autorização
  Como um usuário do ContabilPRO
  Eu quero fazer login no sistema
  Para acessar as funcionalidades contábeis

  Contexto:
    Dado que existe um tenant "Empresa Demo" com slug "empresa-demo"
    E existe um usuário "demo@contabilpro.com" associado ao tenant

  Cenário: Login com credenciais válidas
    Dado que estou na página de login
    Quando eu preencho o email "demo@contabilpro.com"
    E eu preencho a senha "senha123"
    E eu clico no botão "Entrar"
    Então eu devo ser redirecionado para o dashboard
    E eu devo ver a mensagem "Bem-vindo ao ContabilPRO"

  Cenário: Login com credenciais inválidas
    Dado que estou na página de login
    Quando eu preencho o email "usuario@inexistente.com"
    E eu preencho a senha "senhaerrada"
    E eu clico no botão "Entrar"
    Então eu devo ver a mensagem de erro "Credenciais inválidas"
    E eu devo permanecer na página de login

  Cenário: Acesso negado sem autenticação
    Dado que não estou autenticado
    Quando eu tento acessar a página "/dashboard"
    Então eu devo ser redirecionado para a página de login
    E eu devo ver a mensagem "Faça login para continuar"

  Cenário: Isolamento de dados por tenant
    Dado que estou logado como "user1@tenant1.com" do tenant "Tenant 1"
    E existe um cliente "Cliente A" no tenant "Tenant 1"
    E existe um cliente "Cliente B" no tenant "Tenant 2"
    Quando eu acesso a página de clientes
    Então eu devo ver apenas "Cliente A"
    E eu não devo ver "Cliente B"

  Cenário: Logout do sistema
    Dado que estou logado no sistema
    Quando eu clico no menu do usuário
    E eu clico em "Sair"
    Então eu devo ser redirecionado para a página de login
    E minha sessão deve ser encerrada
