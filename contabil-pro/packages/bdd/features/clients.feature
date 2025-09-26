# language: pt
Funcionalidade: Gestão de Clientes
  Como um contador
  Eu quero gerenciar clientes
  Para organizar os dados contábeis por cliente

  Contexto:
    Dado que estou logado como contador no sistema
    E estou na página de clientes

  Cenário: Criar novo cliente pessoa física
    Quando eu clico no botão "Novo Cliente"
    E eu preencho o nome "João Silva"
    E eu preencho o CPF "123.456.789-01"
    E eu preencho o email "joao@email.com"
    E eu preencho o telefone "(11) 99999-9999"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem "Cliente criado com sucesso"
    E o cliente "João Silva" deve aparecer na lista
    E o cliente deve ter o tipo "Pessoa Física"

  Cenário: Criar novo cliente pessoa jurídica
    Quando eu clico no botão "Novo Cliente"
    E eu preencho o nome "Empresa XYZ Ltda"
    E eu preencho o CNPJ "12.345.678/0001-90"
    E eu preencho o email "contato@empresaxyz.com"
    E eu preencho o telefone "(11) 88888-8888"
    E eu preencho o endereço "Rua das Empresas, 123"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem "Cliente criado com sucesso"
    E o cliente "Empresa XYZ Ltda" deve aparecer na lista
    E o cliente deve ter o tipo "Pessoa Jurídica"

  Cenário: Validação de CPF inválido
    Quando eu clico no botão "Novo Cliente"
    E eu preencho o nome "Cliente Teste"
    E eu preencho o CPF "123.456.789-00"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem de erro "CPF inválido"
    E o formulário não deve ser enviado

  Cenário: Validação de CNPJ inválido
    Quando eu clico no botão "Novo Cliente"
    E eu preencho o nome "Empresa Teste"
    E eu preencho o CNPJ "12.345.678/0001-00"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem de erro "CNPJ inválido"
    E o formulário não deve ser enviado

  Cenário: Editar cliente existente
    Dado que existe um cliente "Maria Santos" com CPF "987.654.321-09"
    Quando eu clico no botão "Editar" do cliente "Maria Santos"
    E eu altero o telefone para "(11) 77777-7777"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem "Cliente atualizado com sucesso"
    E o cliente deve ter o novo telefone "(11) 77777-7777"

  Cenário: Buscar cliente por nome
    Dado que existem os clientes:
      | Nome           | Documento       |
      | João Silva     | 123.456.789-01  |
      | Maria Santos   | 987.654.321-09  |
      | Pedro Oliveira | 456.789.123-45  |
    Quando eu digito "Maria" no campo de busca
    Então eu devo ver apenas o cliente "Maria Santos"
    E não devo ver "João Silva" nem "Pedro Oliveira"

  Cenário: Filtrar clientes por tipo
    Dado que existem os clientes:
      | Nome           | Documento          | Tipo            |
      | João Silva     | 123.456.789-01     | Pessoa Física   |
      | Empresa ABC    | 12.345.678/0001-90 | Pessoa Jurídica |
      | Maria Santos   | 987.654.321-09     | Pessoa Física   |
    Quando eu seleciono o filtro "Pessoa Física"
    Então eu devo ver "João Silva" e "Maria Santos"
    E não devo ver "Empresa ABC"

  Cenário: Inativar cliente
    Dado que existe um cliente ativo "Cliente Teste"
    Quando eu clico no menu de ações do cliente
    E eu clico em "Inativar"
    E eu confirmo a ação
    Então o cliente deve ficar com status "Inativo"
    E eu devo ver a mensagem "Cliente inativado com sucesso"

  Cenário: Não permitir duplicação de documento
    Dado que existe um cliente com CPF "123.456.789-01"
    Quando eu tento criar um novo cliente com o mesmo CPF "123.456.789-01"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem de erro "Já existe um cliente com este documento"
    E o cliente não deve ser criado
