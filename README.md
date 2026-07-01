<p align="center">
  <img src="https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs&logoColor=white" alt="NestJS 11" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma_7-2D3748?logo=prisma&logoColor=white" alt="Prisma 7" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Render-46E3B7?logo=render&logoColor=black" alt="Render" />
</p>

<h1 align="center">IntegraHub</h1>
<p align="center"><strong>Centralized webhook ingestion for app monitoring</strong></p>
<p align="center">
  Receive, transform, and forward webhook events from multiple sources — all through a single endpoint.
  Built with NestJS 11, powered by Prisma 7 + PostgreSQL, and deployed on Render.
</p>

---

##  Overview

IntegraHub is a lightweight webhook integration service that acts as a central ingestion point for application events. Instead of managing individual webhook configurations per service, IntegraHub provides a unified endpoint that:

1. **Receives** webhook payloads from any source
2. **Transforms** them into a normalized event format
3. **Forwards** them as rich Discord embeds in real-time
4. **Logs** every event to PostgreSQL for audit & analytics

> **Live instance:** [integrahub.onrender.com](https://integrahub.onrender.com)
>
> **Frontend dashboard:** [val-integrahub.netlify.app](https://val-integrahub.netlify.app) — [GitHub](https://github.com/valfidz/integrahub-dashboard)

##  Architecture

```text
┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Shopify     │     │              │     │              │     │   Discord    │
│ Stripe      │────▶│  POST /webhook/receive  │────▶│  Rich Embed  │
│ Auth0       │     │              │     │              │     │              │
│ Custom Apps │     │  IntegraHub  │     │  PostgreSQL  │     │  (Monitoring)│
│ ...         │     │  (NestJS)    │     │  (Audit)     │     └──────────────┘
└─────────────┘     └──────────────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  Monitoring  │
                    │  API Layer   │
                    │              │
                    │ GET /logs    │
                    │ GET /stats   │
                    │ GET /timeseries
                    └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  IntegraHub  │
                    │  Dashboard   │
                    │  (Next.js)   │
                    └──────────────┘
```

## ✨ Features

- **Unified Webhook Endpoint** — One URL for all your event sources
- **Smart Payload Transformation** — Auto-normalizes events from different formats (`event`/`type`, `source`/`app`, `message`/`description`)
- **Discord Forwarding** — Rich embed messages with source, timestamp, and summary
- **Persistent Logging** — Every event stored in PostgreSQL for audit trails
- **Monitoring API** — Query logs by status/source, view aggregate statistics, and get time-series data for charts
- **CORS-enabled** — Pre-configured for local dashboard (port 3001) and remote frontend (via `FRONTEND_URL` env var)
- **Blazing Fast** — Async non-blocking I/O with NestJS + Axios

##  Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [NestJS 11](https://nestjs.com/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) via [Prisma 7](https://www.prisma.io/) |
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

| Payload Field | Also Accepted | Mapped To |
|---------------|---------------|-----------|
| `event` | `type` | Event name |
| `source` | `app` | Source identifier |
| `message` | `description` | Summary text |

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

**Error response (Discord forward failure):**

```json
{
  "status": "error",
  "message": "Request failed with status code 429"
}
```

### Query Logs

```http
GET /webhook/logs?status=success&source=github-actions&limit=20
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `status` | string | — | Filter by status (`success` / `error`) |
| `source` | string | — | Filter by source identifier (case-insensitive partial match) |
| `limit` | number | `20` | Max results to return |

**Response:**

```json
{
  "total": 42,
  "count": 20,
  "logs": [
    {
      "id": "uuid",
      "event": "deploy.completed",
      "source": "github-actions",
      "summary": "Production deployment v2.4.1 completed successfully",
      "status": "success",
      "errorMsg": null,
      "rawPayload": { ... },
      "createdAt": "2026-06-25T10:30:00.000Z"
    }
  ]
}
```

### View Statistics

```http
GET /webhook/stats
```

Returns aggregate metrics:

```json
{
  "total": 142,
  "success": 138,
  "error": 4,
  "successRate": "97.2%",
  "bySource": [
    { "source": "shopify", "count": 80 },
    { "source": "stripe", "count": 45 },
    { "source": "auth0", "count": 17 }
  ]
}
```

### Time-Series Data

```http
GET /webhook/timeseries?hours=24
```

| Query Param | Type | Default | Description |
|-------------|------|---------|-------------|
| `hours` | number | `24` | Lookback window in hours |

Returns hourly-bucketed event counts for charts:

```json
[
  {
    "timestamp": "2026-06-25T10:00:00.000Z",
    "success": 5,
    "error": 1,
    "total": 6
  },
  ...
]
```

##  Quick Start

### Prerequisites

- **Node.js** 20+
- **npm**
- **PostgreSQL** — local or remote (e.g., [Neon](https://neon.tech), [Railway](https://railway.app))
- **Discord Webhook URL** (optional) — needed for event forwarding; skip if you only want the API

### Setup

```bash
# Clone the repository
git clone https://github.com/valfidz/integrahub.git
cd integrahub

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL, DIRECT_URL, and optionally DISCORD_WEBHOOK_URL
```

### Required Environment Variables

```env
DATABASE_URL=postgresql://user:***@host:5432/integrahub
DIRECT_URL=postgresql://user:***@host:5432/integrahub
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...     # Optional — omit to skip Discord forwarding
PORT=3000                                                     # Optional, defaults to 3000
FRONTEND_URL=https://your-frontend.com                        # Optional — CORS allowlist origin
```

> `DATABASE_URL` is used by Prisma at runtime via `@prisma/adapter-pg`.
> `DIRECT_URL` is used by Prisma CLI (migrations, studio) — configured in `prisma.config.ts`.

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run start:dev
```

The API is now running at **http://localhost:3000**.

### Verify

```bash
curl -X POST http://localhost:3000/webhook/receive \
  -H "Content-Type: application/json" \
  -d '{"event": "test.event", "source": "curl", "message": "Hello IntegraHub!"}'
```

##  Frontend Dashboard

IntegraHub has a companion dashboard for monitoring and testing: [IntegraHub Dashboard](https://github.com/valfidz/integrahub-dashboard).

It provides:
- **Real-time stats** — total events, success rate, success/error breakdown
- **Time-series chart** — 24-hour event volume trend
- **Source breakdown chart** — events grouped by integration source
- **Log browser** — filterable table with expandable rows showing raw payloads
- **Webhook tester** — compose and send test payloads from presets or custom JSON

To run locally with the backend:

```bash
git clone https://github.com/valfidz/integrahub-dashboard.git
cd integrahub-dashboard
npm install

echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
npm run dev    # starts on http://localhost:3001
```

> The backend's CORS is pre-configured to accept requests from `http://localhost:3001`.

##  Project Structure

```
integrahub/
├── src/
│   ├── main.ts                        # App entry point (CORS + bootstrap)
│   ├── app.module.ts                  # Root module (Config + Webhook + Prisma)
│   ├── prisma/
│   │   ├── prisma.module.ts           # Global Prisma provider
│   │   └── prisma.service.ts          # Prisma client (pg adapter)
│   └── webhook/
│       ├── webhook.module.ts          # Webhook feature module
│       ├── webhook.controller.ts      # POST /receive, GET /logs, GET /stats, GET /timeseries
│       ├── webhook.service.ts         # Business logic (handle, forward, log, aggregate)
│       ├── webhook.transformer.ts     # Payload normalization
│       └── discord.forwarder.ts       # Discord webhook client
├── prisma/
│   └── schema.prisma                  # Database schema (integration_logs)
├── prisma.config.ts                   # Prisma 7 CLI configuration
├── .env.example                       # Environment variable template
├── nest-cli.json
├── package.json
└── tsconfig.json
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

# End-to-end tests
npm run test:e2e
```

##  Repository Links

| Repo | Description |
|------|-------------|
| [IntegraHub (Backend)](https://github.com/valfidz/integrahub) | This repo — NestJS webhook ingestion service |
| [IntegraHub Dashboard (Frontend)](https://github.com/valfidz/integrahub-dashboard) | Next.js monitoring UI |

---

<p align="center">
  Built by <a href="https://github.com/valfidz">Naufal Hafizh Nugraha</a>
</p>
