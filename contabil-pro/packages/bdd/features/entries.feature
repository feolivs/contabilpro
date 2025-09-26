# language: pt
Funcionalidade: Lançamentos Contábeis
  Como um contador
  Eu quero registrar lançamentos contábeis
  Para manter o controle financeiro dos clientes

  Contexto:
    Dado que estou logado como contador no sistema
    E existe um cliente "Empresa ABC" 
    E existem as contas contábeis:
      | Código    | Nome                | Tipo     |
      | 1.1.01.01 | Caixa              | Ativo    |
      | 4.1.01.01 | Receitas de Vendas | Receita  |
      | 5.1.01.01 | Despesas com Vendas| Despesa  |
    E estou na página de lançamentos

  Cenário: Criar lançamento simples de receita
    Quando eu clico no botão "Novo Lançamento"
    E eu seleciono o cliente "Empresa ABC"
    E eu preencho a descrição "Venda de produtos"
    E eu preencho o valor "1000,00"
    E eu seleciono a data "01/12/2024"
    E eu adiciono o débito na conta "1.1.01.01 - Caixa" com valor "1000,00"
    E eu adiciono o crédito na conta "4.1.01.01 - Receitas de Vendas" com valor "1000,00"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem "Lançamento criado com sucesso"
    E o lançamento deve aparecer na lista
    E o total de débitos deve ser igual ao total de créditos

  Cenário: Validação de partidas dobradas
    Quando eu clico no botão "Novo Lançamento"
    E eu seleciono o cliente "Empresa ABC"
    E eu preencho a descrição "Lançamento teste"
    E eu adiciono o débito na conta "1.1.01.01 - Caixa" com valor "500,00"
    E eu adiciono o crédito na conta "4.1.01.01 - Receitas de Vendas" com valor "300,00"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem de erro "O total de débitos deve ser igual ao total de créditos"
    E o lançamento não deve ser salvo

  Cenário: Lançamento com múltiplas contas
    Quando eu clico no botão "Novo Lançamento"
    E eu seleciono o cliente "Empresa ABC"
    E eu preencho a descrição "Venda com desconto"
    E eu adiciono o débito na conta "1.1.01.01 - Caixa" com valor "900,00"
    E eu adiciono o débito na conta "5.1.01.01 - Despesas com Vendas" com valor "100,00"
    E eu adiciono o crédito na conta "4.1.01.01 - Receitas de Vendas" com valor "1000,00"
    E eu clico em "Salvar"
    Então eu devo ver a mensagem "Lançamento criado com sucesso"
    E o lançamento deve ter 3 partidas
    E o total deve estar balanceado

  Cenário: Buscar lançamentos por período
    Dado que existem os lançamentos:
      | Descrição    | Data       | Valor   |
      | Venda 1      | 01/11/2024 | 1000,00 |
      | Venda 2      | 15/11/2024 | 2000,00 |
      | Venda 3      | 01/12/2024 | 1500,00 |
    Quando eu filtro por período de "01/11/2024" até "30/11/2024"
    Então eu devo ver "Venda 1" e "Venda 2"
    E não devo ver "Venda 3"

  Cenário: Buscar lançamentos por cliente
    Dado que existem os lançamentos:
      | Descrição | Cliente     | Valor   |
      | Venda A   | Empresa ABC | 1000,00 |
      | Venda B   | Empresa XYZ | 2000,00 |
      | Venda C   | Empresa ABC | 1500,00 |
    Quando eu filtro pelo cliente "Empresa ABC"
    Então eu devo ver "Venda A" e "Venda C"
    E não devo ver "Venda B"

  Cenário: Classificação automática com IA
    Dado que o sistema de IA está configurado
    Quando eu clico no botão "Novo Lançamento"
    E eu preencho a descrição "Pagamento de salário funcionário João"
    E eu clico em "Classificar com IA"
    Então o sistema deve sugerir a conta "5.1.02.01 - Salários e Encargos"
    E deve mostrar a confiança da classificação
    E eu posso aceitar ou rejeitar a sugestão

  Cenário: Lançamento com documento anexo
    Quando eu clico no botão "Novo Lançamento"
    E eu seleciono o cliente "Empresa ABC"
    E eu preencho a descrição "Compra de material"
    E eu faço upload do documento "nota-fiscal.pdf"
    E eu adiciono as partidas contábeis
    E eu clico em "Salvar"
    Então o lançamento deve ser criado com o documento anexo
    E eu devo poder visualizar o documento na lista

  Cenário: Imutabilidade dos lançamentos
    Dado que existe um lançamento "Venda de produtos" já salvo
    Quando eu tento editar o lançamento
    Então eu não devo ver opções de edição
    E devo ver apenas a opção "Criar Lançamento de Ajuste"
    E o lançamento original deve permanecer inalterado

  Cenário: Lançamento de ajuste/estorno
    Dado que existe um lançamento "Venda incorreta" com valor "1000,00"
    Quando eu clico em "Criar Lançamento de Ajuste"
    E eu preencho a descrição "Estorno de venda incorreta"
    E o sistema sugere as partidas inversas automaticamente
    E eu clico em "Salvar"
    Então deve ser criado um novo lançamento de estorno
    E o lançamento original deve permanecer inalterado
    E o saldo das contas deve ser ajustado
