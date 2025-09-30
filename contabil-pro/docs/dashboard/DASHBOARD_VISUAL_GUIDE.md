# 📐 Guia Visual - Dashboard Compacta

## 🎨 Anatomia de um KPI Compacto

```
┌─────────────────────────────────────────────────────┐
│ [icon] Receita (30d)              [↑] +12,4%       │ ← 12px label + badge
│                                                     │
│ R$ 18,2k                                           │ ← 24-28px número
│ vs. 30d ant. • R$ 18,2k                            │ ← 11px micro-copy
│                                                     │
│ ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ │ ← sparkline (8% opacity)
└─────────────────────────────────────────────────────┘
  ↑                                                   ↑
  16px padding                                    80px altura total
```

## 📊 Comparação Visual: Antes vs. Depois

### ANTES (Cards Grandes)

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  Receita (30 dias)                                 │
│                                                     │
│  R$ 0                                              │
│                                                     │
│  [↑] +100%                                         │
│                                                     │
│  ─────────────────────────────────────────────────│
│                                                     │
│  Estável em relação ao período anterior            │
│  Soma das receitas registradas no período atual.   │
│                                                     │
└─────────────────────────────────────────────────────┘
  ↑
  ~200px de altura
  Muito espaço desperdiçado
  Informação esparsa
```

### DEPOIS (Cards Compactos)

```
┌─────────────────────────────────────────────────────┐
│ [↑] Receita (30d)                    [↑] +12,4%   │
│ R$ 18,2k                                           │
│ vs. 30d ant. • R$ 18,2k                            │
│ ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░ │
└─────────────────────────────────────────────────────┘
  ↑
  80px de altura
  Informação densa e útil
  Sparkline contextual
```

**Ganho:** 60% menos altura, 3x mais informação

## 🎯 Layout Responsivo

### Mobile (< 640px)

```
┌─────────────────────┐
│ Header              │
├─────────────────────┤
│ KPI 1               │
├─────────────────────┤
│ KPI 2               │
├─────────────────────┤
│ KPI 3               │
├─────────────────────┤
│ KPI 4               │
├─────────────────────┤
│                     │
│ Gráfico             │
│                     │
├─────────────────────┤
│ Obrigações          │
├─────────────────────┤
│ Tarefas             │
├─────────────────────┤
│ Alertas             │
├─────────────────────┤
│ Inbox               │
└─────────────────────┘
```

### Tablet (640px - 1024px)

```
┌─────────────────────────────────────┐
│ Header                              │
├──────────────────┬──────────────────┤
│ KPI 1            │ KPI 2            │
├──────────────────┼──────────────────┤
│ KPI 3            │ KPI 4            │
├──────────────────┴──────────────────┤
│                                     │
│ Gráfico                             │
│                                     │
├─────────────────────────────────────┤
│ Obrigações       │ Tarefas          │
├──────────────────┼──────────────────┤
│ Alertas          │ Inbox            │
└──────────────────┴──────────────────┘
```

### Desktop (> 1024px)

```
┌───────────────────────────────────────────────────────────┐
│ Header                                                    │
├─────────────┬─────────────┬─────────────┬────────────────┤
│ KPI 1       │ KPI 2       │ KPI 3       │ KPI 4          │
├─────────────┴─────────────┴─────────────┼────────────────┤
│                                         │ Obrigações     │
│ Gráfico Receita x Despesa               │                │
│                                         ├────────────────┤
├─────────────────────────────────────────┤ Tarefas        │
│                                         │                │
│ Fluxo de Caixa Projetado                ├────────────────┤
│                                         │ Alertas        │
├─────────────────────────────────────────┴────────────────┤
│ Inbox Contábil          │ Contas a Receber              │
└─────────────────────────┴───────────────────────────────┘
```

## 🎨 Paleta de Cores

### Estados dos KPIs

```css
/* Sucesso (Verde) */
.kpi-success {
  background: #f0fdf4;           /* bg-green-50 */
  color: #15803d;                /* text-green-700 */
  border: 1px solid #bbf7d0;     /* border-green-200 */
}

/* Perigo (Vermelho) */
.kpi-danger {
  background: #fef2f2;           /* bg-red-50 */
  color: #b91c1c;                /* text-red-700 */
  border: 1px solid #fecaca;     /* border-red-200 */
}

/* Atenção (Âmbar) */
.kpi-warning {
  background: #fffbeb;           /* bg-amber-50 */
  color: #b45309;                /* text-amber-700 */
  border: 1px solid #fde68a;     /* border-amber-200 */
}

