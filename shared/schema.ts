import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("worker"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employerProfiles = pgTable("employer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  country: text("country").notNull().default(""),
  location: text("location").notNull(),
  feedToken: text("feed_token"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workerProfiles = pgTable("worker_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  roles: text("roles").array().notNull(),
  experienceYears: integer("experience_years").notNull(),
  certifications: text("certifications").array().notNull(),
  availability: text("availability").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  industry: text("industry").notNull(),
  department: text("department"),
  employmentType: text("employment_type").notNull().default("full-time"),
  location: text("location").notNull(),
  city: text("city"),
  payMin: integer("pay_min").notNull(),
  payMax: integer("pay_max").notNull(),
  requiredCertifications: text("required_certifications").array().notNull(),
  responsibilities: text("responsibilities"),
  requirements: text("requirements"),
  schedule: text("schedule"),
  benefits: text("benefits"),
  status: text("status").notNull().default("DRAFT"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  workerId: integer("worker_id").notNull(),
  status: text("status").notNull().default("New"),
  fitScore: integer("fit_score").notNull().default(0),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  workerId: integer("worker_id").notNull(),
  hiredDate: timestamp("hired_date").defaultNow(),
  position: text("position").notNull(),
  hourlyRate: integer("hourly_rate"),
  status: text("status").notNull().default("active"),
  performanceRating: integer("performance_rating"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employmentHistory = pgTable("employment_history", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  action: text("action").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  staffId: integer("staff_id"),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("medium"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  type: text("type").notNull(),
  category: text("category").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobDistributions = pgTable("job_distributions", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  channel: text("channel").notNull(),
  status: text("status").notNull().default("DRAFT"),
  externalPostingId: text("external_posting_id"),
  lastAttemptAt: timestamp("last_attempt_at"),
  lastError: text("last_error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const integrationCredentials = pgTable("integration_credentials", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  provider: text("provider").notNull(),
  status: text("status").notNull().default("NOT_CONNECTED"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const applicationClicks = pgTable("application_clicks", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  source: text("source").notNull(),
  clickedAt: timestamp("clicked_at").defaultNow(),
  sourceUrl: text("source_url"),
});

export const jobBoardPostings = pgTable("job_board_postings", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  platform: text("platform").notNull(),
  externalId: text("external_id"),
  status: text("status").notNull().default("draft"),
  postedAt: timestamp("posted_at"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ one, many }) => ({
  employerProfile: one(employerProfiles, {
    fields: [users.id],
    references: [employerProfiles.userId],
  }),
  workerProfile: one(workerProfiles, {
    fields: [users.id],
    references: [workerProfiles.userId],
  }),
  jobs: many(jobs),
  applications: many(applications),
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  employer: one(users, {
    fields: [jobs.employerId],
    references: [users.id],
  }),
  applications: many(applications),
  distributions: many(jobDistributions),
}));

export const applicationsRelations = relations(applications, ({ one }) => ({
  job: one(jobs, {
    fields: [applications.jobId],
    references: [jobs.id],
  }),
  worker: one(users, {
    fields: [applications.workerId],
    references: [users.id],
  }),
}));

export const staffRelations = relations(staff, ({ one, many }) => ({
  employer: one(users, { fields: [staff.employerId], references: [users.id] }),
  worker: one(users, { fields: [staff.workerId], references: [users.id] }),
  workerProfile: one(workerProfiles, { fields: [staff.workerId], references: [workerProfiles.userId] }),
  history: many(employmentHistory),
  tasks: many(tasks),
}));

export const employmentHistoryRelations = relations(employmentHistory, ({ one }) => ({
  staff: one(staff, { fields: [employmentHistory.staffId], references: [staff.id] }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  employer: one(users, { fields: [tasks.employerId], references: [users.id] }),
  assignee: one(staff, { fields: [tasks.staffId], references: [staff.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  employer: one(users, { fields: [transactions.employerId], references: [users.id] }),
}));

export const jobDistributionsRelations = relations(jobDistributions, ({ one }) => ({
  job: one(jobs, { fields: [jobDistributions.jobId], references: [jobs.id] }),
}));

export const integrationCredentialsRelations = relations(integrationCredentials, ({ one }) => ({
  employer: one(users, { fields: [integrationCredentials.employerId], references: [users.id] }),
}));

export const applicationClicksRelations = relations(applicationClicks, ({ one }) => ({
  job: one(jobs, { fields: [applicationClicks.jobId], references: [jobs.id] }),
}));

export const jobBoardPostingsRelations = relations(jobBoardPostings, ({ one }) => ({
  job: one(jobs, { fields: [jobBoardPostings.jobId], references: [jobs.id] }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertEmployerProfileSchema = createInsertSchema(employerProfiles).omit({ id: true, createdAt: true });
export const insertWorkerProfileSchema = createInsertSchema(workerProfiles).omit({ id: true, createdAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, fitScore: true });
export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true });
export const insertEmploymentHistorySchema = createInsertSchema(employmentHistory).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertJobDistributionSchema = createInsertSchema(jobDistributions).omit({ id: true, createdAt: true });
export const insertIntegrationCredentialSchema = createInsertSchema(integrationCredentials).omit({ id: true, createdAt: true });
export const insertApplicationClickSchema = createInsertSchema(applicationClicks).omit({ id: true });
export const insertJobBoardPostingSchema = createInsertSchema(jobBoardPostings).omit({ id: true, createdAt: true });

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type EmployerProfile = typeof employerProfiles.$inferSelect;
export type InsertEmployerProfile = z.infer<typeof insertEmployerProfileSchema>;

export type WorkerProfile = typeof workerProfiles.$inferSelect;
export type InsertWorkerProfile = z.infer<typeof insertWorkerProfileSchema>;

export type Job = typeof jobs.$inferSelect;
export type InsertJob = z.infer<typeof insertJobSchema>;

export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type EmploymentHistoryRecord = typeof employmentHistory.$inferSelect;
export type InsertEmploymentHistory = z.infer<typeof insertEmploymentHistorySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type JobDistribution = typeof jobDistributions.$inferSelect;
export type InsertJobDistribution = z.infer<typeof insertJobDistributionSchema>;

export type IntegrationCredential = typeof integrationCredentials.$inferSelect;
export type InsertIntegrationCredential = z.infer<typeof insertIntegrationCredentialSchema>;

export type ApplicationClick = typeof applicationClicks.$inferSelect;
export type InsertApplicationClick = z.infer<typeof insertApplicationClickSchema>;

export type JobBoardPosting = typeof jobBoardPostings.$inferSelect;
export type InsertJobBoardPosting = z.infer<typeof insertJobBoardPostingSchema>;

export type CreateJobRequest = Omit<InsertJob, "employerId">;
export type CreateApplicationRequest = Omit<InsertApplication, "workerId" | "status" | "notes">;
export type UpdateApplicationStatusRequest = { status: string; notes?: string };

export type JobWithEmployer = Job & { employer: User & { employerProfile: EmployerProfile | null } };
export type ApplicationWithWorker = Application & { worker: User & { workerProfile: WorkerProfile | null } };
export type ApplicationWithJob = Application & { job: Job & { employer: User & { employerProfile: EmployerProfile | null } } };

export type StaffWithProfile = Staff & { workerProfile: WorkerProfile | null };
export type TaskWithAssignee = Task & { assignee: StaffWithProfile | null };

export type AiSummaryRequest = { workerProfileId: number; jobId: number };
export type AiSummaryResponse = { summary: string[] };

export type AiOutreachRequest = { workerProfileId: number; jobId: number; type: "email" | "sms" };
export type AiOutreachResponse = { message: string; subject?: string };
