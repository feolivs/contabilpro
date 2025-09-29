Perfeito, sem código. Aqui vai um **plano desenhado** e **estruturado** para você executar do zero ao teste com contadora — direto, priorizado e medível.

# Visão geral (fases e objetivos)

* **Fase 1 — Fundação Operacional**: app saudável, modais padronizados, conexão Supabase estável.
* **Fase 2 — Núcleo de Valor**: fluxos essenciais funcionando ponta-a-ponta (cliente → lançamento → dashboard mínimo).
* **Fase 3 — Infra de IA e Edge**: chaves, políticas, funções de borda e trilhas de auditoria.
* **Fase 4 — UX de Teste**: onboarding, dados demo, estados de loading/erro, roteiro de teste com contadora.

---

# Fase 1 — Fundação Operacional

**Objetivo:** garantir que o sistema respira e você enxerga problemas rápido.

**1. Saúde & Observabilidade**

* Página/endpoint de saúde (sem expor segredos).
* Log estruturado por requisição (request-id, latência, status).
* Painel simples de erros (contador de falhas recentes) e lista de incidentes com timestamp.
* Métricas mínimas: tempo de carregamento das páginas críticas, taxa de erro em ações.

**2. Design System de Modais (um só padrão)**

* **Tipos**: Confirmar ação; Formulário; Informação; Sucesso/Erro.
* **Regras**: foco inicial previsível; “ESC cancela”; acessibilidade (título, descrição, rótulos claros); rodapé com ações primária/secundária; bloqueio de ações duplicadas enquanto “carregando”.
* **Microcópias**: textos curtos, com verbos fortes (“Salvar”, “Excluir definitivamente”, “Cancelar”).
* **Inventário inicial de modais**

  * Clientes: criar/editar; excluir; importar planilha (futuro).
  * Lançamentos: novo; editar; conciliar; excluir.
  * Contas bancárias: conectar; editar; excluir.
  * Documentos: enviar; classificar; excluir.
  * Tarefas/Propostas: criar; marcar como concluída; excluir.

**3. Conexão Supabase (estável e previsível)**

* Ambientes: local e produção (variáveis separadas).
* Teste de conectividade explícito (você sabe quando caiu).
* Checklist de segurança: RLS ativo; políticas mínimas por tabela; segredo do serviço fora do cliente; revisão de permissões de Storage.

**Critério de aceite da Fase 1**

* Você consegue responder: “o app está ok?” em 10 segundos.
* Todo modal do inventário abre/fecha e segue o padrão de UX.
* Conexão com Supabase confirmada em ambos ambientes sem “gambiarras”.

---

# Fase 2 — Núcleo de Valor (MVP funcional)

**Objetivo:** fluxo contábil básico fechando, ainda que simples.

**1. Fluxo Ponta-a-Ponta**

* Clientes: listar, criar, editar, excluir.
* Lançamentos: criar (receita/despesa), validar equilíbrio (débito = crédito), listar, editar, excluir.
* Dashboard mínimo: 3 cartões — **Receita (30d)**, **Despesa (30d)**, **Novos clientes (30d)** — com números corretos.

**2. Estados de Sistema (UX)**

* Loading: esqueletos ou placeholders em listas e cartões.
* Empty states: mensagens amigáveis + chamada para ação (“Cadastre seu primeiro cliente”).
* Erros: texto que explica o que fazer (“tente novamente”, “verifique conexão”); toasts discretas.

**3. Garantias de Integridade**

* Regras de negócios essenciais:

  * Lançamento sem cliente? permitido ou não?
  * Datas no futuro? permitido ou não?
  * Contas/planos válidos?
* Auditoria mínima: registro de quem/quando criou/alterou.

**Critério de aceite da Fase 2**

* Você cadastra 1 cliente, registra 1 lançamento e o **dashboard reflete** o número certo.
* Nenhuma tela fica “branca”: sempre há loading/empty/erro.
* Você consegue apagar e recriar dados sem quebrar consistência.

---

# Fase 3 — IA + Edge Functions (base segura)

**Objetivo:** preparar o terreno para automações e inteligência.

**1. Chave da OpenAI & Política**

