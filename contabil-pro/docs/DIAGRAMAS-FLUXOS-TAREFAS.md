# 🔄 Diagramas e Fluxos: Tarefas e Timeline

**Complemento aos documentos de análise**

---

## 📊 1. DIAGRAMA DE ENTIDADES

```
┌─────────────────────────────────────────────────────────────┐
│                     MODELO DE DADOS                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐         ┌──────────────┐         ┌──────────────┐
│   tenants    │◄────────│    tasks     │────────►│   clients    │
│              │ 1     * │              │ *     1 │              │
│ • id         │         │ • id         │         │ • id         │
│ • name       │         │ • tenant_id  │         │ • name       │
│ • slug       │         │ • client_id  │         │ • document   │
└──────────────┘         │ • title      │         └──────────────┘
                         │ • description│
       ┌─────────────────│ • type       │
       │                 │ • priority   │
       │                 │ • status     │
       │                 │ • due_date   │
       │                 │ • assigned_to│
       │                 │ • created_by │
       │                 └──────────────┘
       │                        │
       │                        │ 1
       │                        │
       │                        │ *
       │                 ┌──────────────┐
       │                 │   timeline   │
       │                 │              │
       │                 │ • id         │
       └─────────────────│ • tenant_id  │
                         │ • client_id  │
                         │ • event_type │
                         │ • title      │
                         │ • task_id    │
                         │ • document_id│
                         │ • entry_id   │
                         │ • user_id    │
                         │ • created_at │
                         └──────────────┘
```

---

## 🔄 2. FLUXO: Criar Tarefa

```
┌─────────────────────────────────────────────────────────────┐
│                    CRIAR TAREFA                              │
└─────────────────────────────────────────────────────────────┘

Usuário                  UI                  Hook              Action              DB
  │                      │                    │                  │                  │
  │  Clica "Nova         │                    │                  │                  │
  │  Tarefa"             │                    │                  │                  │
  ├─────────────────────►│                    │                  │                  │
  │                      │                    │                  │                  │
  │                      │  Abre TaskDialog   │                  │                  │
  │                      │  com formulário    │                  │                  │
  │                      │                    │                  │                  │
  │  Preenche dados      │                    │                  │                  │
  │  e clica "Salvar"    │                    │                  │                  │
  ├─────────────────────►│                    │                  │                  │
  │                      │                    │                  │                  │
  │                      │  Valida com Zod    │                  │                  │
  │                      │  ✅ OK             │                  │                  │
  │                      │                    │                  │                  │
  │                      │  useCreateTask()   │                  │                  │
  │                      ├───────────────────►│                  │                  │
  │                      │                    │                  │                  │
  │                      │                    │  createTask()    │                  │
  │                      │                    ├─────────────────►│                  │
  │                      │                    │                  │                  │
  │                      │                    │                  │  INSERT tasks    │
  │                      │                    │                  ├─────────────────►│
  │                      │                    │                  │                  │
  │                      │                    │                  │  ✅ RLS valida   │
  │                      │                    │                  │  tenant_id       │
  │                      │                    │                  │                  │
  │                      │                    │                  │  🔔 Trigger      │
  │                      │                    │                  │  registra        │
  │                      │                    │                  │  timeline        │
  │                      │                    │                  │                  │
  │                      │                    │                  │  ✅ Retorna task │
  │                      │                    │                  │◄─────────────────│
  │                      │                    │                  │                  │
  │                      │                    │  ✅ Success      │                  │
  │                      │                    │◄─────────────────│                  │
  │                      │                    │                  │                  │
  │                      │                    │  🔄 Invalida     │                  │
  │                      │                    │  cache           │                  │
  │                      │                    │                  │                  │
  │                      │  ✅ Success        │                  │                  │
  │                      │◄───────────────────│                  │                  │
  │                      │                    │                  │                  │
  │                      │  🎉 Toast          │                  │                  │
  │                      │  "Tarefa criada"   │                  │                  │
  │                      │                    │                  │                  │
  │  ✅ Vê tarefa        │  🔄 UI atualiza    │                  │                  │
  │  na lista            │  automaticamente   │                  │                  │
  │◄─────────────────────│                    │                  │                  │
```

---

## 🔄 3. FLUXO: Iniciar Tarefa (Ação Rápida)

