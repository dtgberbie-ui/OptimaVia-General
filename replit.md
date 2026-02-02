# OptimaVia - Workforce Reliability Platform

## Overview

OptimaVia is an AI-assisted workforce reliability and hiring platform for small and mid-sized businesses in labor-critical industries (home care, trucking, manufacturing). The platform enables employers to post full-time jobs and receive ranked applicants based on a "Fit & Reliability Score" (0-100). Candidates create profiles, apply to jobs, and employers manage applicants through a pipeline workflow.

**Tagline:** "Making Work Reliable."

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework:** React with TypeScript, using Vite as the build tool
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack React Query for server state and caching
- **UI Components:** shadcn/ui component library built on Radix UI primitives
- **Styling:** TailwindCSS with custom design tokens (Deep Blue primary, Soft Green secondary)
- **Forms:** React Hook Form with Zod validation via @hookform/resolvers
- **Animations:** Framer Motion for page transitions and micro-interactions

### Backend Architecture
- **Framework:** Express.js 5.x with TypeScript
- **Authentication:** Passport.js with local strategy, session-based auth using express-session with httpOnly cookies
- **Password Security:** scrypt hashing with random salt
- **API Design:** RESTful endpoints defined in `shared/routes.ts` with Zod schemas for type-safe contracts

### Database Layer
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Schema Location:** `shared/schema.ts` contains all table definitions
- **Migrations:** Drizzle Kit for schema migrations (`npm run db:push`)
- **Key Tables:** users, employer_profiles, worker_profiles, jobs, applications, staff, tasks, transactions, job_board_postings

### Scoring System
The Fit Score (0-100) is calculated deterministically based on:
- Role match (0-35 points)
- Certifications match (0-25 points)
- Availability match (0-15 points)
- Experience level (0-15 points)
- Location proximity (0-10 points)

### AI Integration
- OpenAI API for candidate summarization and outreach message drafting
- Fallback to template-based generation when API unavailable
- Voice chat capabilities via Replit AI Integrations (audio processing, speech-to-text, text-to-speech)

### Project Structure
```
client/           # React frontend
  src/
    components/   # Reusable UI components
    hooks/        # Custom React hooks for data fetching
    pages/        # Route-level page components
    lib/          # Utilities and query client
server/           # Express backend
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  auth.ts         # Authentication setup
shared/           # Shared between client/server
  schema.ts       # Drizzle database schema
  routes.ts       # API contract definitions
```

## External Dependencies

### Database
- **PostgreSQL:** Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple:** Session storage for production

### AI Services
- **OpenAI API:** Used for AI features (summarization, outreach drafting, voice chat)
  - Configured via `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - Image generation via `gpt-image-1` model

### Authentication
- **Session Secret:** `SESSION_SECRET` environment variable (defaults to fallback for development)

### Build & Development
- **Vite:** Development server with HMR and production bundling
- **esbuild:** Server-side bundling for production
- **Replit Plugins:** Runtime error overlay, cartographer, dev banner for Replit environment