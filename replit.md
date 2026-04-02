# OptimaVia - Modular Small Business Operations Platform

## Overview

OptimaVia is a modular small business operations platform with plug-in modules for different industry verticals. It features a mobile-first UX with bottom tab navigation and supports both business owner (employer) and employee login accounts.

**Tagline:** "Making Work Seamless."

## Demo Accounts

| Account | Password | Role | Modules |
|---|---|---|---|
| `filta_raleigh` | password | employer | Field Service, Finances, Team |
| `jake_filta` | password | employee | (Filta Raleigh employee) |
| `maria_filta` | password | employee | (Filta Raleigh employee) |
| `deon_filta` | password | employee | (Filta Raleigh employee) |
| `sweet_scoops` | password | employer | Product Costing, Finances, Team |

## User Preferences

Preferred communication style: Simple, everyday language.

## Modules

### Field Service Module (`field_service`)
- Job dispatch: create/assign service jobs to employees
- Job detail: tappable address → Google Maps navigation
- Status workflow: unassigned → assigned → in_progress → completed
- Photo documentation: check-in/check-out, key pickup/return photos
- Key tracking toggle per job
- Employee mobile view: see and work their assigned jobs

### Product Costing Module (`product_costing`)
- Ingredient management: name, unit, cost per unit, supplier
- Recipe builder: add ingredients with quantities to products
- Auto-calculated cost per unit from recipe
- Pricing calculator: enter target margin → get selling price
- Summary table: product, cost, price, margin % 

### Finances Module (`finances`)
- Revenue logging with categories
- Expense logging with categories
- Summary dashboard: total revenue, total expenses, net profit
- Transaction list with tabs (All / Revenue / Expenses)
- Delete transactions

### Team Module (`team`)
- Employee list with active/inactive toggle
- Add employee with username/password (creates login account)
- Employee accounts belong to employer's business via `businessId`

## System Architecture

### Frontend Architecture
- **Framework:** React with TypeScript, using Vite as the build tool
- **Routing:** Wouter for lightweight client-side routing
- **State Management:** TanStack React Query for server state and caching
- **UI Components:** shadcn/ui component library built on Radix UI primitives
- **Styling:** TailwindCSS with custom design tokens
- **Mobile-first:** Bottom tab navigation, 400px mobile viewport optimized
- **Forms:** React Hook Form with Zod validation

### Backend Architecture
- **Framework:** Express.js 5.x with TypeScript
- **Authentication:** Passport.js local strategy, session-based auth
- **Password Security:** scrypt hashing with random salt (`${hash}.${salt}` format)
- **Login route:** Uses custom Passport callback to return JSON errors (not plain text)

### Database Layer
- **ORM:** Drizzle ORM with PostgreSQL dialect
- **Schema:** `shared/schema.ts`
- **Migrations:** `npm run db:push`
- **Key Tables:** users, employer_profiles, service_jobs, job_photos, ingredients, products, product_ingredients, transactions

### Key Pages & Routes
```
Employer (business owner):
/employer/dashboard      - Dashboard with financial cards + today's jobs
/employer/service-jobs   - Service job list with status filters
/employer/service-jobs/:id - Job detail with photo upload
/employer/ingredients    - Ingredient management
/employer/products       - Products/recipes with pricing calculator
/employer/finances       - Financial tracking
/employer/team           - Team management
/employer/settings       - Module toggle settings

Employee:
/employee/jobs           - Employee's assigned jobs
/employee/jobs/:id       - Job detail: start/complete + photo upload
```

### Navigation
- **Bottom tab bar:** Dynamic tabs based on enabled modules
- **Employer modules map:**
  - Dashboard always shown
  - `field_service` → Jobs tab
  - `product_costing` → Ingredients + Products tabs
  - `finances` → Finances tab
  - `team` → Team tab
  - Settings always shown for employers
- **Employee nav:** Only "My Jobs" tab

### User Roles
- `employer`: Business owner, sees full management UI
- `employee`: Belongs to employer via `businessId`, sees only assigned jobs
- `worker`: Legacy job board applicant role (not used in new modules)

### Seed Data
Seed function checks for `filta_raleigh` user specifically before seeding. If not found, creates both demo businesses with employees, jobs, ingredients, products, and transactions.

### API Endpoints (new modules)
```
GET/POST        /api/service-jobs
GET/PATCH/DELETE /api/service-jobs/:id
POST            /api/service-jobs/:id/photos
GET/POST        /api/ingredients
PATCH/DELETE    /api/ingredients/:id
GET/POST        /api/products
PATCH/DELETE    /api/products/:id
GET/POST        /api/business/employees
PATCH           /api/business/employees/:id
PATCH           /api/business/modules
DELETE          /api/employer/transactions/:id
```

### Data Notes
- Transaction amounts stored in cents (integer). $10.00 = 1000
- Ingredient costs stored as real (floating point dollars per unit)
- Service job scheduled date stored as text `YYYY-MM-DD`
- Transaction date: sent from client as ISO string, coerced to Date on server

## External Dependencies

### Database
- **PostgreSQL:** `DATABASE_URL` environment variable

### AI Services
- **OpenAI API:** `AI_INTEGRATIONS_OPENAI_API_KEY` and `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Authentication
- **Session Secret:** `SESSION_SECRET` environment variable

### Build & Development
- **Vite:** Dev server with HMR
- **esbuild:** Server bundling for production
