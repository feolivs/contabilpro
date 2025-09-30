# ✅ CHECKLIST DE TESTES - Página de Documentos

## 🎯 **OBJETIVO**
Validar todas as funcionalidades implementadas e garantir segurança multi-tenant.

---

## 📋 **TESTES FUNCIONAIS**

### **1. Upload de Documentos** ✅

#### **Teste 1.1: Upload Simples**
- [ ] Clicar no botão "Upload de Arquivo"
- [ ] Dialog abre corretamente
- [ ] Selecionar tipo de documento (ex: NFe)
- [ ] Arrastar um PDF para a área de drop
- [ ] Arquivo aparece na lista com nome e tamanho
- [ ] Clicar em "Enviar"
- [ ] Progress bar aparece e chega a 100%
- [ ] Mensagem de sucesso aparece
- [ ] Dialog fecha automaticamente após 2s
- [ ] Documento aparece na tabela

**Resultado esperado:** ✅ Upload bem-sucedido

---

#### **Teste 1.2: Upload Múltiplo**
- [ ] Abrir dialog de upload
- [ ] Selecionar 3 arquivos diferentes
- [ ] Todos aparecem na lista
- [ ] Clicar em "Enviar (3)"
- [ ] Progress bar mostra progresso
- [ ] Todos os 3 documentos aparecem na tabela

**Resultado esperado:** ✅ Upload múltiplo funciona

---

#### **Teste 1.3: Detecção de Duplicata**
- [ ] Fazer upload de um arquivo
- [ ] Fazer upload do MESMO arquivo novamente
- [ ] Sistema detecta duplicata
- [ ] Mensagem: "Arquivo duplicado (já existe)"
- [ ] Não cria documento duplicado no banco

**Resultado esperado:** ✅ Duplicata detectada (hash SHA-256)

---

#### **Teste 1.4: Validação de Arquivo**
- [ ] Tentar fazer upload de arquivo .exe
- [ ] Sistema rejeita (tipo não permitido)
- [ ] Tentar fazer upload de arquivo > 50MB
- [ ] Sistema rejeita (tamanho excedido)

**Resultado esperado:** ✅ Validação funciona

---

### **2. Listagem de Documentos** ✅

#### **Teste 2.1: Visualização**
- [ ] Página carrega e mostra documentos
- [ ] Colunas visíveis: Nome, Tipo, Cliente, Data
- [ ] Ícone de arquivo aparece
- [ ] Tamanho do arquivo aparece abaixo do nome
- [ ] Badge de tipo aparece (ex: "NFe")

**Resultado esperado:** ✅ Listagem correta

---

#### **Teste 2.2: Ordenação**
- [ ] Clicar no header "Nome"
- [ ] Documentos ordenam alfabeticamente
- [ ] Clicar novamente
- [ ] Ordem inverte (Z-A)
- [ ] Clicar no header "Data"
- [ ] Documentos ordenam por data

**Resultado esperado:** ✅ Ordenação funciona

---

#### **Teste 2.3: Empty State**
- [ ] Deletar todos os documentos
- [ ] Página mostra empty state
- [ ] Mensagem: "Nenhum documento encontrado"
- [ ] Ícone de arquivo aparece
- [ ] Sugestão de fazer upload

**Resultado esperado:** ✅ Empty state aparece

---

### **3. Download de Documentos** ✅

#### **Teste 3.1: Download Básico**
- [ ] Clicar no menu (3 pontos) de um documento
- [ ] Clicar em "Baixar"
- [ ] Nova aba abre com o documento
- [ ] Toast de sucesso aparece
- [ ] Documento é visualizado/baixado

**Resultado esperado:** ✅ Download funciona

---

#### **Teste 3.2: URL Assinada**
- [ ] Fazer download de um documento
- [ ] Copiar a URL da nova aba
- [ ] Aguardar 1 hora
- [ ] Tentar acessar a URL novamente
- [ ] URL expirada (erro 403)

**Resultado esperado:** ✅ URL expira após 1 hora

---

### **4. Delete de Documentos** ✅

#### **Teste 4.1: Delete como Admin**
- [ ] Logar como admin/owner
- [ ] Clicar no menu de um documento
- [ ] Clicar em "Deletar"
- [ ] Dialog de confirmação aparece
- [ ] Clicar em "Deletar"
- [ ] Documento desaparece da tabela
- [ ] Toast de sucesso aparece

**Resultado esperado:** ✅ Delete funciona

---

#### **Teste 4.2: Delete como Usuário Comum**
- [ ] Logar como usuário comum (não admin)
- [ ] Clicar no menu de um documento
- [ ] Opção "Deletar" está desabilitada OU
- [ ] Ao clicar, recebe erro de permissão

