<p align="center">
  <img src="./public/icon.svg" alt="Dokit Logo" width="80" height="80" />
</p>

<h1 align="center">Dokit</h1>

<p align="center">
  <strong>Cloud-native collaborative development workspace</strong>
</p>

<p align="center">
  <a href="https://dokit.cloud">Live Demo</a> •
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="./docs/SETUP.md">Setup Guide</a>
</p>

---

## Overview

Dokit is a production-ready, cloud-native development workspace engineered for real-time collaboration. It eliminates the friction between local development and cloud convenience by providing isolated, containerized environments accessible directly from your browser.

Built with a Next.js frontend, Express backend, Docker-managed runtimes, and bidirectional object storage synchronization, Dokit enables teams to code together in real-time with zero configuration.

---

## Features

### Cloud Virtualization
Programmatic provisioning, management, and teardown of isolated Linux environments via the Docker Engine API. Each workspace runs in its own secure container with full filesystem access and terminal capabilities.

### Real-Time Collaboration
Conflict-free concurrent editing powered by **Yjs CRDTs** and **CodeMirror 6**. Multiple developers can edit the same file simultaneously with:
- Live cursors showing collaborator positions
- File-wise and global presence tracking
- Multiplayer synchronization over WebSockets
- Instant conflict resolution

### Authentication & Security
Enterprise-grade security infrastructure including:
- **JWT-based Session Management** — Short-lived access tokens with securely rotating refresh tokens
- **Remote Session Revocation** — Invalidate sessions across all devices instantly
- **Two-Factor Authentication (2FA)** — TOTP-based verification with AES-encrypted secrets and backup recovery codes
- **Sign-in Email Notifications** — Optional alerts for new device logins

### Advanced Container Sandboxing
Defense-in-depth container security:
- Root privilege step-down to restricted `dokituser` via **gosu**
- Granular **Role-Based Access Control (RBAC)** for project collaborators
- READ/WRITE permission levels for fine-grained access management

### Bidirectional File Synchronization
Real-time mirroring between container filesystem and frontend:
- Linux **inotify** watchers detect container-side changes
- **Socket.IO** pushes updates to all connected clients instantly
- Persistent state backups to **Cloudflare R2** managed by **BullMQ** job queues
- Automatic workspace restoration on container restart

### GitHub Integration
End-to-end pipeline for repository imports:
- Clone any public GitHub repository with one click
- Automatic provisioning into fully interactive containerized environments
- Preserves project structure and dependencies

### Dynamic Environment Provisioning
On-the-fly workspace customization:
- Install backend runtimes: **Python**, **Go**, **Rust**, **Java**
- Add terminal utilities and development tools seamlessly
- Per-project tool persistence

### Project Templates
Pre-configured starter environments:
- **Node.js** — Modern JavaScript/TypeScript runtime
- **React + Vite** — Fast React development with HMR
- **Express** — Backend API development
- **Blank** — Empty canvas for custom setups

### Dynamic Proxy & Access Control
Intelligent request routing via **Nginx** reverse proxy:
- Wildcard DNS (**nip.io**) for dynamic subdomain routing
- WebSocket terminal session proxying
- HTTP preview traffic routing with live reload
- Internal authorization sub-requests for secure access

### API Security
Production-hardened backend infrastructure:
- **Redis-based sliding-window rate limiter** — IP-based request throttling
- **Zod validation** — Strict payload validation on all endpoints
- **GeoIP tracking** — Session location awareness via MaxMind

