# songjaehyun-node-api

TypeScript + Fastify backend powering **product-style API demos** for the interactive engineering platform at **songjaehyun.com**.

This service demonstrates how modern backend APIs are designed, validated, persisted, and structured in production systems.

The Node service complements the platform’s Java backend by focusing on **API design, request validation, persistence-backed workflows, and product case studies**, while the Java service focuses on **systems engineering and algorithmic demos**.

---

# Overview

This backend exists to make **product API engineering visible**.

Instead of simply exposing CRUD endpoints, the service demonstrates:

- modular API architecture
- request validation
- typed contracts
- filtering and pagination
- predictable response structures
- OpenAPI documentation
- service-layer business logic
- persistence-backed workflow state
- background job orchestration
- human-in-the-loop AI boundaries

Each API demo is designed so visitors can interact with the endpoints from the frontend and understand how the backend behaves internally. Some demos are intentionally simple API examples, while Tallymark is planned as a larger full-stack case study with Postgres persistence and asynchronous reconciliation workflows.

---

# Platform Architecture

The core platform consists of the Next.js frontend plus separate Java and Node backends. Larger case studies can also use external managed services for persistence and background work.

```
React + TypeScript Frontend (Next.js)
                │
                │
        ┌───────┴────────┐
        │                │
 Java Backend        Node Backend
 (Spring Boot)         (Fastify)
 Systems Demos        Product APIs
  Algorithms           API Design
Stateful Systems       Validation
                     Case Studies
                          │
                 ┌────────┴────────┐
                 │                 │
          Supabase Postgres   Trigger.dev
          Workflow State      Background Jobs

```

### Java Backend

Provides interactive demos for backend systems concepts:

- expiring key-value store
- rate limiter
- algorithm visualization
- stateful service behavior

### Node Backend (this repository)

Provides product-oriented API demos including:

- product catalog API
- request validation
- filtering, sorting, and pagination
- API documentation and exploration
- Tallymark financial operations case study
- Postgres-backed workflow persistence
- background reconciliation jobs

---

# Case Studies

## Tallymark

### Project Overview

Tallymark is a planned full-stack demo for AI-assisted financial operations review. It models a narrow private-markets / fund-operations reconciliation workflow where structured fund, investor, and transaction data is checked for review exceptions.

It is intentionally not a full ERP, fund administration platform, general ledger, or accounting engine. The goal is to demonstrate a focused, auditable review queue for financial operations, not to replace production accounting systems.

Tallymark explores a high-trust AI pattern: deterministic software owns correctness, AI compresses context, humans make final decisions, and the database preserves the workflow history.

### Why This Demo Exists

Tallymark is designed to show product and engineering judgment around:

- structured financial data
- reconciliation workflows
- Postgres-backed persistence
- background jobs
- human-in-the-loop AI
- audit-aware state transitions
- full-stack ownership

### Architecture

Frontend:

- Next.js
- TypeScript
- React
- Static build hosted on AWS S3 / CloudFront

Backend:

- TypeScript
- Node / Fastify
- Runs in the existing AWS-hosted container for this service

Database:

- Supabase Postgres

Background workflow:

- Trigger.dev

AI layer:

- AI summary generation over deterministic review issues

Request flow:

```text
User clicks "Run Reconciliation"
-> frontend calls Node API
-> backend creates a reconciliation_run record in Postgres
-> backend triggers a Trigger.dev job
-> job loads fund / investor / transaction data
-> job runs deterministic checks
-> job creates review_issue records
-> job generates an AI summary
-> job updates reconciliation_run status
-> frontend displays review queue
-> user resolves or dismisses issues
```

### Core Data Model

- `funds`: fund-level records used as the reconciliation context
- `investors`: investor records associated with funds
- `transactions`: capital calls, distributions, and related fund activity
- `reconciliation_runs`: persistent execution records for each reconciliation attempt
- `review_issues`: durable review exceptions created by deterministic checks
- `issue_events`: audit-style history for issue lifecycle changes

`reconciliation_runs` and `review_issues` make the workflow persistent instead of a one-off calculation. `issue_events` records how issues move through the review lifecycle, including resolution or dismissal notes.

### MVP Workflow

- View funds
- View fund investors and transactions
- Start reconciliation run
- Track run status: `queued`, `processing`, `completed`, `failed`
- Detect review issues
- Generate AI summary
- Review issues
- Resolve or dismiss issues with notes
- Record issue events / history

### Deterministic Checks

Initial reconciliation checks:

- missing investor
- duplicate transaction reference
- capital call underpayment
- capital call overpayment
- missing settlement date
- distribution without investor
- amount exceeds remaining commitment
- unknown transaction type

These checks are intentionally deterministic because financial correctness should not depend on an LLM. AI summarizes the context after the system has already identified the issue.

### AI Boundary

- AI summarizes issue context
- AI suggests next review steps
- AI does not invent amounts
- AI does not approve transactions
- AI does not resolve issues
- AI does not replace deterministic validation

### Non-Goals

Tallymark does not attempt to build:

- a full general ledger
- a complete ERP
- real fund administration
- investor portal
- waterfall / carry calculations
- real bank feed ingestion
- production accounting approvals
- multi-tenant permissioning

### Engineering Concepts Demonstrated

