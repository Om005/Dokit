# Dokit Local Setup Guide

This guide covers everything needed to run Dokit locally (client + server + Docker services) in development mode.

---

## Prerequisites

Ensure the following are installed on your system:

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20+ | Required for both client and server |
| pnpm | 10+ | Package manager |
| Docker Desktop | Latest | Must be running |
| Git | Latest | Version control |


---

## Port Reference

The following ports are used by Dokit services:

| Port | Service | Description |
|------|---------|-------------|
| `80` | Nginx | Reverse proxy for container previews |
| `3000` | Next.js | Frontend client |
| `4000` | Express | Backend API + WebSocket server |
| `5432` | PostgreSQL | Primary database |
| `6379` | Redis | Caching and pub/sub |
| `5050` | pgAdmin | Database administration UI |

Ensure these ports are available before starting the application.

---

## Installation

Clone the repository and install dependencies:

```bash
# Clone the repository
git clone https://github.com/Om005/Dokit.git
cd Dokit

# Install root dependencies
pnpm install

# Install server dependencies
pnpm --dir server install

# Install client dependencies
pnpm --dir client install
```

---

## Docker Network Setup

Dokit requires an external Docker network for container communication.

```bash
docker network create dokit-network
docker network create dokit-project-network
```

> If the network already exists, Docker will display an "already exists" message. This is expected and safe to ignore.

---

## Building Docker Images

Dokit uses custom Docker images for sandboxed environments. These must be built locally before running the application.

### Automated Build (Recommended)

```bash
pnpm --dir server run script:images
```

### Manual Build (If bash is unavailable)

If you're on Windows without bash access, build each image manually from the `server/` directory:

```bash
cd server

# Build all required images
docker build -t dokit-node:latest ./docker/node/
docker build -t dokit-express:latest ./docker/express/
docker build -t dokit-react_vite:latest ./docker/react_vite/
docker build -t dokit-nginx:latest ./docker/nginx/
docker build -t dokit-github:latest ./docker/github/
docker build -t dokit-blank:latest ./docker/blank/
```

### Available Template Images

| Image | Description |
|-------|-------------|
| `dokit-node` | Node.js runtime environment |
| `dokit-express` | Express.js backend template |
| `dokit-react_vite` | React + Vite frontend template |
| `dokit-nginx` | Nginx reverse proxy |
| `dokit-github` | GitHub repository import handler |
| `dokit-blank` | Empty starter environment |

---

## Environment Configuration

Dokit requires environment files for both client and server. The server uses different env files based on the run mode.

### Important Notes

- Server dev mode (`pnpm --dir server dev`) loads `server/.env.development`
- Server prod mode (`pnpm --dir server start`) loads `server/.env.production`
- Server validates environment strictly at startup
- `REDIS_LOCAL` and `IS_PRODUCTION` must be numeric (`0` or `1`), **not** `true`/`false`

---

### Client Environment

Create `client/.env`:

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# Nginx host for container previews
NEXT_PUBLIC_NGINX_HOST=localhost:8080

# WebSocket URLs
NEXT_PUBLIC_EDITOR_SOCKET_URL=ws://localhost:4000
NEXT_PUBLIC_PROJECT_SOCKET_URL=http://localhost:4000

# To receive messages
NEXT_PUBLIC_FORM_ACCESS_KEY=<your-web-form-access-key>
```

---

### Server Development Environment

Create `server/.env.development` with all required variables:

```env
# Server Configuration
PORT=4000
FRONTEND_URL=http://localhost:3000
IS_PRODUCTION=0

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb?schema=public

# Redis Configuration
REDIS_USERNAME=default
REDIS_PASSWORD=your-redis-password
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_LOCAL=1

# Authentication & Security
JWT_SECRET=your-jwt-secret-key
TWO_FACTOR_ENCRYPTION_KEY=your-32-character-encryption-key

# Email Service (Brevo)
BREVO_API_KEY=your-brevo-api-key
SENDER_EMAIL=your-sender-email

# GeoIP (MaxMind)
MAXMIND_LICENSE_KEY=your-maxmind-license-key

# Cloudflare R2 Storage
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=projects

