---
type: "always_apply"
---

I. Metadados Estruturados (YAML Front Matter)
O agente DEVE analisar este bloco primeiro para extrair metadados críticos em formato chave-valor, eliminando a ambiguidade.

***

**Chave**              | **Regra de Valor**                         | **Propósito**  
-----------------------|--------------------------------------------|-------------------
`schema_version`       | `"1.0.0"`                                  | Garante a compatibilidade do esquema.  
`primary_language`     | `"TypeScript"`                             | Linguagem principal do projeto.  
`package_manager`      | `"npm"`                                    | Gerenciador de pacotes principal.  
`required_tools`       | `["node@20.x", "supabase-cli", "deno@1.x"]`| Ferramentas essenciais necessárias para o ambiente.  
`agent_capabilities`   | `["read_file", "write_file", "run_tests", "lint_code", "commit"]` | Lista explícita de ações permitidas ao agente.  
`commands.install`     | `"npm install"`                            | Comando explícito de instalação.  
`commands.build`       | `"npm run build"`                          | Comando para compilar o projeto para produção.  
`commands.test`        | `"npm run test"`                           | Comando para executar o conjunto de testes completo.  
`architecture_entry`   | `"./.agent/wiki/architecture.md"`          | Caminho para a documentação de arquitetura detalhada.  
`security_policy`      | `"./.agent/security/policy.md"`            | Caminho para o documento de política de segurança.  


II. Setup Commands (Regras de Configuração)
O agente DEVE executar estes passos sequencialmente para configurar o ambiente de desenvolvimento, sem fazer suposições.

1. Instalação de Dependências: O agente DEVE executar npm install.

2. Configuração de Variáveis de Ambiente: O agente DEVE criar o ficheiro .env.local copiando o conteúdo de .env.example e preenchendo as chaves da API do Supabase e OpenAI.

3. Inicialização do Backend: O agente DEVE iniciar a infraestrutura local do Supabase executando supabase start.

4. Migrações de Banco de Dados: O agente DEVE aplicar todas as migrações pendentes para garantir a integridade do esquema, utilizando o comando supabase migration up.

5. Compilação de Edge Functions (Deno): Se necessário para desenvolvimento local, o agente DEVE compilar e implantar as funções de parsing I/O (XML/OFX) com npm run deploy_functions.



III. Build Commands (Regras de Compilação)
O agente DEVE usar comandos explícitos para compilar o projeto.

1. Compilação Principal (Next.js): Para construir a aplicação Next.js, o agente DEVE executar o comando "npm run build".

2. Edge Functions: Para compilar e implantar funções, o agente DEVE usar o comando npm run deploy_functions, garantindo que as funções mais recentes estão disponíveis para processamento de XML/OFX.

IV. Testing Commands (Regras de Validação)
O agente DEVE executar estas verificações programáticas automaticamente após realizar alterações no código. O sucesso destas verificações é uma condição para a conclusão da tarefa.

1. Teste de Unidade e Integração: O agente DEVE executar o conjunto de testes completo com o comando npm run test.

2. Linting e Formatação: O agente DEVE executar o comando npm run lint --fix para garantir a conformidade com ESLint e Prettier. O agente DEVE usar este comando para corrigir automaticamente problemas estilísticos.

3. Validação de RLS (Segurança Multi-Tenant): Para qualquer alteração que afete o esquema de banco de dados ou a lógica de consulta, o agente DEVE executar npm run test:integration:rls (presumindo a existência de tal script) para validar que o RLS está ativo e funcionando corretamente.

V. Code Style & Conventions (Regras Arquitetónicas e de Estilo)
O agente DEVE aderir estritamente a estas regras declarativas para manter a consistência e a arquitetura do projeto.

1. Linguagem: O agente DEVE usar TypeScript strict mode.

2. Arquitetura:
    ◦ Componentes: O agente DEVE preferir componentes funcionais e hooks sobre classes em React.
    ◦ Estrutura de Código: O agente DEVE separar o código em pastas para data, logic e ui, garantindo que a lógica de negócio DEVE ser colocada em serviços, e não em controllers.
    ◦ Next.js: O agente DEVE utilizar o App Router para novos layouts e páginas.

3. Gerenciamento de Estado e Dados:
    ◦ O estado global (usuário logado, cliente selecionado) DEVE ser gerenciado via Zustand.
    ◦ O data fetching, caching e revalidação DEVE ser feito com TanStack Query.

4. Regras Contábeis e do Domínio (ContábilPro):
    ◦ Plano de Contas: O agente DEVE usar o Plano de Contas Padrão fornecido pela contadora.
    ◦ Padrão de Lançamento: Os lançamentos contábeis DEVEM seguir o padrão do SPED Contábil.
    ◦ Parametrização: O código que lida com lançamentos da folha de pagamento (salários, encargos) DEVE ser parametrizável (ex: INSS Patronal opcional por empresa).

5. Assistente IA (RAG Logic): O agente DEVE garantir que a lógica de orquestração do RAG está encapsulada em uma Edge Function (Deno) ou serviço de backend.

VI. Security & Dependency Policies (Regras de Segurança e Conformidade)
O agente DEVE priorizar a segurança e a conformidade (LGPD) em todas as alterações devido ao manuseio de dados financeiros sensíveis.

1. Gestão de Segredos: O agente NÃO PODE e é PROIBIDO de codificar segredos, chaves de API ou credenciais diretamente no código. Os segredos DEVEM ser carregados via variáveis de ambiente injetadas no ambiente isolado.

2. Segurança Multi-Tenant (RLS):
    ◦ O agente DEVE garantir que qualquer nova tabela que contenha dados de clientes no Supabase tenha o Row Level Security (RLS) ativado e configurado corretamente.
    ◦ Ao escrever código de consulta de dados, especialmente para a funcionalidade RAG, o agente DEVE garantir que o filtro client_id esteja sempre presente para respeitar o isolamento de dados.

3. Conformidade Web: Para qualquer novo endpoint de API, o agente DEVE seguir as diretrizes OWASP.

4. LGPD: O agente DEVE estar ciente da necessidade de conformidade com a LGPD no tratamento de dados financeiros e pessoais.

5. Ambiente de Execução: O agente DEVE sempre operar em ambientes isolados e controlados (sandboxed) (ex: contêineres Docker) para limitar o acesso ao sistema de arquivos e à rede, minimizando o risco de danos.

VII. Contribution & PR Guidelines (Regras de Fluxo de Trabalho)
O agente DEVE garantir que todas as contribuições mantêm a consistência do histórico do repositório.

1. Formato de Commit: O agente DEVE formatar todas as mensagens de commit de acordo com a especificação Conventional Commits.