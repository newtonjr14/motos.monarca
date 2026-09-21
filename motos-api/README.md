# motos-api

API Kotlin/Ktor do Monarca Motos.

## Dev

```bash
cp src/main/resources/application.yaml.example src/main/resources/application.yaml
# ajuste database, jwt.secret, system.initialPassword, cors.hosts
./gradlew test
./gradlew run
```

Front (Vite) em `../motos-web` — proxy para `http://localhost:8080`.

## Produção (checklist)

1. **Segredos** — `database.password`, `jwt.secret` (≥32 chars) e `system.initialPassword` fortes; nunca use os valores de exemplo.
2. **Usuário system** — a senha inicial só vale na **primeira** criação. Depois altere em Perfil → senha. Reiniciar a API **não** redefine a senha.
3. **CORS** — liste só as origens do `motos-web` em `cors.hosts` (HTTPS do domínio). Não use `*`.
4. **Seed** — `seed.demo: false`. Sem botão de dados de teste.
5. **HTTPS** — coloque TLS no reverse proxy (nginx/Caddy); a API pode ficar em HTTP na rede interna.
6. **SudTax** — deixe `sudtax.enabled: false` até a integração; quando for, `enabled: true` + `baseUrl` + `apiKey` live.
7. **Backup** — Postgres com backup/restore testado; Flyway sobe migrations no boot.
8. **Smoke** — login → abrir caixa → venda → histórico → contas.

## Health

`GET /health` → `{ "status": "ok", "database": "ok" }` (503 se o banco falhar).