```
┌─────────────────────────────────────────────────────────────┐
│                   INICIAR TAREFA                             │
└─────────────────────────────────────────────────────────────┘

Usuário                  UI                  Hook              Action              DB
  │                      │                    │                  │                  │
  │  Clica "Iniciar"     │                    │                  │                  │
  │  no TaskCard         │                    │                  │                  │
  ├─────────────────────►│                    │                  │                  │
  │                      │                    │                  │                  │
  │                      │  useUpdateTask     │                  │                  │
  │                      │  Status()          │                  │                  │
  │                      ├───────────────────►│                  │                  │
  │                      │                    │                  │                  │
  │                      │                    │  updateTask      │                  │
  │                      │                    │  Status()        │                  │
  │                      │                    ├─────────────────►│                  │
  │                      │                    │                  │                  │
  │                      │                    │                  │  UPDATE tasks    │
  │                      │                    │                  │  SET status =    │
  │                      │                    │                  │  'in_progress'   │
  │                      │                    │                  ├─────────────────►│
  │                      │                    │                  │                  │
  │                      │                    │                  │  🔔 Trigger      │
  │                      │                    │                  │  registra        │
  │                      │                    │                  │  'task_started'  │
  │                      │                    │                  │                  │
  │                      │                    │                  │  ✅ Retorna task │
  │                      │                    │                  │◄─────────────────│
  │                      │                    │                  │                  │
  │                      │                    │  ✅ Success      │                  │
  │                      │                    │◄─────────────────│                  │
  │                      │                    │                  │                  │
  │                      │  ✅ Success        │                  │                  │
  │                      │◄───────────────────│                  │                  │
  │                      │                    │                  │                  │
  │                      │  🎉 Toast          │                  │                  │
  │                      │  "Tarefa iniciada" │                  │                  │
  │                      │                    │                  │                  │
  │                      │  🔄 Badge muda     │                  │                  │
  │                      │  para "Em Andam."  │                  │                  │
  │                      │                    │                  │                  │
  │                      │  🔄 Botão muda     │                  │                  │
  │                      │  para "Concluir"   │                  │                  │
  │                      │                    │                  │                  │
  │  ✅ Vê mudança       │                    │                  │                  │
  │  instantânea         │                    │                  │                  │
  │◄─────────────────────│                    │                  │                  │
```

---

## 🔄 4. FLUXO: Filtrar Tarefas

```
┌─────────────────────────────────────────────────────────────┐
│                   FILTRAR TAREFAS                            │
└─────────────────────────────────────────────────────────────┘

Usuário                  UI                  Hook              Action              DB
  │                      │                    │                  │                  │
  │  Seleciona filtro    │                    │                  │                  │
  │  "Pendentes"         │                    │                  │                  │
  ├─────────────────────►│                    │                  │                  │
  │                      │                    │                  │                  │
  │                      │  setActiveTab      │                  │                  │
  │                      │  ('pending')       │                  │                  │
  │                      │                    │                  │                  │
  │                      │  useMemo()         │                  │                  │
  │                      │  filtra client-    │                  │                  │
  │                      │  side              │                  │                  │
  │                      │                    │                  │                  │
  │                      │  🔄 Re-renderiza   │                  │                  │
  │                      │  apenas tarefas    │                  │                  │
  │                      │  pendentes         │                  │                  │
  │                      │                    │                  │                  │
  │  ✅ Vê lista         │                    │                  │                  │
  │  filtrada            │                    │                  │                  │
  │  INSTANTANEAMENTE    │                    │                  │                  │
  │◄─────────────────────│                    │                  │                  │
  │                      │                    │                  │                  │
  │  (Sem requisição     │                    │                  │                  │
  │   ao servidor!)      │                    │                  │                  │
```

---

## 🔄 5. FLUXO: Registro Automático na Timeline