* Armazenamento seguro da chave, **nunca no cliente**.
* Definição do **limite de custo** por operação e por dia (para evitar surpresas).
* Registro básico de chamadas: finalidade, insumo (hash ou referência), duração, resultado (ok/erro).

**2. Edge Functions (casos iniciais)**

* Gatilhos típicos:

  * Pós-upload de documento: extrair metadados e classificar.
  * Sugestão de categorização do lançamento (IA opcional).
* Contratos de entrada/saída explícitos (ids, status, mensagens).

**3. Trilha de Auditoria & Privacidade**

* Registro de ações críticas: criar/editar/excluir (quem, quando, qual entidade).
* Retenção e acesso aos logs: você consegue investigar um bug ou contestação de usuário.
* Política de dados: o que pode ou não sair para serviços de terceiros.

**Critério de aceite da Fase 3**

* IA pode ser desligada por **feature flag** sem quebrar fluxo.
* Pelo menos 1 função de borda útil funcionando fim-a-fim.
* Você enxerga custos potenciais e tem mecanismo para limitar.

---

# Fase 4 — UX de Teste com Contadora

**Objetivo:** que uma pessoa externa consiga usar sozinha e entender valor.

**1. Onboarding**

* Primeira execução: assistente de 3 passos (perfil do escritório, primeiro cliente, primeiro lançamento).
* Dados demo opcionais (um clique para popular ambiente de testes).
* Dicas contextuais (tooltips ou micro-tour nas telas críticas).

**2. Materiais de Apoio**

* Guia rápido de 1 página (PDF/Notion): como cadastrar cliente, lançar receita/despesa, ver dashboard.
* Perguntas frequentes mínimas: “não vejo meus dados”, “como excluir um lançamento”, “onde estão meus relatórios”.

**3. Roteiro de Teste (30–40 min)**

* Tarefas: criar cliente; registrar uma despesa e uma receita; conferir dashboard; excluir um lançamento; exportar um relatório simples (mesmo que CSV básico).
* Métricas: tempo por tarefa; pontos de confusão; erros encontrados; sugestões espontâneas.

**Critério de aceite da Fase 4**

* A contadora completa o roteiro **sem sua ajuda**.
* Você coleta feedback objetivo e consegue priorizar ajustes.

---

# Linha do tempo sugerida (agressiva, mas realista)

* **Semana 1**: Fase 1 completa + metade da Fase 2 (clientes e lançamentos).
* **Semana 2**: Fase 2 completa + Fase 3 básica (1 edge function + chave de IA configurada).
* **Semana 3**: Fase 4 (onboarding, dados demo, roteiro de teste) + correções.

---

# Critérios globais de “Definição de Pronto” (DoD)

* Ação crítica tem: loading, erro claro, confirmação quando necessário.
* Nenhuma tela sem empty state.
* Logs permitem reconstruir “o que aconteceu” para uma entidade.
* Feature flags para: IA ligada/desligada; dados demo ligados/desligados.
* Acesso total para usuário único (seu caso atual), mas **sem** comprometer RLS.

---

# Riscos e mitigação

* **Dívida visual** (cores/contrastes): use tokens globais; evite classes de cor “hardcoded”.
* **Custo de IA**: plafonamento diário e logs por chamada desde o início.
* **Edge instável**: sempre retorno com status e mensagem; retentativa idempotente onde fizer sentido.
* **Onboarding pesado**: assistir em 3 passos e dados demo opcionais; não travar a navegação.

---

# Próximas 5 ações (sem tocar em código aqui)

1. Listar todas as telas que terão modais e mapear quais tipos cada uma usa.
2. Escrever microcópias dos modais mais críticos (confirmar exclusão; salvar formulário).
3. Desenhar o fluxo ponta-a-ponta “cliente → lançamento → dashboard” em 6 caixas (quais entradas/saídas cada etapa espera).
4. Definir o contrato de uma edge function **prioritária** (evento de upload → status de processamento → resultado).
5. Rascunhar o roteiro de teste para a contadora, com tarefas e critérios de sucesso/fracasso.

Quando finalizar esses 5 itens, trago a revisão fina e te ajudo a ordenar riscos antes de entrar na implementação.