/* Neutro */
.kpi-default {
  background: #ffffff;           /* bg-white */
  color: #1f2937;                /* text-gray-800 */
  border: 1px solid #e5e7eb;     /* border-gray-200 */
}
```

### Badges de Variação

```css
/* Positivo (Verde) */
.badge-positive {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
}

/* Negativo (Vermelho) */
.badge-negative {
  background: #fee2e2;
  color: #991b1b;
  border: 1px solid #fca5a5;
}
```

## 📏 Especificações de Tamanho

### KPI Card

```css
.kpi-card {
  height: 80px;                  /* Altura fixa */
  padding: 12px;                 /* p-3 */
  border-radius: 8px;            /* rounded-lg */
  gap: 8px;                      /* gap-2 */
}

.kpi-icon {
  width: 16px;
  height: 16px;
}

.kpi-title {
  font-size: 12px;               /* text-xs */
  font-weight: 500;              /* font-medium */
  line-height: 1.2;
}

.kpi-value {
  font-size: 24px;               /* text-2xl */
  font-weight: 600;              /* font-semibold */
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.025em;      /* tracking-tight */
}

.kpi-badge {
  height: 20px;                  /* h-5 */
  padding: 0 6px;                /* px-1.5 */
  font-size: 11px;               /* text-[11px] */
  font-weight: 600;              /* font-semibold */
}

.kpi-label {
  font-size: 11px;               /* text-[11px] */
  color: hsl(var(--muted-foreground) / 0.8);
}
```

### Painéis Laterais

```css
.side-panel {
  border-radius: 8px;
  padding: 12px;
  gap: 8px;
}

.side-panel-title {
  font-size: 14px;               /* text-sm */
  font-weight: 600;              /* font-semibold */
}

.side-panel-item {
  padding: 12px;
  border-radius: 6px;
  gap: 12px;
}
```

## 🎭 Estados Interativos

### Hover

```css
.kpi-card:hover {
  background: hsl(var(--accent) / 0.5);
  cursor: pointer;
  transition: all 150ms ease;
}
```

### Focus

```css
.kpi-card:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}
```

### Active

```css
.kpi-card:active {
  transform: scale(0.98);
}
```

## 📊 Sparkline

### Configuração

```typescript
const sparklineConfig = {
  width: '100%',
  height: 80,
  opacity: 0.08,              // Muito sutil
  strokeWidth: 1.5,
  type: 'monotone',
  dot: false,                 // Sem pontos
}
```

### Posicionamento

```css
.sparkline-container {
  position: absolute;
  inset: 0;
  opacity: 0.08;              /* Fundo sutil */
  pointer-events: none;       /* Não interfere com cliques */
  z-index: 0;
}

.kpi-content {
  position: relative;
  z-index: 10;                /* Acima do sparkline */
}
```

## 🎯 Hierarquia Visual

### Ordem de Importância

1. **Número (24-28px)** - Informação principal
2. **Badge de variação (11px)** - Contexto crítico
3. **Título (12px)** - Identificação
4. **Label (11px)** - Informação adicional
5. **Sparkline (8% opacity)** - Contexto visual sutil

### Contraste

```
Número:     100% opacidade (preto/branco)
Badge:      90% opacidade (cor semântica)
Título:     70% opacidade (muted-foreground)
Label:      60% opacidade (muted-foreground/80)
Sparkline:  8% opacidade (primary)
```

## 📱 Acessibilidade

### Contraste de Cores

Todos os textos seguem WCAG AA:
- Texto normal: mínimo 4.5:1
- Texto grande: mínimo 3:1
- Elementos interativos: mínimo 3:1

### Navegação por Teclado

```
Tab       → Próximo KPI
Shift+Tab → KPI anterior
Enter     → Ativar drill-down
Escape    → Fechar modal/dropdown
```

### Screen Readers

```html
<button aria-label="Receita dos últimos 30 dias: R$ 18.200. Aumento de 12,4% em relação ao período anterior">
  <!-- Conteúdo visual -->
</button>
```

## 🎬 Animações

### Entrada

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kpi-card {
  animation: fadeIn 300ms ease-out;
}
```

### Sparkline

```css
@keyframes drawLine {
  from {
    stroke-dashoffset: 1000;
  }
  to {
    stroke-dashoffset: 0;
  }
}

.sparkline-path {
  stroke-dasharray: 1000;
  animation: drawLine 1s ease-out;
}
```

---

**Referências:**
- Tailwind CSS: https://tailwindcss.com
- Recharts: https://recharts.org
- shadcn/ui: https://ui.shadcn.com

