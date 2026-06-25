<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black" alt="Render" />
</p>

<h1 align="center">IntegraHub</h1>
<p align="center"><strong>Centralized webhook ingestion for app monitoring</strong></p>
<p align="center">
  Receive, transform, and forward webhook events from multiple sources — all through a single endpoint.
  Built with NestJS, powered by Prisma + PostgreSQL, and deployed on Render.
</p>

---

##  Overview

IntegraHub is a lightweight webhook integration service that acts as a central ingestion point for application events. Instead of managing individual webhook configurations per service, IntegraHub provides a unified endpoint that:

1. **Receives** webhook payloads from any source
2. **Transforms** them into a normalized event format
3. **Forwards** them as rich Discord embeds in real-time
4. **Logs** every event to PostgreSQL for audit & analytics

> **Live instance:** [integrahub.onrender.com](https://integrahub.onrender.com)

##  Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ GitHub      │     │              │     │              │     │   Discord    │
│ Sentry      │────▶│  POST /webhook/receive  │────▶│  Rich Embed  │
│ Custom Apps │     │              │     │              │     │              │
│ ...         │     │  IntegraHub  │     │  PostgreSQL  │     │  (Monitoring)│
└─────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                           │                     ▲
                           │                     │
                           ▼                     │
                    ┌──────────────┐            │
                    │   GET /logs  │────────────┘
                    │  GET /stats  │
                    └──────────────┘
                    API Monitoring
```

## ✨ Features

- **Unified Webhook Endpoint** — One URL for all your event sources
- **Smart Payload Transformation** — Auto-normalizes events from different formats (`event`, `type`, `source`, `app`, `message`, `description`)
- **Discord Forwarding** — Rich embed messages with source, timestamp, and summary
- **Persistent Logging** — Every event stored in PostgreSQL for audit trails
- **Monitoring API** — Query logs by status/source, view aggregate statistics
- **Blazing Fast** — Async non-blocking I/O with NestJS + Axios

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [NestJS 11](https://nestjs.com/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Prisma](https://www.prisma.io/) |
| **Adapter** | `@prisma/adapter-pg` (driver-level) |
| **HTTP Client** | [Axios](https://axios-http.com/) |
| **Deployment** | [Render](https://render.com/) |
| **Package Manager** | npm |

##  API Reference

### Receive a Webhook

```http
POST /webhook/receive
```

Accepts any JSON payload. Fields are auto-mapped:

| Payload Field | Mapped To |
|---------------|-----------|
| `event` / `type` | Event name |
| `source` / `app` | Source identifier |
| `message` / `description` | Summary text |

**Example:**

```bash
curl -X POST https://integrahub.onrender.com/webhook/receive \
  -H "Content-Type: application/json" \
  -d '{
    "event": "deploy.completed",
    "source": "github-actions",
    "message": "Production deployment v2.4.1 completed successfully"
  }'
```

**Response:**

```json
{
  "status": "success",
  "event": "deploy.completed",
  "timestamp": "2026-06-25T10:30:00.000Z"
}
```

### Query Logs

```http
GET /webhook/logs?status=success&source=github-actions&limit=20
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `status` | string | — | Filter by status (`success` / `error`) |
| `source` | string | — | Filter by source identifier |
| `limit` | number | `20` | Max results to return |

### View Statistics

```http
GET /webhook/stats
```

Returns aggregate metrics: total events, success/error counts, success rate, and breakdown by source.

##  Quick Start

```bash
# Clone the repository
git clone https://github.com/valfidz/integrahub.git
cd integrahub

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and DISCORD_WEBHOOK_URL

# Run database migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Required Environment Variables

```env
DATABASE_URL=postgresql://user:password@host:5432/integrahub
DIRECT_URL=postgresql://user:password@host:5432/integrahub
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
PORT=3000
```

##  Project Structure

```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root module (Config + Webhook + Prisma)
├── prisma/
│   ├── prisma.module.ts         # Global Prisma provider
│   └── prisma.service.ts        # Prisma client (pg adapter)
├── webhook/
│   ├── webhook.module.ts        # Webhook feature module
│   ├── webhook.controller.ts    # POST /receive, GET /logs, GET /stats
│   ├── webhook.service.ts       # Business logic (handle, forward, log)
│   ├── webhook.transformer.ts   # Payload normalization
│   └── discord.forwarder.ts     # Discord webhook client
prisma/
└── schema.prisma                # Database schema (integration_logs)
```

##  Database Schema

```prisma
model integrationLog {
  id        String   @id @default(uuid())
  event     String
  source    String
  summary   String
  status    String       // "success" | "error"
  errorMsg  String?
  rawPayload Json
  createdAt DateTime @default(now())

  @@map("integration_logs")
}
```

Every incoming webhook is stored with its original payload intact — no data loss.

##  Testing

```bash
# Unit tests
npm run test

# Test with coverage
npm run test:cov
```

##  License

[MIT](LICENSE)

---

<p align="center">
  <a href="https://github.com/valfidz/integrahub">GitHub</a>
  ·
  <a href="https://integrahub.onrender.com">Live Demo</a>
</p>
