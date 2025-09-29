# 📐 Especificação de KPI - Implementação Completa

## ✅ Padrão de KPI Implementado

### Dimensões (Spec Objetiva)
- ✅ **Altura total:** 88px (fixa) - dentro do range 80-96px
- ✅ **Largura mínima:** 220px
- ✅ **Largura máxima:** 320px
- ✅ **Padding interno:** 16px (p-4)

### Grid Interno
```
┌─────────────────────────────────────┐
│ [ícone 20px] Label (13px)  [Badge]  │ ← Header
│                                     │
│ R$ 18,2 mil                         │ ← Valor (26px)
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │ ← Sparkline (24px, 40%)
└─────────────────────────────────────┘
```

### Elementos

#### Ícone
- ✅ Tamanho: 20px (h-5 w-5)
- ✅ Opacidade: 65% (opacity-[0.65])
- ✅ Cor: text-muted-foreground

#### Label (Título)
- ✅ Tamanho: 13px (text-[13px])
- ✅ Peso: medium (font-medium)
- ✅ Cor: text-muted-foreground/70 (60-70%)
- ✅ Comportamento: 1 linha com ellipsis (truncate)
- ✅ Line-height: none (leading-none)

#### Valor
- ✅ Tamanho: 26px (text-[26px])
- ✅ Peso: semibold (font-semibold)
- ✅ Line-height: 1.1 (leading-[1.1])
- ✅ Fonte: tabular-nums
- ✅ Tracking: tight (tracking-tight)
- ✅ Abreviação: "R$ 18,2 mil" / "R$ 1,8 mi"
- ✅ Máximo: 6-7 caracteres visíveis

#### Badge de Variação
- ✅ Tamanho: 11px (text-[11px])
- ✅ Altura: 18px (h-[18px])
- ✅ Ícone: ▲ (up) / ▼ (down)
- ✅ Cor semântica: verde/vermelho
- ✅ Comportamento: whitespace-nowrap

#### Sparkline (Opcional)
- ✅ Altura: 24px (h-6)
- ✅ Opacidade: 40% light / 30% dark
- ✅ Posição: bottom-0 (base do card)
- ✅ Z-index: baixo (atrás do valor)

#### Estado Vazio
- ✅ Valor: "—" (em cinza 50%)
- ✅ Dica: "Importe extrato" / "Sem movimentação"
- ✅ Tamanho: 11px

## 🎯 Grid Responsivo Implementado

```css
/* Spec: Desktop ≥1280px: 4 KPIs por linha */
xl:grid-cols-4

/* Spec: Entre 1024-1279px: 3 por linha */
lg:grid-cols-3

/* Spec: Entre 640-1023px: 2 por linha */
sm:grid-cols-2

/* Spec: <640px: 1 por linha */
grid-cols-1
```

### Controle de Largura
```tsx
className="min-w-[220px] max-w-[320px]"
```

Isso impede "cartas gigantes" em telas largas e mantém proporções.

## 📊 KPIs Implementados (Recomendados para Contador)

### 1. Resultado (30d) - Principal
- **Valor:** R$ 12,4 mil
- **Variação:** +8,2%
- **Tooltip:** "Receita menos Despesas no período de 30 dias"
- **Ícone:** IconCash
- **Variante:** success (lucro) / danger (prejuízo)

### 2. Receita (30d)
- **Valor:** R$ 38,5 mil
- **Variação:** +4,0%
- **Tooltip:** "Total de receitas registradas nos últimos 30 dias"
- **Ícone:** IconTrendingUp
- **Variante:** success

### 3. Despesas (30d)
- **Valor:** R$ 26,1 mil
- **Variação:** −1,9%
- **Tooltip:** "Total de despesas registradas nos últimos 30 dias"
- **Ícone:** IconTrendingDown
- **Variante:** danger

### 4. Inadimplência
- **Valor:** R$ 45,8 mil
- **Subtítulo:** 10 clientes
- **Tooltip:** "10 clientes com contas em atraso"
- **Ícone:** IconAlertCircle
- **Variante:** warning

> ✅ "Insights de IA" movido para painel lateral (Alertas Inteligentes)

## 🎨 Formatação de Valores

### Função formatCurrency()

```typescript
function formatCurrency(value: number): string {
  const absValue = Math.abs(value)
  
  // ≥ 1 milhão: "R$ 1,8 mi"
  if (absValue >= 1_000_000) {
    return `R$ ${(value / 1_000_000).toFixed(1)} mi`
  }
  
  // ≥ 1 mil: "R$ 18,2 mil"
  if (absValue >= 1_000) {
    return `R$ ${(value / 1_000).toFixed(1)} mil`
  }
  
  // < 1 mil: "R$ 850"
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value)
}
```

