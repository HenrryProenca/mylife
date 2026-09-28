#!/usr/bin/env bash

# ============================================================
# Tarefa: Atualizar .nvmrc e index.html
# ============================================================
# O que este script faz:
# - .nvmrc: muda de "20" para "22" (Supabase 2.117.1 exige Node >= 22)
# - index.html: atualiza favicon para PNG e theme-color para off-white
#
# Arquivos criados: nenhum
# Arquivos alterados:
#   - .nvmrc (sobrescrito)
#   - index.html (sobrescrito)
# ============================================================

set -e

# --- .nvmrc ---
cat << 'EOF' > .nvmrc
22
EOF

# --- index.html ---
cat << 'EOF' > index.html
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/png" href="/mylife-symbol.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#F7F5F0" />
    <title>MyLife</title>

    <!-- Preconnect -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />

    <!-- Sora (display) -->
    <link
      href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&display=swap"
      rel="stylesheet"
    />

    <!-- Inter (sans) -->
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

echo ""
echo "✅ Pronto."
echo ""
echo "Próximos passos:"
echo "  1. git diff"
echo "  2. Se estiver OK: git add . && git commit -m \"chore: atualiza .nvmrc para Node 22 e ajusta index.html\" && git push"
echo ""