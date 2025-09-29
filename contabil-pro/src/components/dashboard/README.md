# Dashboard Compacta - ContabilPRO

## 📊 Visão Geral

Dashboard redesenhada com foco em **densidade de informação**, **ação rápida** e **inteligência contextual**. Segue as melhores práticas de UX para sistemas contábeis profissionais.

## 🎯 Estrutura da Página

### 1. **Faixa Superior: KPIs Compactos** (altura: 80px)

Quatro cards horizontais com informação densa e acionável:

- **Receita (30d)**: Valor atual + variação percentual + sparkline
- **Despesas (30d)**: Valor atual + variação percentual + sparkline
- **Resultado (30d)**: Receita - Despesa com badge verde/vermelho
- **Clientes Ativos**: Contagem + variação

**Características:**
- Altura fixa: 80px
- Ícone sutil: 16px
- Número grande: 24-28px (font-semibold, tabular-nums)
- Label: 12px (font-medium)
- Badge de variação: 11px com ícone de tendência
- Sparkline de fundo em opacidade baixa (8%)
- Clicável para drill-down

### 2. **Grid Principal** (8 colunas + 4 colunas)

#### Coluna Esquerda (8 cols):
- **Gráfico Receita x Despesa**: Área/linha com seletor 7/30/90 dias
- **Fluxo de Caixa Projetado** (TODO): 60 dias com alertas de risco

#### Coluna Direita (4 cols):
- **Obrigações Fiscais**: DAS, DCTFWeb, DEFIS (próximos 30d)
- **Tarefas Prioritárias**: 3-5 itens com deadlines
- **Alertas Inteligentes**: Anomalias, sugestões, riscos

### 3. **Rodapé** (2 colunas)

- **Inbox Contábil**: NF-e, NFS-e, documentos a processar
- **Contas a Receber**: Atrasos por faixa (0-30d, 31-60d, 60+d)

## 🎨 Design System

### Cores Semânticas

```typescript
// Sucesso (verde)
bg-green-50 text-green-700 border-green-200
dark:bg-green-950/30 dark:text-green-400

// Perigo (vermelho)
bg-red-50 text-red-700 border-red-200
dark:bg-red-950/30 dark:text-red-400

// Atenção (âmbar)
bg-amber-50 text-amber-700 border-amber-200
dark:bg-amber-950/30 dark:text-amber-400

// Informação (azul)
bg-blue-50 text-blue-700 border-blue-200
dark:bg-blue-950/30 dark:text-blue-400
```

### Tipografia

```css
/* Números grandes (KPIs) */
text-2xl font-semibold tabular-nums tracking-tight

/* Labels */
text-xs font-medium text-muted-foreground

/* Badges */
text-[10px] ou text-[11px] font-semibold

/* Micro-copy */
text-xs text-muted-foreground/80
```

### Espaçamentos

```css
/* Cards compactos */
p-3 gap-2

/* Altura dos KPIs */
h-20 (80px)

/* Badges */
h-5 px-1.5 (20px altura)

/* Ícones */
h-4 w-4 (16px) ou h-5 w-5 (20px)
```

## 🧩 Componentes

### `CompactKPICard`

Card de KPI compacto com sparkline de fundo.

**Props:**
- `title`: string - Título do KPI
- `value`: string - Valor formatado
- `change`: number - Variação percentual
- `changeLabel`: string - Label da variação
- `trend`: 'up' | 'down' - Direção da tendência
- `sparklineData`: Array<{value: number}> - Dados do sparkline
- `icon`: ReactNode - Ícone opcional
- `onClick`: () => void - Handler de clique
- `variant`: 'default' | 'success' | 'danger' | 'warning'

### `TaxObligationsPanel`

Painel de obrigações fiscais com status.

**Props:**
- `obligations`: Array<TaxObligation>

### `PriorityTasksPanel`

Lista de tarefas prioritárias com checkboxes.

**Props:**
- `tasks`: Array<PriorityTask>
- `onToggleTask`: (taskId: string) => void

### `SmartAlertsPanel`

Alertas inteligentes com ações.

**Props:**
- `alerts`: Array<SmartAlert>
- `onDismiss`: (alertId: string) => void

### `AccountingInbox`

Inbox de documentos + contas a receber.

**Props:**
- `items`: Array<InboxItem>
- `overdueReceivables`: OverdueReceivables

## 📈 KPIs Implementados

### 1. Receita (30d)
- Soma de lançamentos de receita dos últimos 30 dias
- Comparação com período anterior
- Sparkline dos últimos 7/30/90 dias

### 2. Despesas (30d)
- Soma de lançamentos de despesa dos últimos 30 dias
- Comparação com período anterior
- Sparkline dos últimos 7/30/90 dias

### 3. Resultado (30d)
- Receita - Despesa
- Badge verde (positivo) ou vermelho (negativo)
- Comparação com período anterior

### 4. Clientes Ativos
- Contagem de clientes com movimentação no período
- Variação vs. período anterior

## 🚀 Próximos Passos (Roadmap)

### Sprint 1 (UI/UX) ✅
- [x] KPIs compactos com sparkline
- [x] Reorganização do grid
- [x] Painéis laterais (obrigações, tarefas, alertas)
- [x] Inbox contábil + contas a receber

### Sprint 2 (Dados)
- [ ] Conectar KPIs às funções SQL reais
- [ ] Implementar cálculo de clientes ativos
- [ ] Adicionar sparklines com dados reais
- [ ] Implementar drill-down nos KPIs
- [ ] Fluxo de caixa projetado

### Sprint 3 (IA/Automação)
- [ ] Regras de anomalia (despesas atípicas)
- [ ] Sugestões de conciliação automática
- [ ] Alertas de documentos faltantes
- [ ] Alertas de risco fiscal
- [ ] Benchmarks e metas

## 🎯 Métricas de Sucesso

- **Densidade**: 4 KPIs + 3 painéis + 2 gráficos em uma tela
- **Altura dos KPIs**: 80px (vs. 200px+ anterior)
- **Tempo até ação**: < 2 cliques para qualquer tarefa prioritária
- **Informação útil**: 100% dos elementos são acionáveis ou informativos

## 📝 Notas de Implementação

### Estados Vazios

Todos os componentes têm estados vazios com:
- Ícone ilustrativo
- Mensagem clara
- Sugestão de próxima ação (quando aplicável)

### Acessibilidade

- Todos os botões têm `aria-label`
- Checkboxes associados com `label`
- Focus visible em todos os elementos interativos
- Cores com contraste adequado (WCAG AA)

### Performance

- Sparklines renderizados com Recharts (otimizado)
- Dados mockados para desenvolvimento
- Lazy loading dos painéis laterais (futuro)

### Responsividade

- Mobile: 1 coluna, KPIs empilhados
- Tablet: 2 colunas, KPIs em grid 2x2
- Desktop: 4 colunas, layout completo

