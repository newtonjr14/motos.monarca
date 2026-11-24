#!/bin/bash
# Copia o banco da loja para um arquivo compactado.
# Não para a loja e não mexe no site em breve.
# Guarda só as 3 cópias mais novas em /var/backups/monarca.
set -euo pipefail

DIR=/var/backups/monarca
MANTER=3
COMPOSE="docker compose -f /opt/monarca/deploy/docker-compose.yml"

if [ "$(id -u)" -ne 0 ]; then
  echo "Rode como root, no servidor."
  exit 1
fi

if [ "${1:-}" = "--instalar" ]; then
  linha="0 4 * * * /bin/bash /opt/monarca/deploy/backup-banco.sh >> /var/log/monarca-backup.log 2>&1"
  (crontab -l 2>/dev/null | grep -v 'deploy/backup-banco.sh' || true; echo "$linha") | crontab -
  echo "Backup automático ligado: todo dia às 4h, no relógio do servidor."
  echo "Confira o relógio com: date"
  echo "Se o relógio estiver em UTC, 4h lá é meia-noite no Paraguai. Troque o 4 se quiser outro horário."
  exit 0
fi

mkdir -p "$DIR"
chmod 700 "$DIR"

livre=$(df -BM / | awk 'NR==2 { gsub(/M/, "", $4); print $4 }')
if [ "${livre:-0}" -lt 500 ]; then
  echo "Menos de 500 MB livres no disco. Backup cancelado para não encher o servidor."
  exit 1
fi

arquivo="$DIR/monarca-motos-$(date +%Y-%m-%d_%H%M).dump"
if ! $COMPOSE exec -T db pg_dump -U monarca -d monarca_motos_db -Fc --no-owner --no-acl > "$arquivo"; then
  rm -f "$arquivo"
  echo "O backup falhou. Nenhum arquivo foi guardado."
  exit 1
fi
chmod 600 "$arquivo"

if [ ! -s "$arquivo" ]; then
  rm -f "$arquivo"
  echo "O backup saiu vazio. Nada foi apagado."
  exit 1
fi

mapfile -t todos < <(ls -1t "$DIR"/monarca-motos-*.dump)
if [ "${#todos[@]}" -gt "$MANTER" ]; then
  for velho in "${todos[@]:$MANTER}"; do
    rm -f "$velho"
    echo "Apaguei a cópia antiga: $velho"
  done
fi

echo "Backup pronto: $arquivo"
du -h "$arquivo"
echo "Cópias neste servidor (no máximo $MANTER):"
ls -lh "$DIR"/monarca-motos-*.dump
