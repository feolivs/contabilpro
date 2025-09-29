# Pull Request

## 📝 **Descrição**
<!-- Descreva brevemente as mudanças implementadas -->

## 🎯 **Tipo de Mudança**
- [ ] 🐛 Bug fix (correção que resolve um problema)
- [ ] ✨ Nova feature (funcionalidade que adiciona valor)
- [ ] 💥 Breaking change (mudança que quebra compatibilidade)
- [ ] 📚 Documentação (apenas mudanças de docs)
- [ ] 🔧 Refactoring (mudança de código sem alterar funcionalidade)
- [ ] ⚡ Performance (melhoria de performance)
- [ ] 🧪 Testes (adição ou correção de testes)

## 🔍 **Server Actions Hygiene** (Obrigatório)
- [ ] ✅ Arquivo "use server" exporta **somente funções async**?
- [ ] ✅ Tipos/constantes estão em `types/` ou `schemas/`?
- [ ] ✅ Componentes importam tipos de `types/`, **nunca de `actions/`**?
- [ ] ✅ Executei `npm run check:server-actions` sem erros?
- [ ] ✅ Turbopack/Next cache foi invalidado (`rm -rf .next`)?

## 🧪 **Testes Manuais**
- [ ] ✅ `/dashboard` carrega e exibe métricas?
- [ ] ✅ `/clientes` abre e permite CRUD?
- [ ] ✅ `/lancamentos` abre e executa ações sem erro?
- [ ] ✅ `/bancos` abre e executa ações sem erro?
- [ ] ✅ Hot reload funciona em < 2s?

## 📋 **Checklist Técnico**
- [ ] ✅ Código segue convenções de nomenclatura?
- [ ] ✅ Imports seguem padrões estabelecidos?
- [ ] ✅ Nenhum arquivo mistura responsabilidades?
- [ ] ✅ TypeScript compila sem erros (`npx tsc --noEmit`)?
- [ ] ✅ Build de produção funciona (`npm run build`)?

## 🔗 **Issues Relacionadas**
<!-- Mencione issues que este PR resolve -->
Closes #
Fixes #
Resolves #

## 📸 **Screenshots/GIFs** (se aplicável)
<!-- Adicione capturas de tela para mudanças visuais -->

## 🧪 **Como Testar**
<!-- Instruções passo-a-passo para testar as mudanças -->

1. Faça checkout da branch
2. Execute `npm install`
3. Execute `npm run dev`
4. Navegue para [página específica]
5. Teste [funcionalidade específica]

## 📊 **Impacto**
<!-- Descreva o impacto das mudanças -->

### Performance
- [ ] ⚡ Melhora performance
- [ ] ➡️ Neutro
- [ ] ⚠️ Pode impactar performance (justificar)

### Compatibilidade
- [ ] ✅ Totalmente compatível
- [ ] ⚠️ Requer migração (documentar)
- [ ] 💥 Breaking change (documentar)

## 🔄 **Migrations/Setup** (se aplicável)
<!-- Instruções para migrations de banco, env vars, etc. -->

```bash
# Comandos necessários após merge
npm install
npm run db:migrate
```

## 📝 **Notas Adicionais**
<!-- Qualquer informação adicional relevante -->

---

## ✅ **Checklist do Reviewer**

### Code Review
- [ ] Código está limpo e bem documentado
- [ ] Lógica de negócio está correta
- [ ] Tratamento de erros adequado
- [ ] Performance considerada

### Server Actions
- [ ] `npm run check:server-actions` passou
- [ ] Estrutura de pastas respeitada
- [ ] Imports corretos verificados

### Funcionalidade
- [ ] Testei manualmente as mudanças
- [ ] Funcionalidade funciona como esperado
- [ ] Não quebra funcionalidades existentes

### Documentação
- [ ] README atualizado (se necessário)
- [ ] Comentários de código adequados
- [ ] ADR criado (se decisão arquitetural)

---

**⚠️ IMPORTANTE**: Este PR só pode ser merged após:
1. ✅ Todos os checks de CI passarem
2. ✅ Aprovação de pelo menos 1 reviewer
3. ✅ Server Actions Hygiene validado
4. ✅ Testes manuais confirmados
