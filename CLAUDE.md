# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Architecture

Smatter is a Twitter-like social media application using a monorepo structure with multiple applications:

- `apps/react-frontend/` - React + Vite + TypeScript frontend with Tailwind CSS and shadcn/ui components
- `apps/node-backend/` - Express + TypeScript + MongoDB backend API
- `apps/go-backend/` - Go + MongoDB backend API (alternative implementation)
- `docker/` - MongoDB database setup with Docker

The project uses a multi-backend approach with both Node.js/Express and Go implementations sharing the same MongoDB database.

## Common Development Commands

### Frontend (React)
```bash
cd apps/react-frontend
npm run dev          # Start development server
npm run build        # Build for production (runs tsc && vite build)
npm run lint         # Run ESLint with TypeScript
npm run preview      # Preview production build
```

### Node.js Backend
```bash
cd apps/node-backend
npm run dev          # Start development with hot reload and database
npm run compile      # Compile TypeScript
npm run server       # Watch and compile TypeScript
npm test             # Run Jest tests with 5s timeout
npm run start-db     # Start MongoDB via Docker Compose
```

### Go Backend
```bash
cd apps/go-backend
go run ./cmd/api     # Start the Go API server
go build ./cmd/api   # Build the API binary
go test ./...        # Run all tests
```

### Database
```bash
cd docker
docker compose up -d   # Start MongoDB database
```

## Technology Stack

### Frontend
- **React** with TypeScript and Vite
- **Tailwind CSS** with custom design system using CSS variables
- **shadcn/ui** components (Radix UI primitives)
- **React Router** for navigation
- **TanStack Query** for server state management
- **Zustand** for client state management
- **React Hook Form** with Zod validation

### Backend (Node.js)
- **Express.js** with TypeScript
- **Mongoose** for MongoDB interaction
- **Zod** for runtime validation
- **bcrypt** for password hashing
- **Jest** and **Supertest** for testing
- **MongoDB Memory Server** for test database

### Backend (Go)
- **HTTP router** (julienschmidt/httprouter)
- **MongoDB driver** (official Go driver v2)
- Standard library structured approach

### Database
- **MongoDB** running in Docker container
- Connection on port 27017 (development)

## Development Setup

1. Start the database: `cd docker && docker compose up -d`
2. Choose your backend:
   - Node.js: `cd apps/node-backend && npm run dev`
   - Go: `cd apps/go-backend && go run ./cmd/api`
3. Start frontend: `cd apps/react-frontend && npm run dev`

## Testing

- Frontend: Uses standard Vite testing setup
- Node.js Backend: Jest with test database on port 27024
- Go Backend: Standard Go testing with `go test`

## Code Organization

The frontend uses path aliases with `@/*` pointing to `./src/*`. Both backends follow clean architecture patterns with separation between API handlers, business logic, and data access layers.