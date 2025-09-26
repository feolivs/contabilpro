# language: pt
Funcionalidade: Conciliação Bancária
  Como um contador
  Eu quero conciliar extratos bancários com lançamentos
  Para garantir a precisão dos registros contábeis

  Contexto:
    Dado que estou logado como contador no sistema
    E existe uma conta bancária "Banco do Brasil - CC 12345-6"
    E existem lançamentos contábeis registrados
    E estou na página de conciliação bancária

  Cenário: Conciliação automática por valor e data exatos
    Dado que existe um lançamento "Pagamento fornecedor" de R$ 1.500,00 em 15/11/2024
    E existe uma transação bancária "TED ENVIADO" de R$ 1.500,00 em 15/11/2024
    Quando eu clico em "Conciliar Automaticamente"
    Então o sistema deve identificar a correspondência
    E deve sugerir a conciliação com score 100%
    E eu posso confirmar a conciliação
    E ambos os registros devem ficar marcados como "Conciliados"

  Cenário: Conciliação com tolerância de data
    Dado que existe um lançamento "Recebimento cliente" de R$ 2.000,00 em 10/11/2024
    E existe uma transação bancária "DOC RECEBIDO" de R$ 2.000,00 em 12/11/2024
    Quando eu executo a conciliação automática
    Então o sistema deve sugerir a conciliação com score 90%
    E deve mostrar "Diferença de 2 dias na data"
    E eu posso aceitar a sugestão
    E os registros devem ser conciliados

  Cenário: Conciliação manual de transações similares
    Dado que existem múltiplas transações similares:
      | Tipo        | Valor    | Data       | Descrição           |
      | Lançamento  | 800,00   | 05/11/2024 | Pagamento aluguel   |
      | Bancária    | 800,00   | 06/11/2024 | DEBITO AUTOMATICO   |
      | Bancária    | 800,00   | 07/11/2024 | TED ENVIADO         |
    Quando eu seleciono o lançamento "Pagamento aluguel"
    E eu clico em "Conciliar Manualmente"
    Então devo ver as transações bancárias candidatas
    E posso escolher "DEBITO AUTOMATICO" de 06/11/2024
    E confirmar a conciliação manual

  Cenário: Identificar transações não conciliadas
    Dado que existem transações bancárias sem correspondência:
      | Descrição              | Valor    | Data       |
      | TARIFA BANCARIA        | 15,00    | 01/11/2024 |
      | RENDIMENTO POUPANCA    | 45,30    | 30/11/2024 |
    Quando eu visualizo o relatório de conciliação
    Então devo ver as transações "Não Conciliadas"
    E devo poder criar lançamentos para elas
    E o sistema deve sugerir contas contábeis apropriadas

  Cenário: Conciliação com diferença de valor
    Dado que existe um lançamento de R$ 1.000,00
    E existe uma transação bancária de R$ 995,00
    Quando eu tento conciliar manualmente
    Então o sistema deve alertar sobre a diferença de R$ 5,00
    E deve sugerir criar um lançamento de ajuste
    E eu posso aceitar e criar o ajuste automaticamente

  Cenário: Importar extrato bancário OFX
    Dado que tenho um arquivo OFX do banco
    Quando eu clico em "Importar Extrato"
    E eu faço upload do arquivo "extrato-novembro.ofx"
    E eu clico em "Processar"
    Então o sistema deve importar todas as transações
    E deve evitar duplicatas por ID externo
    E deve mostrar o resumo da importação
    E deve iniciar a conciliação automática

  Cenário: Relatório de posição bancária
    Dado que tenho transações conciliadas e não conciliadas
    Quando eu gero o relatório de posição bancária
    Então devo ver:
      | Item                    | Valor      |
      | Saldo Contábil          | 25.000,00  |
      | Saldo Bancário          | 24.850,00  |
      | Diferença               | 150,00     |
      | Itens Não Conciliados   | 3          |
    E devo poder detalhar cada diferença
    E exportar o relatório em PDF/Excel

  Cenário: Conciliação com Open Finance
    Dado que tenho integração com Open Finance configurada
    E tenho consentimento ativo para a conta bancária
    Quando eu clico em "Sincronizar Transações"
    Então o sistema deve buscar novas transações via API
    E deve importar apenas transações não existentes
    E deve iniciar conciliação automática
    E deve respeitar os limites de requisições da API
