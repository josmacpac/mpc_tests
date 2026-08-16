#!/usr/bin/env bash
# ============================================================================
# mpc_tests / run.sh
# Elige el ambiente (local | dev | prod) y qué pruebas correr.
# Uso:  ./run.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

ENV_DIR="environments"

echo "=============================================="
echo "  mpc_tests - Selector de pruebas"
echo "=============================================="

# ------------------------- 1. Ambiente -------------------------
echo ""
echo "¿A qué ambiente apuntan las pruebas?"
echo "  1) local    API http://127.0.0.1:5000 + frontends en localhost"
echo "  2) dev      Render + Netlify dev (recomendado)"
echo "  3) prod     Producción real (¡requiere confirmación!)"
read -r -p "Elige (1-3) [2]: " amb || amb=""
amb="${amb:-2}"

case "$amb" in
  1) ENV_FILE="$ENV_DIR/local.env" ;;
  2) ENV_FILE="$ENV_DIR/dev.env" ;;
  3) ENV_FILE="$ENV_DIR/prod.env" ;;
  *) echo "Opción inválida: $amb"; exit 1 ;;
esac

if [ ! -f "$ENV_FILE" ]; then
  echo "No existe el archivo de ambiente: $ENV_FILE"; exit 1
fi

set -a; source "$ENV_FILE"; set +a
echo "→ Ambiente: ${ENV_NAME}  (${API_URL})"

if [ "$ENV_NAME" = "prod" ]; then
  read -r -p "⚠️  Vas a correr contra PRODUCCIÓN. Escribe SI para continuar: " conf || conf=""
  [ "$conf" = "SI" ] || { echo "Cancelado."; exit 1; }
fi

# ------------------------- 2. Pruebas -------------------------
echo ""
echo "¿Qué pruebas quieres correr?"
echo "  1) Newman API        (colección completa contra $API_URL)"
echo "  2) Playwright vet    (${VET_URL})"
echo "  3) Playwright admin  (${ADMIN_URL})"
echo "  4) Playwright clientes (${CLIENTES_URL:-URL no configurada})"
echo "  5) Todo              (Newman + Playwright)"
read -r -p "Elige (1-5): " tests || tests=""

run_newman() {
  echo ""
  echo "▶ Newman contra $API_URL"
  (cd api && npx newman run collections/mpc_api.postman_collection.json \
    -e environments/mpc_dev.postman_environment.json \
    --env-var "BASE_URL=$API_URL" \
    --env-var "VET_EMAIL=$VET_EMAIL" --env-var "VET_PASSWORD=$VET_PASSWORD" \
    --env-var "ADMIN_EMAIL=$ADMIN_EMAIL" --env-var "ADMIN_PASSWORD=$ADMIN_PASSWORD" \
    --env-var "CLIENTE_EMAIL=$CLIENTE_EMAIL" --env-var "CLIENTE_PASSWORD=$CLIENTE_PASSWORD" \
    --env-var "ID_CLINICA=$ID_CLINICA")
}

run_pw() {
  echo ""
  echo "▶ Playwright (proyecto: $1) contra ${2:-}"
  npx playwright test --project="$1"
}

case "$tests" in
  1) run_newman ;;
  2) run_pw vet "$VET_URL" ;;
  3) run_pw admin "$ADMIN_URL" ;;
  4) run_pw clientes "${CLIENTES_URL:-}" ;;
  5) run_newman; run_pw vet "$VET_URL"; run_pw admin "$ADMIN_URL"; run_pw clientes "${CLIENTES_URL:-}" ;;
  *) echo "Opción inválida: $tests"; exit 1 ;;
esac

echo ""
echo "✔ Pruebas terminadas."