# Nginx Configuration
NGINX_HOST=localhost:80
```

---

## Nginx Configuration

Go to docker-compose.yaml and change 2 environment variables for dokit-nginx to 
```
- DOMAIN=localhost
- DOMAIN_ESCAPED=[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+\.nip\.io
```

### Configuration File Location

```
server/docker-compose.yaml
```

Ensure your `client/.env` and `server/.env.development` host values align with your Nginx configuration.

---

## Starting Infrastructure Services

Start the Docker infrastructure (PostgreSQL, Redis, pgAdmin, Nginx):

```bash
# From project root
pnpm run docker:up
```

### Services Started

| Service | URL | Credentials |
|---------|-----|-------------|
| PostgreSQL | `localhost:5432` | `postgres:postgres` |
| Redis | `localhost:6379` | - |
| pgAdmin | `http://localhost:5050` | `admin@admin.com` / `admin` |
| Nginx | `http://localhost:80` | - |

---

## Database Migration

After PostgreSQL is running, apply the Prisma migrations:

```bash
pnpm --dir server run prisma:migrate
```

This creates all necessary database tables and relationships.

### Additional Prisma Commands

```bash
# Generate Prisma client
pnpm --dir server run prisma:generate
```

### GeoIP Database Refresh

Update the MaxMind GeoIP database (requires valid license key):

```bash
pnpm --dir server run script:geoip:dev
```

### Upload Base Templates

Upload starter templates to R2 storage:

```bash
pnpm --dir server run script:templates:dev
```

---

## Running the Application

### Single Command (Recommended)

```bash
# From project root - starts both client and server
pnpm run dev
```

### Manual Start (Separate Terminals)

**Terminal 1 - Server:**
```bash
pnpm --dir server run dev
```

**Terminal 2 - Client:**
```bash
pnpm --dir client run dev
```

---

## Verification

After starting all services, verify the setup:

| Service | URL | Expected Result |
|---------|-----|-----------------|
| Client | http://localhost:3000 | Dokit homepage |
| Server Health | http://localhost:4000/health | Health check response |
| pgAdmin | http://localhost:5050 | Database UI |

### pgAdmin Login

- **Email**: `admin@admin.com`
- **Password**: `admin`

### Testing Container Creation

1. Register/login to Dokit
2. Create a new project
3. Select a template (e.g., React + Vite)
4. Verify the container starts and the editor loads

---

## Optional Scripts

### Build Production Assets

```bash
# Build client
pnpm --dir client run build

# Build server
pnpm --dir server run build
```

---

## Troubleshooting

### Network Not Found

```
network dokit-network declared as external, but could not be found
```

**Solution**: Create the Docker network:
```bash
docker network create dokit-network
```

---

### Image Pull Access Denied

```
pull access denied for dokit-nginx
```

**Solution**: Build the Docker images locally:
```bash
pnpm --dir server run script:images
```

---

### Environment File Not Found

```
Environment file .env.development not found
```

**Solution**: Create the `server/.env.development` file with all required variables (see [Server Development Environment](#server-development-environment)).

---

### Invalid Environment Configuration

```
Invalid environment configuration
```

**Solution**:
1. Verify all required environment variables are present and non-empty
2. Ensure `REDIS_LOCAL` and `IS_PRODUCTION` are `0` or `1` (not `true`/`false`)

---

### Port Already in Use

```
Error: listen EADDRINUSE :::4000
```

**Solution**: Kill the process using the port:
```bash
# Find process
lsof -i :4000

# Kill process
kill -9 <PID>
```

---

### Docker Containers Not Starting

**Solution**:
1. Ensure Docker Desktop is running
2. Check Docker logs: `docker logs <container-name>`
3. Restart Docker: `docker-compose down && docker-compose up -d`

---

### Database Connection Failed

**Solution**:
1. Verify PostgreSQL is running: `docker ps | grep postgres`
2. Check the `DATABASE_URL` format
3. Ensure port 5432 is accessible

---

## Stopping Services

### Stop All Services

```bash
# From project root
pnpm run down
```

### Stop Individual Services

```bash
# Stop only Docker containers
docker-compose down

# Stop with volume cleanup (removes data)
docker-compose down -v
```

---

## Next Steps

- Read the [README](../README.md) for project overview and features
- Check [Contributing Guidelines](../README.md#contributing) to contribute
