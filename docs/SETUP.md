# Dokit Local Setup Guide

This guide covers everything needed to run Dokit locally (client + server + Docker services) in development mode.

## 1. Prerequisites

Install these first:

- Node.js 20+
- pnpm 10+
- Docker Desktop (running)
- Git
- Bash shell on Windows (Git Bash or WSL), because some server scripts call `bash`

Ports used locally:

- 80 (Nginx)
- 3000 (Next.js client)
- 4000 (Express + Socket server)
- 5432 (PostgreSQL)
- 6379 (Redis)
- 5050 (pgAdmin)

## 2. Install Dependencies

From project root:

```bash
pnpm install
pnpm --dir server install
pnpm --dir client install
```

## 3. Create Docker Network (Required)

The compose file expects an external Docker network named `dokit-network`.

```bash
docker network create dokit-network
```

If it already exists, Docker will print an "already exists" message. That is fine.

## 4. Build Required Docker Images (Required)

This project relies on local images like `dokit-nginx`, `dokit-node`, `dokit-react_vite`, etc.

Run:

```bash
pnpm --dir server run script:images
```

If `bash` is unavailable on Windows, run these manually from `server/`:

```bash
docker build -t dokit-node:latest ./docker/node/
docker build -t dokit-express:latest ./docker/express/
docker build -t dokit-react_vite:latest ./docker/react_vite/
docker build -t dokit-nginx:latest ./docker/nginx/
docker build -t dokit-github:latest ./docker/github/
docker build -t dokit-blank:latest ./docker/blank/
```

## 5. Environment Files

These environment files are currently present:

- `client/.env`
- `server/.env.development`

Important behavior:

- Server dev mode (`pnpm --dir server dev`) loads `server/.env.development`
- Server prod start (`pnpm --dir server start`) loads `server/.env.production`
- Server validates env strictly at startup
- `REDIS_LOCAL` and `IS_PRODUCTION` must be numeric (`0` or `1`), not `true`/`false`

### 5.1 Client Env Variables (`client/.env`)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_NGINX_HOST=localhost:80
NEXT_PUBLIC_EDITOR_SOCKET_URL=ws://localhost:4000
NEXT_PUBLIC_PROJECT_SOCKET_URL=http://localhost:4000
```


### 5.2 Server Development Env Variables (`server/.env.development`)

All required keys (based on server validation schema):

```env
PORT=4000
FRONTEND_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb?schema=public

REDIS_USERNAME=default
REDIS_PASSWORD=<your-existing-local-secret>
REDIS_HOST=<your-existing-local-redis-host>
REDIS_PORT=6379
REDIS_LOCAL=1

IS_PRODUCTION=0

BREVO_API_KEY=<your-existing-local-secret>
SENDER_EMAIL=<your-existing-local-sender-email>
MAXMIND_LICENSE_KEY=<your-existing-local-secret>
JWT_SECRET=<your-existing-local-secret>

R2_ENDPOINT=<your-existing-local-r2-endpoint>
R2_ACCOUNT_ID=<your-existing-local-r2-account-id>
R2_ACCESS_KEY_ID=<your-existing-local-r2-access-key-id>
R2_SECRET_ACCESS_KEY=<your-existing-local-r2-secret>
R2_BUCKET_NAME=projects

TWO_FACTOR_ENCRYPTION_KEY=<your-existing-local-secret>

NGINX_HOST=localhost:80
```

Notes:

- With `REDIS_LOCAL=1`, app code uses local Redis client connection; the hosted Redis values are still validated, so they must stay non-empty.

### 5.3 Server Production Env Variables (`server/.env.production`)

This file currently contains only a partial set:

## 6. Host/IP Alignment for Nginx (Important)

The current `server/docker/nginx/nginx.conf` contains hardcoded backend auth proxy targets using `localhost:4000`.

update these entries to your host-reachable backend address:

- `/api/project/access/verify-terminal`
- `/api/project/access/preview-auth`
- `/api/project/access/verify-preview`

You can use either:

- your machine IP (same pattern as current setup), or
- localhost:4000

Also keep `client/.env` and `server/.env.development` aligned with the host you actually use.

## 7. Start Infrastructure Services

From project root:

```bash
pnpm run docker:up
```

This starts:

- Postgres (`localhost:5432`)
- pgAdmin (`localhost:5050`)
- Redis (`localhost:6379`)
- dokit-nginx (`localhost:80`)

## 8. Run Prisma Migration

After Postgres is up:

```bash
pnpm --dir server run prisma:migrate
```

## 9. Start App in Development

From project root (single command):

```bash
pnpm run dev
```

Or manually in two terminals:

```bash
pnpm --dir server run dev
```

```bash
pnpm --dir client run dev
```

## 10. Verify It Works

- Client: `http://localhost:3000`
- Nginx health: `http://localhost/health`
- pgAdmin: `http://localhost:5050`
  - email: `admin@admin.com`
  - password: `admin`

## 11. Optional Scripts

GeoIP database refresh (requires valid MaxMind key):

```bash
pnpm --dir server run script:geoip:dev
```

Upload base templates to R2:

```bash
pnpm --dir server run script:templates:dev
```

## 12. Common Issues

`network dokit-network declared as external, but could not be found`

- Run `docker network create dokit-network`.

`pull access denied for dokit-nginx` (or other `dokit-*` images)

- Build images with `pnpm --dir server run script:images`.

`Environment file .env.development not found`

- Ensure `server/.env.development` exists.

`Invalid environment configuration`

- Confirm all required server keys exist and are non-empty.
- Confirm `REDIS_LOCAL` and `IS_PRODUCTION` are `0` or `1`.

Preview or terminal auth/proxy not working

- Recheck hardcoded host in `server/docker/nginx/nginx.conf` and env host/IP values.

## 13. Stop Services

From project root:

```bash
pnpm run down
```
