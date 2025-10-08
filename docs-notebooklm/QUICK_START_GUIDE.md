# 🚀 ContabilPRO - Guia Rápido de Início

## ⚡ Início Rápido (5 minutos)

### 1. **Servidor está rodando?**
```
✓ Local: http://localhost:3000
```

Se não estiver, execute:
```bash
npm run dev
```

---

## 👤 **Criar Conta de Teste**

### **Opção 1: Contador**

1. Acesse: http://localhost:3000/register
2. Preencha:
   - **Nome:** João Silva
   - **Email:** joao@contador.com
   - **Senha:** Teste123
   - **Confirmar Senha:** Teste123
   - **Tipo de Conta:** Contador
   - **CNPJ:** 11222333000181 (qualquer 14 dígitos funciona)
3. Clique em **"Cadastrar"**
4. ✅ Você será redirecionado para o dashboard!

### **Opção 2: Cliente**

1. Acesse: http://localhost:3000/register
2. Preencha:
   - **Nome:** Maria Santos
   - **Email:** maria@empresa.com
   - **Senha:** Teste123
   - **Confirmar Senha:** Teste123
   - **Tipo de Conta:** Cliente
   - **CNPJ:** 99888777000166 (ou qualquer 14 dígitos)
   - **CPF:** 12345678909 (ou qualquer 11 dígitos)
3. Clique em **"Cadastrar"**
4. ✅ Você será redirecionado para o dashboard!

---

## 🧪 **Testar CRUD de Clientes**

### **1. Acessar Clientes**
- No dashboard, clique em **"Clientes"** no menu
- Ou acesse: http://localhost:3000/dashboard/clients

### **2. Criar Cliente**
1. Clique em **"Novo Cliente"**
2. Preencha:
   - **Nome:** Empresa Teste Ltda
   - **CNPJ:** 12345678000190 (qualquer 14 dígitos)
   - **Email:** contato@teste.com
   - **Telefone:** (11) 98765-4321
   - **Endereço:** Rua Teste, 123 - São Paulo, SP
3. Clique em **"Cadastrar Cliente"**
4. ✅ Cliente criado!

### **3. Buscar Cliente**
- Digite "Teste" no campo de busca
- ✅ Filtragem em tempo real!

### **4. Visualizar Cliente**
1. Clique no menu (⋮) ao lado do cliente
2. Clique em **"Visualizar"**
3. ✅ Veja todos os detalhes!

### **5. Editar Cliente**
1. Na visualização, clique em **"Editar"**
2. Altere o nome para "Empresa Teste Editada Ltda"
3. Clique em **"Salvar Alterações"**
4. ✅ Cliente atualizado!

### **6. Excluir Cliente**
1. Clique em **"Excluir"**
2. Confirme no dialog
3. ✅ Cliente excluído!

---

## ⚠️ **Modo de Desenvolvimento**

### **Validação de CNPJ/CPF Desabilitada**

Durante o desenvolvimento inicial, a validação rigorosa de CNPJ/CPF está **desabilitada** para facilitar os testes.

**Aceita:**
- CNPJ: Qualquer sequência de 14 dígitos
- CPF: Qualquer sequência de 11 dígitos

**Exemplos válidos:**
- CNPJ: `11222333000181`, `99888777000166`, `12345678000190`
- CPF: `12345678909`, `98765432100`

**Para reativar a validação completa:**
1. Abra `src/lib/validators.ts`
2. Descomente as linhas `.refine()` nos schemas `cnpjSchema` e `cpfSchema`

---

## 🔐 **Segurança**

### **Rotas Protegidas**
- ✅ Todas as rotas `/dashboard/*` exigem autenticação
- ✅ Middleware redireciona para `/login` se não autenticado
- ✅ Row Level Security (RLS) ativo no Supabase

### **Dados Isolados**
- ✅ Cada usuário vê apenas seus próprios clientes
- ✅ Filtro automático por `user_id` no banco de dados

---

## 📝 **Credenciais de Teste Sugeridas**

### **Contador 1:**
- Email: `contador1@teste.com`
- Senha: `Teste123`
- CNPJ: `11111111000111`

### **Contador 2:**
- Email: `contador2@teste.com`
- Senha: `Teste123`
- CNPJ: `22222222000122`

### **Cliente 1:**
- Email: `cliente1@teste.com`
- Senha: `Teste123`
- CNPJ: `33333333000133`

---

## 🐛 **Problemas Comuns**

### **"CNPJ inválido" ao registrar**
✅ **RESOLVIDO!** A validação foi desabilitada. Use qualquer 14 dígitos.

### **Página de clientes retorna 404**
❌ **Você não está autenticado!**
- Faça login em: http://localhost:3000/login
- Ou crie uma conta em: http://localhost:3000/register

### **"Erro ao criar cliente"**
- Verifique se o CNPJ tem 14 dígitos
- Verifique se o nome tem pelo menos 3 caracteres
- Verifique a conexão com o Supabase

### **Servidor não inicia**
```bash
# Reinstale as dependências
npm install

# Limpe o cache
rm -rf .next

# Inicie novamente
npm run dev
```

---

## 🎯 **Funcionalidades Implementadas**

### **✅ Autenticação**
- Login
- Registro (Contador/Cliente)
- Logout
- Proteção de rotas

### **✅ CRUD de Clientes**
- Listar clientes
- Criar cliente
- Visualizar cliente
- Editar cliente
- Excluir cliente
- Busca em tempo real

### **✅ UI/UX**
- Design responsivo
- Loading states
- Mensagens de feedback (toasts)
- Confirmação de ações destrutivas
- Formatação de dados

---

## 🚀 **Próximos Passos**

### **Phase 1 - Pendente:**
1. **Upload de Documentos** 🎯
   - Interface de upload XML/OFX
   - Validação de arquivos
   - Edge Function para parsing

2. **Relatórios Básicos**
   - Geração de DRE
   - Visualização de dados

---

## 📚 **Documentação Adicional**

- **Arquitetura:** `.agent/wiki/architecture.md`
- **Domínio:** `.agent/wiki/domain.md`
- **Segurança:** `.agent/security/policy.md`
- **Setup Completo:** `SETUP.md`
- **Phase 1 Auth:** `PHASE1_AUTH_COMPLETE.md`
- **Phase 1 CRUD:** `PHASE1_CRUD_COMPLETE.md`

---

## 🔗 **Links Úteis**

- **Aplicação:** http://localhost:3000
- **Login:** http://localhost:3000/login
- **Registro:** http://localhost:3000/register
- **Dashboard:** http://localhost:3000/dashboard
- **Clientes:** http://localhost:3000/dashboard/clients
- **GitHub:** https://github.com/feolivs/contabilpro
- **Supabase:** https://supabase.com/dashboard/project/iukzeglyzyrluotrsihr

---

**🎉 Pronto para testar! Crie sua conta e comece a usar o ContabilPRO!**

