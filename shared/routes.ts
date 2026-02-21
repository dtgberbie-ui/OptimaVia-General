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
  insertJobDistributionSchema,
  jobs,
  applications,
  employerProfiles,
  workerProfiles,
  users,
  staff,
  tasks,
  transactions,
  jobBoardPostings,
  jobDistributions,
  integrationCredentials,
  applicationClicks
} from './schema';

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
        200: z.custom<typeof users.$inferSelect>(),
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
    updateJob: {
      method: 'PATCH' as const,
      path: '/api/employer/jobs/:id',
      input: insertJobSchema.partial(),
      responses: {
        200: z.custom<typeof jobs.$inferSelect>(),
        404: errorSchemas.notFound,
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
    listDistributions: {
      method: 'GET' as const,
      path: '/api/employer/jobs/:jobId/distributions',
      responses: {
        200: z.array(z.custom<typeof jobDistributions.$inferSelect>()),
      },
    },
    createDistribution: {
      method: 'POST' as const,
      path: '/api/employer/jobs/:jobId/distributions',
      input: insertJobDistributionSchema.omit({ jobId: true }),
      responses: {
        201: z.custom<typeof jobDistributions.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    updateDistribution: {
      method: 'PATCH' as const,
      path: '/api/employer/distributions/:id',
      input: insertJobDistributionSchema.partial(),
      responses: {
        200: z.custom<typeof jobDistributions.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    listIntegrations: {
      method: 'GET' as const,
      path: '/api/employer/integrations',
      responses: {
        200: z.array(z.custom<typeof integrationCredentials.$inferSelect>()),
      },
    },
    hiringStats: {
      method: 'GET' as const,
      path: '/api/employer/hiring/stats',
      responses: {
        200: z.object({
          openJobs: z.number(),
          totalApplicants: z.number(),
          integrationsConnected: z.number(),
          feedEnabled: z.boolean(),
        }),
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
      input: insertApplicationSchema.omit({ workerId: true, status: true, notes: true }),
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
    rewriteForBoard: {
      method: 'POST' as const,
      path: '/api/ai/rewrite-for-board',
      input: z.object({
        jobId: z.number(),
        board: z.string(),
      }),
      responses: {
        200: z.object({ rewrittenText: z.string() }),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  feed: {
    publicFeed: {
      method: 'GET' as const,
      path: '/api/jobs/feed.xml',
      responses: {
        200: z.string(),
      },
    },
    employerFeed: {
      method: 'GET' as const,
      path: '/api/jobs/:employerId/feed.xml',
      responses: {
        200: z.string(),
      },
    },
  },
  tracking: {
    recordClick: {
      method: 'POST' as const,
      path: '/api/track/click',
      input: z.object({
        jobId: z.number(),
        source: z.string(),
        sourceUrl: z.string().optional(),
      }),
      responses: {
        200: z.object({ success: z.boolean() }),
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
