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

// AI Types
export type AiSummaryRequest = { workerProfileId: number; jobId: number };
export type AiSummaryResponse = { summary: string[] }; // 3 bullets

export type AiOutreachRequest = { workerProfileId: number; jobId: number; type: "email" | "sms" };
export type AiOutreachResponse = { message: string; subject?: string };
