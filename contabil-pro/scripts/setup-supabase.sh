#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
DATABASE_URL="postgresql://postgres:postgres@localhost:54322/postgres"

printf '[contabilpro] Configuring Supabase local stack...\n'

if ! command -v supabase >/dev/null 2>&1; then
  printf 'Supabase CLI not found. Install with: npm install -g supabase\n' >&2
  exit 1
fi

if ! command -v docker >/dev/null 2>&1; then
  printf 'Docker is required. Install Docker Desktop and try again.\n' >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  printf 'Docker service is not running. Start Docker Desktop and retry.\n' >&2
  exit 1
fi

cd "${PROJECT_ROOT}"

if [ ! -f 'supabase/config.toml' ]; then
  printf 'Initializing Supabase project...\n'
  supabase init
fi

printf 'Starting Supabase local services...\n'
supabase start

printf 'Waiting Supabase to become ready...\n'
sleep 10

printf 'Resetting database (this will drop local data)...\n'
supabase db reset --local

apply_sql_folder() {
  local folder_path="$1"
  local label="$2"

  if [ ! -d "${folder_path}" ]; then
    return
  fi

  printf 'Applying %s...\n' "${label}"
  for file in "${folder_path}"/*.sql; do
    [ -f "${file}" ] || continue
    printf '  - %s\n' "$(basename "${file}")"
    psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f "${file}"
  done
}

apply_sql_folder 'infra/migrations' 'database migrations'
apply_sql_folder 'infra/policies' 'RLS policies'
apply_sql_folder 'infra/seeds' 'seed data'

if [ -f 'infra/scripts/test-rls.sql' ]; then
  printf 'Running RLS smoke tests...\n'
  psql "${DATABASE_URL}" -v ON_ERROR_STOP=1 -f 'infra/scripts/test-rls.sql'
fi

printf 'Regenerating Supabase TypeScript types...\n'
supabase gen types typescript --local > src/types/database.types.ts

printf '\nSupabase local environment is ready.\n'
printf 'Studio........: http://localhost:54323\n'
printf 'API URL.......: http://localhost:54321\n'
printf 'Anon key......: %s\n' "$(supabase status | awk '/anon key/ {print $3}')"
printf 'Service role..: %s\n' "$(supabase status | awk '/service_role key/ {print $3}')"
printf '\nCopy the values above to your .env.local file before running npm run dev\n'
