# language: pt
Funcionalidade: Importação de NFe
  Como um contador
  Eu quero importar notas fiscais eletrônicas
  Para automatizar o registro de lançamentos contábeis

  Contexto:
    Dado que estou logado como contador no sistema
    E existe um cliente "Fornecedor ABC" com CNPJ "12.345.678/0001-90"
    E estou na página de documentos

  Cenário: Importar NFe válida com assinatura digital
    Dado que tenho um arquivo XML de NFe válido "nfe-valida.xml"
    E o XML possui assinatura digital válida
    Quando eu clico em "Importar NFe"
    E eu faço upload do arquivo "nfe-valida.xml"
    E eu clico em "Processar"
    Então o sistema deve validar a assinatura digital
    E deve extrair os dados da NFe:
      | Campo           | Valor                    |
      | Número          | 000000123                |
      | Série           | 1                        |
      | Fornecedor      | Fornecedor ABC           |
      | CNPJ            | 12.345.678/0001-90       |
      | Valor Total     | 1.500,00                 |
      | Data Emissão    | 15/11/2024               |
    E deve criar automaticamente o lançamento contábil
    E deve anexar o XML e DANFE ao lançamento

  Cenário: Rejeitar NFe com assinatura inválida
    Dado que tenho um arquivo XML "nfe-assinatura-invalida.xml"
    E o XML possui assinatura digital inválida
    Quando eu faço upload do arquivo
    E eu clico em "Processar"
    Então o sistema deve rejeitar o arquivo
    E deve mostrar a mensagem "Assinatura digital inválida"
    E não deve criar nenhum lançamento

  Cenário: Rejeitar XML com schema inválido
    Dado que tenho um arquivo XML "nfe-schema-invalido.xml"
    E o XML não segue o schema oficial da NFe
    Quando eu faço upload do arquivo
    E eu clico em "Processar"
    Então o sistema deve rejeitar o arquivo
    E deve mostrar a mensagem "Estrutura XML inválida"
    E deve listar os erros de validação encontrados

  Cenário: Importar NFe com múltiplos itens e impostos
    Dado que tenho um arquivo XML "nfe-multiplos-itens.xml" com:
      | Item        | Valor   | CFOP | CST  | ICMS   | IPI    |
      | Produto A   | 800,00  | 5102 | 000  | 144,00 | 40,00  |
      | Produto B   | 700,00  | 5102 | 000  | 126,00 | 35,00  |
    Quando eu importo o arquivo
    Então o sistema deve criar lançamentos para:
      | Conta                    | Débito  | Crédito |
      | Estoque                  | 1500,00 |         |
      | ICMS a Recuperar         | 270,00  |         |
      | IPI a Recuperar          | 75,00   |         |
      | Fornecedores a Pagar     |         | 1845,00 |
    E deve registrar os detalhes de cada item
    E deve calcular corretamente os impostos

  Cenário: Detectar NFe duplicada
    Dado que já foi importada uma NFe com chave "35241112345678000190550010000001231234567890"
    Quando eu tento importar novamente a mesma NFe
    Então o sistema deve detectar a duplicação
    E deve mostrar a mensagem "Esta NFe já foi importada anteriormente"
    E deve exibir os dados do lançamento existente
    E não deve criar um novo lançamento

  Cenário: Importar NFe de fornecedor não cadastrado
    Dado que tenho uma NFe de fornecedor "Novo Fornecedor Ltda" não cadastrado
    Quando eu importo a NFe
    Então o sistema deve sugerir criar o fornecedor automaticamente
    E deve pré-preencher os dados do fornecedor:
      | Campo           | Valor                    |
      | Nome            | Novo Fornecedor Ltda     |
      | CNPJ            | 98.765.432/0001-10       |
      | Endereço        | Rua das Indústrias, 456  |
    E eu posso confirmar ou editar os dados
    E após confirmar, deve criar o fornecedor e o lançamento

  Cenário: Classificação automática por CFOP
    Dado que tenho uma NFe com CFOP "1102" (Compra para comercialização)
    Quando eu importo a NFe
    Então o sistema deve classificar automaticamente:
      | CFOP | Conta Sugerida           | Tipo      |
      | 1102 | Estoque de Mercadorias   | Débito    |
      | 1102 | Fornecedores a Pagar     | Crédito   |
    E deve aplicar as regras fiscais correspondentes
    E deve calcular os impostos conforme a legislação

  Cenário: Gerar relatório de importação
    Dado que importei 5 NFes no período
    E 4 foram processadas com sucesso
    E 1 foi rejeitada por assinatura inválida
    Quando eu acesso o relatório de importações
    Então devo ver o resumo:
      | Status      | Quantidade | Valor Total |
      | Sucesso     | 4          | 12.500,00   |
      | Rejeitadas  | 1          | -           |
      | Total       | 5          | 12.500,00   |
    E devo poder exportar o relatório em PDF/Excel

  Cenário: Importação em lote
    Dado que tenho uma pasta com 10 arquivos XML de NFe
    Quando eu seleciono "Importação em Lote"
    E eu faço upload da pasta
    E eu clico em "Processar Todos"
    Então o sistema deve processar cada arquivo sequencialmente
    E deve mostrar o progresso da importação
    E deve gerar um relatório consolidado
    E deve notificar sobre arquivos com erro
