import { z } from 'zod';
import { 
  insertUserSchema, 
  insertEmployerProfileSchema, 
  insertWorkerProfileSchema, 
  insertJobSchema,
  insertApplicationSchema,
  insertStaffSchema,
  insertTaskSchema,
  insertTransactionSchema,
  insertJobBoardPostingSchema,
  jobs,
  applications,
  employerProfiles,
  workerProfiles,
  users,
  staff,
  tasks,
  transactions,
  jobBoardPostings
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  })
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({ username: z.string(), password: z.string() }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.object({ message: z.string() }),
      },
    },
    user: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(), // Can be null if not logged in
      },
    },
  },
  employer: {
    createProfile: {
      method: 'POST' as const,
      path: '/api/employer/profile',
      input: insertEmployerProfileSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof employerProfiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    getProfile: {
      method: 'GET' as const,
      path: '/api/employer/profile/:userId',
      responses: {
        200: z.custom<typeof employerProfiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    createJob: {
      method: 'POST' as const,
      path: '/api/employer/jobs',
      input: insertJobSchema.omit({ employerId: true }),
      responses: {
        201: z.custom<typeof jobs.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    myJobs: {
      method: 'GET' as const,
      path: '/api/employer/jobs',
      responses: {
        200: z.array(z.custom<typeof jobs.$inferSelect>()),
      },
    },
    jobApplications: {
      method: 'GET' as const,
      path: '/api/employer/jobs/:jobId/applications',
      responses: {
        200: z.array(z.custom<typeof applications.$inferSelect & { worker: typeof users.$inferSelect & { workerProfile: typeof workerProfiles.$inferSelect | null } }>()),
      },
    },
    updateApplicationStatus: {
      method: 'PATCH' as const,
      path: '/api/employer/applications/:id/status',
      input: z.object({ status: z.string(), notes: z.string().optional() }),
      responses: {
        200: z.custom<typeof applications.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // Staff Management
    listStaff: {
      method: 'GET' as const,
      path: '/api/employer/staff',
      responses: {
        200: z.array(z.custom<typeof staff.$inferSelect>()),
      },
    },
    getStaff: {
      method: 'GET' as const,
      path: '/api/employer/staff/:id',
      responses: {
        200: z.custom<typeof staff.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    createStaff: {
      method: 'POST' as const,
      path: '/api/employer/staff',
      input: insertStaffSchema.omit({ employerId: true }),
      responses: {
        201: z.custom<typeof staff.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateStaff: {
      method: 'PATCH' as const,
      path: '/api/employer/staff/:id',
      input: insertStaffSchema.partial(),
      responses: {
        200: z.custom<typeof staff.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    // Tasks
    listTasks: {
      method: 'GET' as const,
      path: '/api/employer/tasks',
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      },
    },
    createTask: {
      method: 'POST' as const,
      path: '/api/employer/tasks',
      input: insertTaskSchema.omit({ employerId: true }),
      responses: {
        201: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateTask: {
      method: 'PATCH' as const,
      path: '/api/employer/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    deleteTask: {
      method: 'DELETE' as const,
      path: '/api/employer/tasks/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    },
    // Financial Tracking
    listTransactions: {
      method: 'GET' as const,
      path: '/api/employer/transactions',
      input: z.object({
        type: z.enum(['revenue', 'expense']).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect>()),
      },
    },
    createTransaction: {
      method: 'POST' as const,
      path: '/api/employer/transactions',
      input: insertTransactionSchema.omit({ employerId: true }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    getFinancialSummary: {
      method: 'GET' as const,
      path: '/api/employer/financial-summary',
      responses: {
        200: z.object({
          totalRevenue: z.number(),
          totalExpenses: z.number(),
          netIncome: z.number(),
        }),
      },
    },
    // Job Board Postings
    listJobPostings: {
      method: 'GET' as const,
      path: '/api/employer/jobs/:jobId/postings',
      responses: {
        200: z.array(z.custom<typeof jobBoardPostings.$inferSelect>()),
      },
    },
    createJobPosting: {
      method: 'POST' as const,
      path: '/api/employer/jobs/:jobId/postings',
      input: insertJobBoardPostingSchema.omit({ jobId: true }),
      responses: {
        201: z.custom<typeof jobBoardPostings.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    postToJobBoard: {
      method: 'POST' as const,
      path: '/api/employer/postings/:id/publish',
      responses: {
        200: z.object({ success: z.boolean(), externalId: z.string().optional(), message: z.string() }),
        404: errorSchemas.notFound,
      },
    },
  },
  worker: {
    createProfile: {
      method: 'POST' as const,
      path: '/api/worker/profile',
      input: insertWorkerProfileSchema.omit({ userId: true }),
      responses: {
        201: z.custom<typeof workerProfiles.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    getProfile: {
      method: 'GET' as const,
      path: '/api/worker/profile/:userId',
      responses: {
        200: z.custom<typeof workerProfiles.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    apply: {
      method: 'POST' as const,
      path: '/api/worker/applications',
      input: insertApplicationSchema.omit({ workerId: true, status: true, fitScore: true, notes: true }),
      responses: {
        201: z.custom<typeof applications.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    myApplications: {
      method: 'GET' as const,
      path: '/api/worker/applications',
      responses: {
        200: z.array(z.custom<typeof applications.$inferSelect & { job: typeof jobs.$inferSelect }>()),
      },
    },
  },
  jobs: {
    list: {
      method: 'GET' as const,
      path: '/api/jobs',
      input: z.object({
        industry: z.string().optional(),
        location: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof jobs.$inferSelect & { employer: typeof users.$inferSelect & { employerProfile: typeof employerProfiles.$inferSelect | null } }>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/jobs/:id',
      responses: {
        200: z.custom<typeof jobs.$inferSelect & { employer: typeof users.$inferSelect & { employerProfile: typeof employerProfiles.$inferSelect | null } }>(),
        404: errorSchemas.notFound,
      },
    },
  },
  ai: {
    summarizeCandidate: {
      method: 'POST' as const,
      path: '/api/ai/summarize',
      input: z.object({
        workerProfileId: z.number(),
        jobId: z.number()
      }),
      responses: {
        200: z.object({ summary: z.array(z.string()) }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
    draftOutreach: {
      method: 'POST' as const,
      path: '/api/ai/draft-outreach',
      input: z.object({
        workerProfileId: z.number(),
        jobId: z.number(),
        type: z.enum(['email', 'sms'])
      }),
      responses: {
        200: z.object({ message: z.string(), subject: z.string().optional() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
