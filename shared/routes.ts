import { z } from 'zod';
import { 
  insertUserSchema, 
  insertEmployerProfileSchema, 
  insertWorkerProfileSchema, 
  insertJobSchema,
  insertApplicationSchema,
  jobs,
  applications,
  employerProfiles,
  workerProfiles,
  users
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