### Project Visibility & Sharing
Flexible access control for projects:
- **Private** — Owner and invited collaborators only
- **Public** — Viewable by anyone, editable by collaborators
- **Password Protection** — Additional layer for sensitive projects
- **Access Requests** — Users can request access to private projects

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENTS                                    │
│                    (Browsers / WebSocket Connections)                   │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          NGINX REVERSE PROXY                            │
│              (SSL Termination, Wildcard DNS, Auth Sub-requests)         │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Express API   │    │  Socket.IO Hub  │    │  Yjs WebSocket  │
│   (REST + Auth) │    │  (File Events)  │    │  (Collaboration)│
└────────┬────────┘    └────────┬────────┘    └────────┬────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │     Redis       │    │  Cloudflare R2  │
│   (Prisma ORM)  │    │  (Cache/Queue)  │    │ (Object Storage)│
└─────────────────┘    └────────┬────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │     BullMQ      │
                       │ (Job Processing)│
                       └────────┬────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         DOCKER ENGINE                                   │
│                    (Container Orchestration)                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ Workspace 1 │  │ Workspace 2 │  │ Workspace 3 │  │     ...     │    │
│  │  (Node.js)  │  │   (React)   │  │  (Express)  │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema

Prisma data model managing users, sessions, projects, collaborators, and access requests.

![Dokit Database Schema](./docs/diagrams/dokit_database_schema.png)

<details>
<summary>View Schema Details</summary>

| Model | Description |
|-------|-------------|
| **User** | User accounts with 2FA support, backup codes, and session management |
| **Session** | Active sessions with device info, geolocation, and refresh tokens |
| **Project** | Workspaces with visibility settings, stack type, and installed tools |
| **ProjectCollaborator** | Many-to-many relationship with READ/WRITE access levels |
| **AccessRequest** | Pending/approved/rejected access requests for private projects |

</details>

### Real-Time Collaboration Flow

Bidirectional synchronization across editors and container filesystem changes, including Yjs room updates and Socket.IO file tree events.

![Dokit Realtime Sync Flow](./docs/diagrams/dokit_realtime_sync_flow.png)

---

## Tech Stack

### Frontend

| Technology | Purpose |
|------------|---------|
| **Next.js 16** | React framework with App Router and Turbopack |
| **TypeScript** | Type-safe development |
| **Redux Toolkit** | Global state management with persistence |
| **CodeMirror 6** | Extensible code editor with syntax highlighting |
| **Yjs** | CRDT-based real-time collaboration |
| **xterm.js** | Terminal emulator in the browser |
| **Socket.IO Client** | Real-time bidirectional communication |
| **Tailwind CSS 4** | Utility-first styling |
| **Radix UI** | Accessible component primitives |
| **Lucide Icons** | Beautiful icon library |

### Backend

| Technology | Purpose |
|------------|---------|
| **Node.js** | JavaScript runtime |
| **Express 5** | Web framework for REST API |
| **Prisma ORM** | Type-safe database client |
| **Socket.IO** | Real-time event broadcasting |
| **y-websocket** | Yjs WebSocket provider |
| **Zod** | Runtime schema validation |
| **Argon2** | Password hashing |
| **JWT** | Token-based authentication |
| **otplib** | TOTP 2FA implementation |
| **Pino** | High-performance logging |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| **Docker Engine API** | Container orchestration |
| **Nginx** | Reverse proxy with wildcard DNS |
| **PostgreSQL** | Primary database |
| **Redis** | Caching, rate limiting, pub/sub |
| **BullMQ** | Job queue for async tasks |
| **Cloudflare R2** | S3-compatible object storage |
| **Rclone** | Cloud storage synchronization |
| **MaxMind GeoIP** | IP geolocation for sessions |

---

## Project Structure

