# OptimaVia - Business Management Platform

## Overview

OptimaVia is an AI-assisted business management platform for small and mid-sized businesses in labor-critical industries. The platform provides modular business management across four core areas: Hiring, Workforce Management, Operations, and Finance. Industry-specific configuration drives module behavior, terminology, and custom fields.

**Tagline:** "Making Work Reliable."

## User Preferences

Preferred communication style: Simple, everyday language.

## Modules

### Hiring Module
- Post jobs, review applicants with Fit & Reliability Score (0-100)
- Job distribution to external boards (Indeed, ZipRecruiter, etc.)
- XML feed for programmatic job distribution
- AI-powered candidate summarization and outreach drafting

### Workforce Module
- Staff management with performance ratings
- Employee profiles, positions, hourly rates
- Status tracking (active, inactive, terminated)

### Operations Module
- Task management with priority levels and status tracking
- Shift scheduling with staff assignment
- Operations hub combining tasks and shifts

### Finance Module
- Revenue and expense tracking
- Financial summaries (total revenue, expenses, net income)
- Transaction categorization

### Industry Configuration
- Pre-seeded configs for: Home Healthcare, Manufacturing, Logistics/Transportation, Hospitality/Restaurants, Automotive Repair, Retail
- Each config includes: enabled modules, dashboard widgets, custom fields, terminology
- Industry selection during employer onboarding with company size

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
- **Key Tables:** users, employer_profiles, worker_profiles, jobs, applications, staff, tasks, transactions, job_board_postings, industry_configs, schedule_shifts

### Key Pages & Routes
```
/employer/dashboard      - Business Dashboard (module overview + stats)
/employer/hiring         - Hiring Dashboard (jobs, applicants)
/employer/staff          - Workforce Management (staff profiles)
/employer/operations     - Operations Hub (links to tasks + shifts)
/employer/tasks          - Task Management
/employer/shifts         - Shift Scheduling
/employer/finances       - Financial Tracking
```

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
