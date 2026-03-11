# songjaehyun-node-api

TypeScript + Fastify backend powering **product-style API demos** for the interactive engineering platform at **songjaehyun.com**.

This service demonstrates how modern backend APIs are designed, validated, and structured in production systems.

The Node service complements the platform’s Java backend by focusing on **API design, request validation, and real-world product workflows**, while the Java service focuses on **systems engineering and algorithmic demos**.

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

Each API demo is designed so visitors can interact with the endpoints from the frontend and understand how the backend behaves internally.

---

# Platform Architecture

The full platform consists of three components.

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

---

# Tech Stack

| Technology        | Purpose                        |
| ----------------- | ------------------------------ |
| Node.js           | Runtime environment            |
| TypeScript        | Type-safe backend development  |
| Fastify           | High-performance API framework |
| Zod               | Request validation schemas     |
| Swagger / OpenAPI | API documentation              |
| UUID              | Resource identifiers           |

---

# Project Structure

```

src
│
├── server.ts
├── app.ts
│
├── plugins
│ └── swagger.ts
│
├── shared
│ ├── errors
│ └── types
│
└── modules
└── products
├── product.routes.ts
├── product.service.ts
├── product.repository.ts
├── product.schemas.ts
└── product.types.ts

```

---

# Architecture

The project follows a modular architecture commonly used in production backend systems.

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

This layer keeps application behavior separate from HTTP concerns.

---

### Repositories

Responsible for data access.

For demonstration purposes, repositories currently use **in-memory storage**, but can be swapped with a database implementation.

---

### Schemas

Zod schemas define:

- request body validation
- query parameter validation
- predictable API contracts

These schemas also power the generated OpenAPI documentation.

---

# Running the Project

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

The APIs are intentionally designed to resemble real production services rather than simple demo endpoints.

---