```
┌─────────────────────────────────────────────────────────────┐
│              REGISTRO AUTOMÁTICO - TIMELINE                  │
└─────────────────────────────────────────────────────────────┘

Ação do Usuário          Tabela              Trigger           Timeline
  │                      │                    │                  │
  │  Upload de           │                    │                  │
  │  documento           │                    │                  │
  ├─────────────────────►│                    │                  │
  │                      │                    │                  │
  │                      │  INSERT INTO       │                  │
  │                      │  documents         │                  │
  │                      │                    │                  │
  │                      │  ✅ Sucesso        │                  │
  │                      │                    │                  │
  │                      │  🔔 AFTER INSERT   │                  │
  │                      │  TRIGGER           │                  │
  │                      ├───────────────────►│                  │
  │                      │                    │                  │
  │                      │                    │  IF client_id    │
  │                      │                    │  IS NOT NULL     │
  │                      │                    │                  │
  │                      │                    │  INSERT INTO     │
  │                      │                    │  client_timeline │
  │                      │                    ├─────────────────►│
  │                      │                    │                  │
  │                      │                    │  event_type:     │
  │                      │                    │  'document_      │
  │                      │                    │   uploaded'      │
  │                      │                    │                  │
  │                      │                    │  title:          │
  │                      │                    │  'Documento      │
  │                      │                    │   adicionado'    │
  │                      │                    │                  │
  │                      │                    │  ✅ Registrado   │
  │                      │                    │◄─────────────────│
  │                      │                    │                  │
  │                      │  ✅ Commit         │                  │
  │                      │◄───────────────────│                  │
  │                      │                    │                  │
  │  ✅ Documento        │                    │                  │
  │  salvo + evento      │                    │                  │
  │  registrado          │                    │                  │
  │◄─────────────────────│                    │                  │
```

---

## 🔄 6. FLUXO: Carregar Timeline do Cliente

```
┌─────────────────────────────────────────────────────────────┐
│                CARREGAR TIMELINE                             │
└─────────────────────────────────────────────────────────────┘

Usuário                  UI                  Hook              Action              DB
  │                      │                    │                  │                  │
  │  Acessa página       │                    │                  │                  │
  │  /clientes/[id]      │                    │                  │                  │
  ├─────────────────────►│                    │                  │                  │
  │                      │                    │                  │                  │
  │                      │  ClientTimeline    │                  │                  │
  │                      │  Section renderiza │                  │                  │
  │                      │                    │                  │                  │
  │                      │  useClientTimeline │                  │                  │
  │                      │  ({ client_id })   │                  │                  │
  │                      ├───────────────────►│                  │                  │
  │                      │                    │                  │                  │
  │                      │                    │  getClientTime   │                  │
  │                      │                    │  line()          │                  │
  │                      │                    ├─────────────────►│                  │
  │                      │                    │                  │                  │
  │                      │                    │                  │  SELECT *        │
  │                      │                    │                  │  FROM timeline   │
  │                      │                    │                  │  WHERE           │
  │                      │                    │                  │  client_id = ?   │
  │                      │                    │                  │  ORDER BY        │
  │                      │                    │                  │  created_at DESC │
  │                      │                    │                  ├─────────────────►│
  │                      │                    │                  │                  │
  │                      │                    │                  │  ✅ Retorna      │
  │                      │                    │                  │  eventos         │
  │                      │                    │                  │◄─────────────────│
  │                      │                    │                  │                  │
  │                      │                    │  ✅ Success      │                  │
  │                      │                    │◄─────────────────│                  │
  │                      │                    │                  │                  │
  │                      │  ✅ Eventos        │                  │                  │
  │                      │◄───────────────────│                  │                  │
  │                      │                    │                  │                  │
  │                      │  🔄 Renderiza      │                  │                  │
  │                      │  lista cronológica │                  │                  │
  │                      │                    │                  │                  │
  │  ✅ Vê histórico     │                    │                  │                  │
  │  de atividades       │                    │                  │                  │
  │◄─────────────────────│                    │                  │                  │
```

---

## 🎯 7. DECISÕES ARQUITETURAIS

### Decisão 1: Tabela Dedicada vs View Agregada (Timeline)

**Opção A: Tabela Dedicada** ✅ ESCOLHIDA
```
Prós:
✅ Performance superior (índices otimizados)
✅ Flexibilidade (adicionar campos facilmente)
✅ Triggers simples
✅ Queries rápidas

Contras:
❌ Duplicação de dados
❌ Mais espaço em disco
```

**Opção B: View Agregada**
```
Prós:
✅ Sem duplicação de dados
✅ Sempre atualizada

Contras:
❌ Performance inferior (JOIN complexo)
❌ Difícil adicionar campos
❌ Queries lentas
```