- full-stack TypeScript
- Postgres data modeling
- service / repository backend structure
- async workflow orchestration
- background job status tracking
- deterministic validation
- human-in-the-loop AI
- audit-aware issue lifecycle
- cloud-hosted portfolio infrastructure

### Current Status

- [ ] Define Supabase Postgres schema
- [ ] Add backend modules for funds, transactions, reconciliation runs, and review issues
- [ ] Add Trigger.dev reconciliation job
- [ ] Implement deterministic reconciliation checks
- [ ] Add AI summary generation for review issues
- [ ] Build review queue UI in the Next.js frontend
- [ ] Add issue resolution, dismissal, notes, and event history

---

# Tech Stack

| Technology        | Purpose                                      |
| ----------------- | -------------------------------------------- |
| Node.js           | Runtime environment                          |
| TypeScript        | Type-safe backend development                |
| Fastify           | High-performance API framework               |
| Zod               | Request validation schemas                   |
| Swagger / OpenAPI | API documentation                            |
| UUID              | Resource identifiers                         |
| Supabase Postgres | Planned persistence for Tallymark workflows  |
| Trigger.dev       | Planned async reconciliation job orchestration |
| AI API            | Planned summary generation for review issues |

---

# Project Structure

Current implemented modules:

```
src
│
├── server.ts
├── app.ts
│
├── plugins
│   └── swagger.ts
│
├── shared
│   ├── errors
│   └── types
│
└── modules
    └── products
        ├── product.routes.ts
        ├── product.service.ts
        ├── product.repository.ts
        ├── product.schemas.ts
        └── product.types.ts
```

Planned Tallymark modules will follow the same route / service / repository structure, but will use Postgres-backed persistence and background workflows instead of in-memory demo storage.

Expected Tallymark structure:

```text
src
│
├── modules
│   ├── funds
│   ├── investors
│   ├── transactions
│   ├── reconciliation-runs
│   ├── review-issues
│   └── issue-events
│
└── jobs
    └── reconciliation
```

---

# Architecture

The project follows a modular architecture commonly used in production backend systems. The current product catalog demo uses the same boundaries at a smaller scale; Tallymark is planned to extend those boundaries with database persistence, background job execution, and audit-aware workflow state.

### Routes

Responsible for:

- parsing requests
- validating input
- returning responses

Routes should remain thin and delegate logic to services.

---

### Services

Contain business logic such as:

- filtering
- sorting
- pagination
- domain rules
- reconciliation rules
- workflow state transitions

This layer keeps application behavior separate from HTTP concerns.

---

### Repositories

Responsible for data access.

The current product catalog repository uses **in-memory storage** for demonstration purposes. Tallymark is planned to use Supabase Postgres repositories so reconciliation runs, review issues, and issue events survive across requests and can be reviewed as a workflow.

---

### Schemas

Zod schemas define:

- request body validation
- query parameter validation
- predictable API contracts

These schemas also power the generated OpenAPI documentation.

---

### Background Workflows

Tallymark is planned to use Trigger.dev for asynchronous reconciliation work. The API will create a durable `reconciliation_run`, enqueue the job, and expose run status while the job performs deterministic checks and writes review issues back to Postgres.

---

### AI-Assisted Review

The AI layer is planned as a summarization boundary, not a validation engine. Deterministic code identifies financial review issues, AI summarizes already-detected context, and humans resolve or dismiss the issues with notes.

---

# Running the Project

The current local setup runs the implemented Fastify API modules, including the health check and product catalog API. Planned Tallymark work will add Supabase, Trigger.dev, and AI provider configuration as those modules are implemented.

Install dependencies:

```

npm install

```

Run the development server:

```

npm run dev

```

The server will start on:

```

[http://localhost:3001](http://localhost:3001)

```

---

# API Endpoints

Currently implemented endpoints:

## Health Check

```

GET /health

```

Response

```json
{
	"status": "ok"
}
```

---

# Product Catalog API

Example endpoints:

```
GET    /api/products
GET    /api/products/:id
POST   /api/products
PATCH  /api/products/:id
```

Planned Tallymark endpoints will cover funds, investors, transactions, reconciliation runs, review issues, and issue event history.

---

# Filtering

```
/api/products?category=keyboard
```

# Searching

```
/api/products?search=wireless
```

# Pagination

```
/api/products?page=1&pageSize=10
```

# Sorting

```
/api/products?sortBy=price&order=asc
```

---

# Example Request

Fetch products filtered by category and sorted by price.

```
GET /api/products?category=keyboard&sortBy=price&order=asc&page=1&pageSize=5
```

Example response:

```json
{
	"items": [
		{
			"id": "p_102",
			"name": "Wireless Mechanical Keyboard",
			"category": "keyboard",
			"price": 139.99,
			"inventory": 12,
			"rating": 4.6
		}
	],
	"page": 1,
	"pageSize": 5,
	"total": 18,
	"totalPages": 4
}
```

---

# Design Goals

This service aims to demonstrate several backend engineering principles:

- clean separation of concerns
- modular domain organization
- predictable API behavior
- strong validation boundaries
- documentation-first APIs
- durable workflow state where the domain requires it
- deterministic business validation
- async job orchestration
- clear AI boundaries in high-trust workflows

The APIs are intentionally designed to resemble real production services rather than simple demo endpoints.

---
