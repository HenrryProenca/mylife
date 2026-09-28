#!/usr/bin/env bash

# ============================================================
# Fix — Corrige policy de household_convites (auth.users → auth.jwt)
# ============================================================
# O que este script faz:
# - Atualiza supabase/schema.sql com a policy corrigida
#   (usa auth.jwt() em vez de auth.users)
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - supabase/schema.sql (sobrescrito)
# ============================================================

set -e

# Faça uma cópia do schema.sql atual para não perder
cp supabase/schema.sql supabase/schema.sql.bak 2>/dev/null || true

# Lê o schema, substitui a policy e escreve de volta
python3 - <<'PY' 2>/dev/null || python - <<'PY'
import re

with open('supabase/schema.sql', 'r', encoding='utf-8') as f:
    conteudo = f.read()

antigo = """drop policy if exists convites_select on public.household_convites;
create policy convites_select on public.household_convites
  for select to authenticated
  using (
    public.is_household_member(household_id)
    or email_convidado = (select email from auth.users where id = auth.uid())
  );"""

novo = """drop policy if exists convites_select on public.household_convites;
create policy convites_select on public.household_convites
  for select to authenticated
  using (
    public.is_household_member(household_id)
    or lower(email_convidado) = lower((auth.jwt() ->> 'email')::text)
  );"""

if antigo not in conteudo:
    print("⚠️  Trecho antigo não encontrado no schema.sql. Nada foi alterado.")
    print("   Verifique manualmente a policy convites_select.")
    exit(1)

conteudo = conteudo.replace(antigo, novo)

with open('supabase/schema.sql', 'w', encoding='utf-8') as f:
    f.write(conteudo)

print("✅ schema.sql atualizado com a policy corrigida.")
PY

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git diff                (confere a mudança no schema.sql)"
echo "  2. Testar no app            (criar convite)"
echo "  3. Se estiver OK: git add . && git commit -m \"fix: corrige policy de household_convites\" && git push"
echo ""