**Justificativa:** Performance é crítica para UX. Timeline será consultada frequentemente.

---

### Decisão 2: Filtros Client-Side vs Server-Side

**Opção A: Client-Side** ✅ ESCOLHIDA (para tabs)
```
Prós:
✅ Instantâneo (sem latência)
✅ Menos requisições ao servidor
✅ Melhor UX

Contras:
❌ Todos os dados carregados
❌ Não funciona para grandes volumes
```

**Opção B: Server-Side** ✅ ESCOLHIDA (para busca/filtros avançados)
```
Prós:
✅ Escalável
✅ Menos dados transferidos
✅ Funciona com grandes volumes

Contras:
❌ Latência de rede
❌ Mais requisições
```

**Justificativa:** Híbrido - tabs client-side (rápido), filtros avançados server-side (escalável).

---

### Decisão 3: Atribuição de Tarefas

**Opção A: Sem Atribuição** ✅ ESCOLHIDA
```
Prós:
✅ UI mais simples
✅ Menos campos no formulário
✅ Adequado para usuário único

Contras:
❌ Menos flexível para futuro
```

**Opção B: Com Atribuição**
```
Prós:
✅ Preparado para multi-usuário
✅ Mais completo

Contras:
❌ Complexidade desnecessária
❌ UI mais carregada
```

**Justificativa:** Usuário único (contador). Simplicidade > Flexibilidade.

---

### Decisão 4: Notificações

**Opção A: Email Diário** ✅ ESCOLHIDA
```
Prós:
✅ Simples de implementar
✅ Não intrusivo
✅ Adequado para contador

Contras:
❌ Não é em tempo real
```

**Opção B: Push Notifications**
```
Prós:
✅ Tempo real
✅ Mais engajamento

Contras:
❌ Complexo de implementar
❌ Pode ser intrusivo
❌ Requer service worker
```

**Justificativa:** Email diário é suficiente para o perfil de usuário.

---

## 📊 8. MÉTRICAS DE PERFORMANCE

### Targets

| Métrica | Target | Crítico |
|---------|--------|---------|
| Carregamento inicial | < 1s | ✅ |
| Filtro client-side | < 100ms | ✅ |
| Criar tarefa | < 500ms | ✅ |
| Atualizar status | < 300ms | ✅ |
| Carregar timeline | < 800ms | ⚠️ |

### Otimizações

**1. Índices de Banco**
```sql
CREATE INDEX idx_tasks_client_id ON tasks(client_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_timeline_client_id ON client_timeline(client_id);
CREATE INDEX idx_timeline_created_at ON client_timeline(created_at DESC);
```

**2. React Query Cache**
```typescript
staleTime: 30 * 1000,  // 30 segundos
gcTime: 5 * 60 * 1000, // 5 minutos
```

**3. Paginação**
```typescript
pageSize: 20, // Tarefas
pageSize: 30, // Timeline
```

**4. Memoização**
```typescript
const filteredTasks = useMemo(() => {
  // Filtro client-side
}, [tasks, activeTab]);
```

---

## 🔒 9. SEGURANÇA (RLS)

### Políticas Implementadas

**Tasks:**
```sql
-- SELECT: Ver tarefas do tenant
CREATE POLICY "view_tasks" ON tasks
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- INSERT: Criar tarefas no tenant
CREATE POLICY "create_tasks" ON tasks
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());

-- UPDATE: Atualizar próprias tarefas
CREATE POLICY "update_tasks" ON tasks
  FOR UPDATE
  USING (
    tenant_id = current_tenant_id() AND
    (assigned_to = auth.uid() OR created_by = auth.uid())
  );

-- DELETE: Deletar próprias tarefas
CREATE POLICY "delete_tasks" ON tasks
  FOR DELETE
  USING (
    tenant_id = current_tenant_id() AND
    created_by = auth.uid()
  );
```

**Timeline:**
```sql
-- SELECT: Ver timeline do tenant
CREATE POLICY "view_timeline" ON client_timeline
  FOR SELECT
  USING (tenant_id = current_tenant_id());

-- INSERT: Sistema insere via triggers
CREATE POLICY "insert_timeline" ON client_timeline
  FOR INSERT
  WITH CHECK (tenant_id = current_tenant_id());
```

---

**FIM DOS DIAGRAMAS E FLUXOS** ✅


