#!/bin/bash
set -euo pipefail
if [ "${1:-}" != "--confirmo" ]; then
  echo "Isso apaga só o banco da loja. O site em breve não é mexido."
  echo "Antes, em deploy/application.yaml, deixe seed.demo: false"
  echo "Depois rode: bash /opt/monarca/deploy/zerar-banco.sh --confirmo"
  exit 1
fi
cd /opt/monarca
docker compose -f deploy/docker-compose.yml stop api
docker compose -f deploy/docker-compose.yml rm -sf db api
docker volume rm monarca_pgdata
docker compose -f deploy/docker-compose.yml up -d
echo "Banco novo, vazio de vendas. Espere a API terminar de subir."