```
dokit/
├── client/                    # Next.js frontend application
│   ├── app/                   # App Router pages and layouts
│   │   ├── (guestRoutes)/     # Public routes (signin, signup, etc.)
│   │   ├── (protectedRoutes)/ # Authenticated routes (dashboard, editor)
│   │   └── ...                # Static pages (about, features, etc.)
│   ├── components/            # React components
│   │   ├── ui/                # Reusable UI primitives
│   │   └── ...                # Feature components
│   ├── hooks/                 # Custom React hooks
│   ├── store/                 # Redux slices and store config
│   ├── utils/                 # Helper functions
│   └── types/                 # TypeScript type definitions
│
├── server/                    # Express backend application
│   ├── src/
│   │   ├── config/            # Environment and app configuration
│   │   ├── db/                # Prisma client initialization
│   │   ├── generated/         # Prisma generated client
│   │   ├── middlewares/       # Express middleware (auth, rate limit)
│   │   ├── modules/           # Feature modules (auth, projects, etc.)
│   │   ├── sockets/           # Socket.IO and Yjs handlers
│   │   └── utils/             # Server utilities
│   ├── prisma/                # Database schema and migrations
│   └── scripts/               # Deployment and setup scripts
│
├── docs/                      # Documentation
│   ├── diagrams/              # Architecture diagrams (Excalidraw + PNG)
│   └── SETUP.md               # Setup and deployment guide
│
└── README.md                  # This file
```

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Create new account |
| `POST` | `/api/auth/signin` | Authenticate user |
| `POST` | `/api/auth/signout` | End current session |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `POST` | `/api/auth/2fa/setup` | Initialize 2FA |
| `POST` | `/api/auth/2fa/verify` | Verify 2FA code |
| `GET`  | `/api/auth/sessions` | List active sessions |
| `DELETE` | `/api/auth/sessions/:id` | Revoke specific session |

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects` | List user's projects |
| `POST` | `/api/projects` | Create new project |
| `GET` | `/api/projects/:id` | Get project details |
| `PATCH` | `/api/projects/:id` | Update project settings |
| `DELETE` | `/api/projects/:id` | Delete project |
| `POST` | `/api/projects/github` | Import from GitHub |

### Collaboration

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/projects/:id/collaborators` | List collaborators |
| `POST` | `/api/projects/:id/collaborators` | Add collaborator |
| `PATCH` | `/api/projects/:id/collaborators/:userId` | Update access level |
| `DELETE` | `/api/projects/:id/collaborators/:userId` | Remove collaborator |
| `POST` | `/api/projects/:id/access-request` | Request access |
| `PATCH` | `/api/access-requests/:id` | Approve/reject request |

### Container Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/containers/:projectId/start` | Start workspace |
| `POST` | `/api/containers/:projectId/stop` | Stop workspace |
| `GET` | `/api/containers/:projectId/status` | Check container status |
| `POST` | `/api/containers/:projectId/tools` | Install runtime/tool |

---

## WebSocket Events

### File Tree Events (Socket.IO)

| Event | Direction | Description |
|-------|-----------|-------------|
| `file:created` | Server → Client | New file/folder created |
| `file:deleted` | Server → Client | File/folder deleted |
| `file:renamed` | Server → Client | File/folder renamed |
| `file:content` | Server → Client | File content changed |
| `tree:sync` | Server → Client | Full tree synchronization |

### Collaboration Events (Yjs)

| Event | Direction | Description |
|-------|-----------|-------------|
| `awareness:update` | Bidirectional | Cursor position, selection, user info |
| `sync:step1` | Client → Server | Initial sync request |
| `sync:step2` | Server → Client | Document state response |
| `update` | Bidirectional | Document mutations |

---

## Security Considerations

### Authentication
- Passwords hashed with **Argon2id** (memory-hard algorithm)
- Access tokens expire in 15 minutes
- Refresh tokens rotate on each use
- Session binding to device fingerprint

### Container Isolation
- Non-root user execution inside containers
- Resource limits (CPU, memory, disk)
- Network isolation between workspaces
- Read-only base filesystem with writable workspace overlay

### API Protection
- Rate limiting: 100 requests/minute per IP
- Request body size limits
- Strict CORS configuration
- Input validation on all endpoints

---

## Contributing

Contributions are welcome! Please read the setup guide in `docs/SETUP.md` before getting started.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Om005">Om</a>
</p>
