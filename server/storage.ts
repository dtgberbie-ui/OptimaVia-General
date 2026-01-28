import { db } from "./db";
import { 
  users, employerProfiles, workerProfiles, jobs, applications,
  type User, type InsertUser,
  type EmployerProfile, type InsertEmployerProfile,
  type WorkerProfile, type InsertWorkerProfile,
  type Job, type InsertJob,
  type Application, type InsertApplication
} from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User & Auth
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role: string }): Promise<User>;

  // Profiles
  getEmployerProfile(userId: number): Promise<EmployerProfile | undefined>;
  createEmployerProfile(profile: InsertEmployerProfile): Promise<EmployerProfile>;
  
  getWorkerProfile(userId: number): Promise<WorkerProfile | undefined>;
  createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile>;

  // Jobs
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<Job | undefined>;
  getJobs(filters?: { industry?: string; location?: string }): Promise<Job[]>;
  getJobsByEmployer(employerId: number): Promise<Job[]>;

  // Applications
  createApplication(app: InsertApplication): Promise<Application>;
  getApplicationsByJob(jobId: number): Promise<Application[]>;
  getApplicationsByWorker(workerId: number): Promise<Application[]>;
  updateApplicationStatus(id: number, status: string, notes?: string): Promise<Application>;
}

export class DatabaseStorage implements IStorage {
  // === User ===
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { role: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // === Profiles ===
  async getEmployerProfile(userId: number): Promise<EmployerProfile | undefined> {
    const [profile] = await db.select().from(employerProfiles).where(eq(employerProfiles.userId, userId));
    return profile;
  }

  async createEmployerProfile(profile: InsertEmployerProfile): Promise<EmployerProfile> {
    const [newProfile] = await db.insert(employerProfiles).values(profile).returning();
    return newProfile;
  }

  async getWorkerProfile(userId: number): Promise<WorkerProfile | undefined> {
    const [profile] = await db.select().from(workerProfiles).where(eq(workerProfiles.userId, userId));
    return profile;
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const [newProfile] = await db.insert(workerProfiles).values(profile).returning();
    return newProfile;
  }

  // === Jobs ===
  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJob(id: number): Promise<Job | undefined> {
    // We'll need relation loading in the route handler or here. 
    // For now, keeping storage simple, but Drizzle's query builder in routes is often better for relations.
    // However, the interface returns `Job`, so let's stick to that.
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobs(filters?: { industry?: string; location?: string }): Promise<Job[]> {
    let query = db.select().from(jobs);
    
    // Simple exact match for MVP filters
    if (filters?.industry) {
      query = query.where(eq(jobs.industry, filters.industry)) as any;
    }
    // Location usually needs "contains" or similar, but exact for now or implement in routes
    // Drizzle query builder is flexible. Let's return all and filter in memory if complex, or exact for now.
    
    // Note: To properly chain .where() with optional filters in Drizzle, it's better to build the conditions array.
    const conditions = [];
    if (filters?.industry) conditions.push(eq(jobs.industry, filters.industry));
    if (filters?.location) conditions.push(eq(jobs.location, filters.location));
    
    if (conditions.length > 0) {
      return await db.select().from(jobs).where(and(...conditions));
    }
    
    return await db.select().from(jobs);
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.employerId, employerId));
  }

  // === Applications ===
  async createApplication(app: InsertApplication): Promise<Application> {
    const [newApp] = await db.insert(applications).values(app).returning();
    return newApp;
  }

  async getApplicationsByJob(jobId: number): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.jobId, jobId));
  }

  async getApplicationsByWorker(workerId: number): Promise<Application[]> {
    return await db.select().from(applications).where(eq(applications.workerId, workerId));
  }

  async updateApplicationStatus(id: number, status: string, notes?: string): Promise<Application> {
    const [updated] = await db
      .update(applications)
      .set({ status, notes })
      .where(eq(applications.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
