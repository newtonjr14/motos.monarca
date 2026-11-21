#!/bin/bash
set -euo pipefail
cd /opt/monarca
git pull
docker compose -f deploy/docker-compose.yml up -d --build
rm -rf /var/www/mobilidadeeletrica
mkdir -p /var/www/mobilidadeeletrica
docker build -o type=local,dest=/var/www/mobilidadeeletrica /opt/monarca/motos-web
nginx -t
systemctl reload nginx
echo "Atualizado. A API pode levar um minuto na primeira subida."
