#!/bin/bash
# Script para remover dependência de tenant_id das funções de dashboard

echo "🔧 Aplicando migration 015: Remover tenant_id do dashboard..."

# Verifica se o arquivo de migration existe
if [ ! -f "../migrations/015_remove_tenant_from_dashboard.sql" ]; then
  echo "❌ Arquivo de migration não encontrado!"
  exit 1
fi

# Aplica a migration via Supabase CLI
supabase db push ../migrations/015_remove_tenant_from_dashboard.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration aplicada com sucesso!"
  echo ""
  echo "📋 Próximos passos:"
  echo "1. Reinicie o servidor Next.js (npm run dev)"
  echo "2. Acesse o dashboard em http://localhost:3001/dashboard"
  echo "3. Verifique se os dados carregam sem erros"
else
  echo "❌ Erro ao aplicar migration!"
  exit 1
fi

