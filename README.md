# 🐳 Dokit | Containerized Real-Time Web IDE

![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io)

**Dokit** is a browser-based collaborative development environment. Moving beyond standard CRUD applications, Dokit acts as a full-fledged Remote Development Platform. It leverages local Docker orchestration to provide developers with isolated Node.js workspaces, bidirectional file synchronization, dynamic web previews, and real-time multiplayer code editing.

---

## ✨ System Highlights

### 🚀 Container Orchestration & Isolation
* **Dynamic Provisioning**: Interacts directly with the Docker Engine API to programmatically spawn, pause, and teardown isolated containers for every unique project.
* **Persistent Workspaces**: Mounts local volumes synced with **Cloudflare R2** to ensure container state is saved and restored seamlessly across sessions.

<!-- work in progress -->
<!-- * **Secure Environments**: Drops root privileges inside the container (`runner` user) to prevent breakouts and secure the host infrastructure. -->

### 🌐 Advanced Networking & Reverse Proxying
* **Wildcard DNS Routing**: Utilizes `nip.io` combined with a custom **Nginx** reverse proxy to route traffic directly to dynamically assigned Docker container ports without polluting browser history.
* **Multi-Protocol Support**: Seamlessly proxies both standard HTTP requests (for live web previews) and upgraded WebSocket connections (for interactive terminal sessions via `ttyd`/`xterm.js`).

### ⚡ Real-Time Collaboration & Synchronization
* **Yjs & CRDTs**: Implements Conflict-Free Replicated Data Types to ensure multiple users can edit the exact same file in CodeMirror simultaneously without race conditions.
* **OS-Level Event Watching**: Uses Linux `inotify` watchers on the backend to capture atomic file system changes (like `npm install` modifying `package.json`) and instantly broadcast them to the UI via **Socket.IO**.

### 🛡️ Security
* **Custom Rate Limiter**: Built a highly optimized sliding-window rate limiter using **Redis** to prevent DDoS attacks and API abuse.
* **Dual-Token Auth Flow**: Secures endpoints with short-lived access JWTs (15 mins) and rotating refresh JWTs (30 days), preventing session hijacking.
* **Strict Data Validation**: Enforces rigorous request payload parsing and sanitization using **Zod**.

---

## 🏗️ Architecture Deep Dives

### 1. The Synchronization Pipeline
Keeping a web browser, R2 storage, and a Linux container filesystem perfectly in sync requires a bidirectional pipeline:
* **Browser ➔ Container**: User types in the CodeMirror editor -> Yjs merges the state -> Sent via Socket.IO -> Backend writes to the Docker volume.
* **Container ➔ Browser**: Terminal command modifies a file (e.g., `touch index.js`) -> Linux `inotify` catches the file event -> Backend reads the diff -> Broadcasts via Socket.IO -> Yjs updates the CodeMirror UI.
* **Container ➔ R2 Storage**: Fixed time intervals or container teardown events trigger a backup -> Backend utilizes **rclone** to perform a differential file sync of the local Docker volume, filtering out heavy dependencies (e.g., `node_modules`, build caches) -> **BullMQ** (`syncToR2Queue`) offloads the network transfer -> The optimized workspace state is efficiently persisted to **Cloudflare R2**.

<!-- work in progress -->
<!-- ### 2. The Collaboration Access Module
Dokit features a robust Role-Based Access Control (RBAC) system managed via **Prisma** and **PostgreSQL**:
* **Direct Invitations**: Project owners can securely invite registered users via email, instantly bypassing request queues using atomic database transactions.
* **Request Workflows**: Unauthenticated or unauthorized users can submit an `AccessRequest`. Owners can review, approve, or reject these requests through a dedicated UI, with database triggers automatically managing unique constraints. -->

### 2. Background Job Processing
To maintain API response times on the main Node.js thread, Dokit offloads heavy operations to **BullMQ** background workers backed by Redis:
* `emailQueue`: Offloads transactional email delivery via SendGrid, for account creation OTPs, password resets, and welcome emails. 
<!-- work in progress -->
<!-- project invitations, and access request updates emails. -->

* `syncToR2Queue`: Offloads the rclone synchronization of Docker volumes to Cloudflare R2, ensuring only changed files are uploaded while ignoring heavy caches.
* `cleanContainersQueue`: Identifies and terminates idle or maximum-TTL containers, ensuring a final state sync to R2 storage is completed before cleanup.
* `deleteProjectQueue`: Handles cascading teardowns of containers, volumes, and records in R2 storage.

---

## 💻 Technology Stack

### Frontend
* **Framework**: Next.js, TypeScript
* **State Management**: Redux Toolkit
* **Editor & Sync**: CodeMirror, Yjs
* **Styling**: Tailwind CSS

### Backend
* **Runtime**: Node.js, Express.js
* **Database**: PostgreSQL (Prisma ORM)
* **Real-Time**: Socket.IO, WebSockets
* **Validation & Auth**: Zod, JSON Web Tokens

### Infrastructure & DevOps
* **Orchestration**: Docker Engine API
* **Proxy & Routing**: Nginx
* **Caching & Queues**: Redis, BullMQ
* **Cloud Storage**: Cloudflare R2

---

## 👨‍💻 Author

**Om Chavda**
* GitHub: [@Om005](https://github.com/Om005)
* LinkedIn: [Om Chavda](http://linkedin.com/in/om-chavda-06a390302/)