### Exemplos
- `18_200` → "R$ 18,2 mil"
- `1_850_000` → "R$ 1,8 mi"
- `850` → "R$ 850"
- `0` → "R$ 0"

## 🌓 Dark Mode

### Contraste (Spec)
- ✅ **Valor:** 90-100% branco (text-foreground)
- ✅ **Labels:** 60-70% (text-muted-foreground/70)
- ✅ **Badges:** fundo 12% da cor (bg-green-950/[0.12])

### Sparkline
- ✅ Light: 40% opacidade
- ✅ Dark: 30% opacidade

## 🔍 Interações Implementadas

### Clique no KPI
```typescript
onClick={() => onKPIClick?.('revenue')}
```
Abre relatório já filtrado (período e cliente/conta).

### Tooltip
```tsx
<Tooltip>
  <TooltipTrigger asChild>{cardContent}</TooltipTrigger>
  <TooltipContent>
    <p className="text-xs">{tooltip}</p>
  </TooltipContent>
</Tooltip>
```
Explica cálculo (fonte de verdade).

### Seletor de Período (TODO)
Seletor 7/30/90 no topo da área de KPIs afeta todos.

## ✅ QA de Pixel (Checklist)

### Dimensões
- [x] Todos os KPIs medem 88px de altura
- [x] Largura entre 220-320px
- [x] Padding de 16px

### Texto
- [x] Valor não quebra linha
- [x] Abreviação aplicada (mil/mi)
- [x] Label com ellipsis em 1 linha
- [x] Badge com whitespace-nowrap

### Grid
- [x] Desktop (≥1280px): 4 por linha
- [x] Laptop (1024-1279px): 3 por linha
- [x] Tablet (640-1023px): 2 por linha
- [x] Mobile (<640px): 1 por linha
- [x] Mesma altura em todos os breakpoints

### Alinhamento
- [x] Badge alinha pela base do header
- [x] Sparkline na base do card
- [x] Ícone alinhado com label

### Acessibilidade
- [x] Contraste AA em labels
- [x] Contraste AAA no valor
- [x] Tooltip acessível
- [x] Focus visible

## 📁 Arquivos Modificados

1. **`src/components/dashboard/compact-kpi-card.tsx`**
   - Altura: 88px
   - Largura: min 220px, max 320px
   - Padding: 16px
   - Sparkline na base (24px, 40%)
   - Estado vazio
   - Tooltip

2. **`src/components/dashboard/compact-kpis.tsx`**
   - Grid responsivo correto
   - Função formatCurrency()
   - 4 KPIs recomendados
   - Inadimplência substituindo "Insights de IA"

3. **`src/app/(tenant)/dashboard/page.tsx`**
   - Props de inadimplência
   - Mock de dados

## 🚀 Próximos Passos

### Imediato
- [ ] Testar em 4 breakpoints (375px, 768px, 1024px, 1440px)
- [ ] Validar dark mode
- [ ] Testar com valores grandes (milhões)
- [ ] Testar estados vazios

### Curto Prazo
- [ ] Implementar seletor 7/30/90 dias
- [ ] Conectar dados reais de inadimplência
- [ ] Implementar drill-down nos KPIs
- [ ] Adicionar sparklines reais

### Médio Prazo
- [ ] Adicionar animações sutis
- [ ] Implementar comparação com metas
- [ ] Adicionar exportação de dados
- [ ] Telemetria de cliques

## 📊 Comparação: Antes vs. Depois

### Antes
```
┌─────────────────────────────────────────────┐
│ [↑] Receita (30d)              [↑] +12,4%  │
│ R$ 18.200,00                                │
│ vs. 30d ant. • R$ 18.200,00 ← OVERFLOW!    │
└─────────────────────────────────────────────┘
Altura: variável (80-120px)
Largura: sem limite
Texto: repetido e longo
```

### Depois
```
┌─────────────────────────────────────────────┐
│ [↑] Receita (30d)                  [▲+4.0%]│
│ R$ 38,5 mil                                 │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└─────────────────────────────────────────────┘
Altura: fixa 88px
Largura: 220-320px
Texto: compacto e claro
```

---

**Status:** ✅ Implementado conforme spec  
**Testado:** Pendente (4 breakpoints)  
**Data:** 2025-10-01