**Resultado esperado:** ✅ Usuário comum não pode deletar

---

## 🔒 **TESTES DE SEGURANÇA**

### **5. Isolamento Multi-Tenant** 🚨

#### **Teste 5.1: Isolamento de Visualização**
- [ ] Logar como Usuário A (Tenant A)
- [ ] Fazer upload de documento "Doc-A.pdf"
- [ ] Fazer logout
- [ ] Logar como Usuário B (Tenant B)
- [ ] Verificar lista de documentos
- [ ] "Doc-A.pdf" NÃO aparece na lista

**Resultado esperado:** ✅ Usuário B não vê documentos do Tenant A

---

#### **Teste 5.2: Isolamento de Download**
- [ ] Logar como Usuário A
- [ ] Copiar ID de um documento do Tenant A
- [ ] Fazer logout
- [ ] Logar como Usuário B
- [ ] Tentar fazer download usando o ID do Tenant A
- [ ] Sistema retorna erro (documento não encontrado)

**Resultado esperado:** ✅ Usuário B não acessa documentos do Tenant A

---

#### **Teste 5.3: Isolamento de Storage**
- [ ] Logar como Usuário A
- [ ] Fazer upload de documento
- [ ] Verificar path no Storage: `{tenant_A_id}/nfe/2025/...`
- [ ] Fazer logout
- [ ] Logar como Usuário B
- [ ] Fazer upload de documento
- [ ] Verificar path no Storage: `{tenant_B_id}/nfe/2025/...`
- [ ] Paths são diferentes (tenants separados)

**Resultado esperado:** ✅ Documentos isolados por tenant no Storage

---

### **6. Auditoria (LGPD)** ✅

#### **Teste 6.1: Registro de Eventos**
- [ ] Fazer upload de documento
- [ ] Verificar tabela `document_events`
- [ ] Evento "upload" registrado
- [ ] Fazer download
- [ ] Evento "download" registrado
- [ ] Deletar documento
- [ ] Evento "delete" registrado

**SQL para verificar:**
```sql
SELECT * FROM document_events 
WHERE tenant_id = '{seu_tenant_id}' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Resultado esperado:** ✅ Todos os eventos registrados

---

## 🎯 **TESTES DE PERFORMANCE**

### **7. Performance** ✅

#### **Teste 7.1: Upload de Arquivo Grande**
- [ ] Fazer upload de arquivo de 40MB
- [ ] Progress bar atualiza suavemente
- [ ] Upload completa em tempo razoável (<30s)
- [ ] Sem travamentos na UI

**Resultado esperado:** ✅ Performance aceitável

---

#### **Teste 7.2: Listagem com Muitos Documentos**
- [ ] Fazer upload de 50 documentos
- [ ] Página carrega em tempo razoável (<2s)
- [ ] Ordenação funciona rapidamente
- [ ] Scroll suave

**Resultado esperado:** ✅ Performance aceitável

---

## 📊 **RESUMO DE TESTES**

### **Checklist Geral:**
- [ ] Upload simples funciona
- [ ] Upload múltiplo funciona
- [ ] Duplicatas são detectadas
- [ ] Validação de arquivos funciona
- [ ] Listagem mostra documentos
- [ ] Ordenação funciona
- [ ] Empty state aparece quando vazio
- [ ] Download funciona
- [ ] URLs assinadas expiram
- [ ] Delete funciona (admin)
- [ ] Usuário comum não pode deletar
- [ ] Isolamento multi-tenant funciona
- [ ] Auditoria registra eventos
- [ ] Performance aceitável

---

## 🚨 **PROBLEMAS ENCONTRADOS**

### **Registrar aqui qualquer problema:**

1. **Problema:** _____________________
   - **Esperado:** _____________________
   - **Obtido:** _____________________
   - **Severidade:** 🔴 Alta / 🟡 Média / 🟢 Baixa

---

## ✅ **APROVAÇÃO FINAL**

- [ ] Todos os testes funcionais passaram
- [ ] Todos os testes de segurança passaram
- [ ] Performance aceitável
- [ ] Nenhum bug crítico encontrado

**Assinatura:** _________________ **Data:** _________

---

## 🎉 **PRÓXIMOS PASSOS**

Após todos os testes passarem:
1. ✅ Marcar página de documentos como COMPLETA
2. ✅ Documentar funcionalidades no README
3. ✅ Treinar usuários (se necessário)
4. ✅ Monitorar uso em produção
5. ⏳ Planejar Fase 2 (OCR, IA, etc.)

---

**Status:** ⏳ Aguardando execução dos testes

