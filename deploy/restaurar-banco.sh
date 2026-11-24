#!/bin/bash
# Apaga o banco atual da loja e coloca no lugar um arquivo .dump.
# Não mexe no site em breve. A loja fica fora do ar só durante a troca.
set -euo pipefail

COMPOSE="docker compose -f /opt/monarca/deploy/docker-compose.yml"
arquivo="${2:-}"

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root, no servidor."
  exit 1
fi

if [ "${1:-}" != "--confirmo" ] || [ -z "$arquivo" ] || [ ! -f "$arquivo" ]; then
  echo "Isso apaga o banco atual da loja e coloca o backup no lugar."
  echo "O site em breve não é mexido."
  echo "Uso: bash /opt/monarca/deploy/restaurar-banco.sh --confirmo /var/backups/monarca/ARQUIVO.dump"
  exit 1
fi

case "$arquivo" in
  *.dump) ;;
  *)
    echo "O arquivo precisa ser um .dump feito pelo backup-banco.sh"
    exit 1
    ;;
esac

cd /opt/monarca
$COMPOSE stop api
$COMPOSE exec -T db psql -U monarca -d postgres -v ON_ERROR_STOP=1 -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'monarca_motos_db' AND pid <> pg_backend_pid();"
$COMPOSE exec -T db dropdb -U monarca --if-exists monarca_motos_db
$COMPOSE exec -T db createdb -U monarca -O monarca monarca_motos_db

set +e
$COMPOSE exec -T db pg_restore -U monarca -d monarca_motos_db --no-owner --no-acl < "$arquivo"
codigo=$?
set -e
if [ "$codigo" -gt 1 ]; then
  echo "A restauração falhou (código $codigo). A API continua parada."
  exit "$codigo"
fi

$COMPOSE up -d api
echo "Banco restaurado a partir de $arquivo"
echo "Espere a API subir e entre de novo no sistema."
