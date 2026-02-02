import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("worker"), // 'employer' | 'worker'
  createdAt: timestamp("created_at").defaultNow(),
});

export const employerProfiles = pgTable("employer_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(), // FK to users
  companyName: text("company_name").notNull(),
  industry: text("industry").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const workerProfiles = pgTable("worker_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(), // FK to users
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  roles: text("roles").array().notNull(), // e.g., ["CNA", "Truck Driver"]
  experienceYears: integer("experience_years").notNull(),
  certifications: text("certifications").array().notNull(),
  availability: text("availability").notNull(), // "Full-time", "Part-time", etc.
  createdAt: timestamp("created_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(), // FK to users (not profile, for simplicity in auth check)
  title: text("title").notNull(),
  description: text("description").notNull(),
  industry: text("industry").notNull(),
  location: text("location").notNull(),
  payMin: integer("pay_min").notNull(),
  payMax: integer("pay_max").notNull(),
  requiredCertifications: text("required_certifications").array().notNull(),
  status: text("status").notNull().default("OPEN"), // OPEN, CLOSED
  createdAt: timestamp("created_at").defaultNow(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  workerId: integer("worker_id").notNull(), // FK to users
  status: text("status").notNull().default("New"), // New, Shortlisted, Interview, Hired, Rejected
  fitScore: integer("fit_score").notNull().default(0),
  notes: text("notes"),
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
  jobs: many(jobs), // If employer
  applications: many(applications), // If worker
}));

export const jobsRelations = relations(jobs, ({ one, many }) => ({
  employer: one(users, {
    fields: [jobs.employerId],
    references: [users.id],
  }),
  applications: many(applications),
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

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertEmployerProfileSchema = createInsertSchema(employerProfiles).omit({ id: true, createdAt: true });
export const insertWorkerProfileSchema = createInsertSchema(workerProfiles).omit({ id: true, createdAt: true });
export const insertJobSchema = createInsertSchema(jobs).omit({ id: true, createdAt: true });
export const insertApplicationSchema = createInsertSchema(applications).omit({ id: true, createdAt: true, fitScore: true });

// === EXPLICIT API CONTRACT TYPES ===

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

// Request types
export type CreateJobRequest = Omit<InsertJob, "employerId">; // Employer ID comes from session
export type CreateApplicationRequest = Omit<InsertApplication, "workerId" | "status" | "notes">; // Worker ID from session, defaults
export type UpdateApplicationStatusRequest = { status: string; notes?: string };

// Response types extended with relations
export type JobWithEmployer = Job & { employer: User & { employerProfile: EmployerProfile | null } };
export type ApplicationWithWorker = Application & { worker: User & { workerProfile: WorkerProfile | null } };
export type ApplicationWithJob = Application & { job: Job & { employer: User & { employerProfile: EmployerProfile | null } } };

// === NEW EMPLOYER FEATURES ===

// Staff Management - Hired workers linked to employer
export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  workerId: integer("worker_id").notNull(),
  hiredDate: timestamp("hired_date").defaultNow(),
  position: text("position").notNull(),
  hourlyRate: integer("hourly_rate"),
  status: text("status").notNull().default("active"), // active, inactive, terminated
  performanceRating: integer("performance_rating"), // 1-5
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Employment History for staff
export const employmentHistory = pgTable("employment_history", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id").notNull(),
  action: text("action").notNull(), // hired, promoted, warning, terminated, review
  description: text("description"),
  date: timestamp("date").defaultNow(),
});

// Tasks - Assigned to staff
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  staffId: integer("staff_id"), // null = unassigned
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, cancelled
  createdAt: timestamp("created_at").defaultNow(),
});

// Financial tracking
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  employerId: integer("employer_id").notNull(),
  type: text("type").notNull(), // revenue, expense
  category: text("category").notNull(), // payroll, supplies, sales, etc
  amount: integer("amount").notNull(), // in cents
  description: text("description"),
  date: timestamp("date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Job Board Postings - Track external job postings
export const jobBoardPostings = pgTable("job_board_postings", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").notNull(),
  platform: text("platform").notNull(), // indeed, linkedin, ziprecruiter
  externalId: text("external_id"), // ID from external platform
  status: text("status").notNull().default("draft"), // draft, posted, expired, removed
  postedAt: timestamp("posted_at"),
  content: text("content").notNull(), // The actual ad content
  createdAt: timestamp("created_at").defaultNow(),
});

// === NEW RELATIONS ===

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

export const jobBoardPostingsRelations = relations(jobBoardPostings, ({ one }) => ({
  job: one(jobs, { fields: [jobBoardPostings.jobId], references: [jobs.id] }),
}));

// === NEW SCHEMAS ===

export const insertStaffSchema = createInsertSchema(staff).omit({ id: true, createdAt: true });
export const insertEmploymentHistorySchema = createInsertSchema(employmentHistory).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true });
export const insertJobBoardPostingSchema = createInsertSchema(jobBoardPostings).omit({ id: true, createdAt: true });

// === NEW TYPES ===

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = z.infer<typeof insertStaffSchema>;

export type EmploymentHistoryRecord = typeof employmentHistory.$inferSelect;
export type InsertEmploymentHistory = z.infer<typeof insertEmploymentHistorySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type JobBoardPosting = typeof jobBoardPostings.$inferSelect;
export type InsertJobBoardPosting = z.infer<typeof insertJobBoardPostingSchema>;

// Extended types
export type StaffWithProfile = Staff & { workerProfile: WorkerProfile | null };
export type TaskWithAssignee = Task & { assignee: StaffWithProfile | null };

// AI Types
export type AiSummaryRequest = { workerProfileId: number; jobId: number };
export type AiSummaryResponse = { summary: string[] }; // 3 bullets

export type AiOutreachRequest = { workerProfileId: number; jobId: number; type: "email" | "sms" };
export type AiOutreachResponse = { message: string; subject?: string };
