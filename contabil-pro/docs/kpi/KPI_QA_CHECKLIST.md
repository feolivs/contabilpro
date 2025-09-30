# ✅ Checklist de QA - KPIs da Dashboard

## 🎯 Como Testar

1. **Abra a dashboard:**
   ```
   http://localhost:3001/dashboard
   ```

2. **Abra o DevTools:**
   - Pressione `F12`
   - Vá para a aba "Elements" ou "Inspect"

3. **Teste cada breakpoint:**
   - Use o modo responsivo (Ctrl+Shift+M)
   - Teste as resoluções listadas abaixo

---

## 📱 Teste 1: Mobile (375px)

### Configuração
- Largura: 375px
- Dispositivo: iPhone SE / Galaxy S8

### Checklist
- [ ] **1 KPI por linha** (grid-cols-1)
- [ ] Altura de cada KPI: **88px**
- [ ] Largura: ocupa 100% menos padding
- [ ] Nenhum overflow horizontal
- [ ] Texto do valor não quebra linha
- [ ] Badge visível e legível
- [ ] Sparkline renderiza corretamente
- [ ] Gap de 12px entre KPIs

### Como Verificar
```
1. Abrir DevTools
2. Ctrl+Shift+M (modo responsivo)
3. Selecionar "iPhone SE" ou digitar 375px
4. Verificar cada item acima
```

---

## 📱 Teste 2: Tablet (768px)

### Configuração
- Largura: 768px
- Dispositivo: iPad Mini

### Checklist
- [ ] **2 KPIs por linha** (sm:grid-cols-2)
- [ ] Altura de cada KPI: **88px**
- [ ] Largura de cada KPI: ~360px (50% - gap)
- [ ] Alinhamento correto (2x2 grid)
- [ ] Espaçamento uniforme
- [ ] Todos os textos legíveis
- [ ] Gap de 12px entre KPIs

### Como Verificar
```
1. DevTools → Modo responsivo
2. Selecionar "iPad Mini" ou digitar 768px
3. Contar KPIs por linha (deve ser 2)
4. Medir altura com régua do DevTools
```

---

## 💻 Teste 3: Laptop (1024px)

### Configuração
- Largura: 1024px
- Dispositivo: Laptop padrão

### Checklist
- [ ] **3 KPIs por linha** (lg:grid-cols-3)
- [ ] Altura de cada KPI: **88px**
- [ ] Largura de cada KPI: ~320px (33% - gap)
- [ ] Não ultrapassa max-width de 320px
- [ ] Quarto KPI na segunda linha
- [ ] Alinhamento à esquerda
- [ ] Gap de 12px entre KPIs

### Como Verificar
```
1. DevTools → Modo responsivo
2. Digitar 1024px de largura
3. Contar KPIs por linha (deve ser 3)
4. Verificar que o 4º KPI está sozinho na 2ª linha
```

---

## 🖥️ Teste 4: Desktop (1440px)

### Configuração
- Largura: 1440px
- Dispositivo: Desktop Full HD

### Checklist
- [ ] **4 KPIs por linha** (xl:grid-cols-4)
- [ ] Altura de cada KPI: **88px**
- [ ] Largura de cada KPI: ~320px (25% - gap)
- [ ] Não ultrapassa max-width de 320px
- [ ] Não "estica" para preencher espaço
- [ ] Todos na mesma linha
- [ ] Gap de 12px entre KPIs
- [ ] Alinhamento à esquerda

### Como Verificar
```
1. DevTools → Modo responsivo
2. Digitar 1440px de largura
3. Contar KPIs por linha (deve ser 4)
4. Medir largura de cada KPI (deve ser ≤320px)
```

---

## 🎨 Teste 5: Tipografia e Cores

### Light Mode
- [ ] **Label:** 13px, medium, cinza 70%
- [ ] **Valor:** 26px, semibold, preto 100%
- [ ] **Badge:** 11px, semibold, cor semântica
- [ ] Contraste AA em todos os textos

### Dark Mode
- [ ] **Label:** 13px, medium, cinza 70%
- [ ] **Valor:** 26px, semibold, branco 90-100%
- [ ] **Badge:** fundo 12% da cor
- [ ] Contraste AAA no valor
- [ ] Sparkline 30% opacidade

### Como Verificar
```
1. Inspecionar elemento do KPI
2. Verificar computed styles:
   - font-size
   - font-weight
   - color
   - opacity
3. Alternar tema (botão no header)
4. Repetir verificação
```

---

## 📏 Teste 6: Dimensões Exatas

### Medições com DevTools
- [ ] Altura do card: **88px**
- [ ] Padding interno: **16px** (todos os lados)
- [ ] Ícone: **20px × 20px**
- [ ] Badge: altura **18px**
- [ ] Sparkline: altura **24px**
- [ ] Gap entre KPIs: **12px**

### Como Medir
```
1. Inspecionar elemento
2. Aba "Computed" no DevTools
3. Verificar:
   - height: 88px
   - padding: 16px
4. Ou usar régua do DevTools (Ctrl+Shift+P → "Show rulers")
```

---

## 🔤 Teste 7: Formatação de Valores

### Valores para Testar
- [ ] `850` → "R$ 850"
- [ ] `18_200` → "R$ 18,2 mil"
- [ ] `1_850_000` → "R$ 1,8 mi"
- [ ] `0` → "R$ 0"
- [ ] Valores negativos com sinal

### Como Testar
```
1. Verificar valores exibidos nos KPIs
2. Confirmar abreviação correta
3. Máximo 6-7 caracteres visíveis
4. Sem quebra de linha
```

---

## 🎭 Teste 8: Estados Vazios

### Cenários
- [ ] KPI sem dados mostra "—"
- [ ] Dica exibida: "Importe extrato" ou similar
- [ ] Badge não aparece
- [ ] Sparkline não aparece
- [ ] Cor cinza 50%
- [ ] Tooltip ainda funciona

### Como Testar
```
1. Limpar dados do banco (ou usar mock vazio)
2. Recarregar dashboard
3. Verificar estado vazio de cada KPI
```

---

## 🖱️ Teste 9: Interações

### Clique
- [ ] Cursor muda para pointer
- [ ] Hover muda background
- [ ] Clique dispara onKPIClick
- [ ] Focus visible com anel

### Tooltip
- [ ] Hover no KPI mostra tooltip
- [ ] Texto do tooltip legível
- [ ] Posicionamento correto
- [ ] Fecha ao sair do hover

### Como Testar
```
1. Passar mouse sobre cada KPI
2. Verificar mudança visual
3. Clicar e verificar console
4. Tab para navegar por teclado
5. Verificar focus ring
```

---

## 🌓 Teste 10: Dark Mode

### Checklist
- [ ] Alternar tema funciona
- [ ] Cores semânticas ajustadas
- [ ] Badges com fundo 12% da cor
- [ ] Sparkline 30% opacidade
- [ ] Contraste adequado
- [ ] Sem "flash" ao alternar

### Como Testar
```
1. Clicar no botão de tema (header)
2. Verificar transição suave
3. Inspecionar cores no DevTools
4. Verificar contraste com ferramenta WCAG
```

---

## 🐛 Teste 11: Casos Extremos

### Valores Grandes
- [ ] `999_999_999` → "R$ 999,9 mi"
- [ ] Não quebra layout
- [ ] Truncate funciona

### Valores Negativos
- [ ] `-18_200` → "R$ -18,2 mil"
- [ ] Badge vermelho
- [ ] Ícone ▼

### Títulos Longos
- [ ] "Inadimplência de Clientes Ativos" → truncado
- [ ] Ellipsis visível
- [ ] Tooltip mostra texto completo

### Como Testar
```
1. Modificar dados mockados
2. Testar valores extremos
3. Verificar comportamento
```

---

## 📊 Teste 12: Performance

### Métricas
- [ ] Renderização < 100ms
- [ ] Sem layout shift
- [ ] Sparklines renderizam suavemente
- [ ] Sem re-renders desnecessários

### Como Testar
```
1. Abrir DevTools → Performance
2. Gravar interação
3. Verificar tempo de renderização
4. Verificar Cumulative Layout Shift (CLS)
```

---

## ✅ Resumo Final

### Aprovado se:
- ✅ Todos os 4 breakpoints corretos
- ✅ Altura fixa de 88px
- ✅ Largura entre 220-320px
- ✅ Sem overflow ou quebra de linha
- ✅ Abreviação de valores funciona
- ✅ Dark mode perfeito
- ✅ Estados vazios corretos
- ✅ Interações funcionam
- ✅ Performance adequada

### Reprovado se:
- ❌ KPIs com alturas diferentes
- ❌ Overflow horizontal
- ❌ Texto quebrado
- ❌ Grid errado em qualquer breakpoint
- ❌ Contraste insuficiente
- ❌ Sparkline não renderiza
- ❌ Tooltip não funciona

---

## 🚀 Após Aprovação

1. [ ] Documentar bugs encontrados
2. [ ] Criar issues para melhorias
3. [ ] Atualizar screenshots
4. [ ] Marcar como "Pronto para Produção"

---

**Testador:** _____________  
**Data:** _____________  
**Status:** [ ] Aprovado [ ] Reprovado  
**Observações:** _____________

