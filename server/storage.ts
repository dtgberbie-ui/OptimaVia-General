import { db } from "./db";
import { 
  users, employerProfiles, workerProfiles, jobs, applications,
  staff, employmentHistory, tasks, transactions, jobBoardPostings,
  type User, type InsertUser,
  type EmployerProfile, type InsertEmployerProfile,
  type WorkerProfile, type InsertWorkerProfile,
  type Job, type InsertJob,
  type Application, type InsertApplication,
  type Staff, type InsertStaff,
  type EmploymentHistoryRecord, type InsertEmploymentHistory,
  type Task, type InsertTask,
  type Transaction, type InsertTransaction,
  type JobBoardPosting, type InsertJobBoardPosting
} from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

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

  // Staff
  getStaffByEmployer(employerId: number): Promise<Staff[]>;
  getStaff(id: number): Promise<Staff | undefined>;
  createStaff(s: InsertStaff): Promise<Staff>;
  updateStaff(id: number, updates: Partial<InsertStaff>): Promise<Staff>;
  getEmploymentHistory(staffId: number): Promise<EmploymentHistoryRecord[]>;
  addEmploymentHistory(h: InsertEmploymentHistory): Promise<EmploymentHistoryRecord>;

  // Tasks
  getTasksByEmployer(employerId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(t: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  // Transactions
  getTransactionsByEmployer(employerId: number, filters?: { type?: string; startDate?: Date; endDate?: Date }): Promise<Transaction[]>;
  createTransaction(t: InsertTransaction): Promise<Transaction>;
  getFinancialSummary(employerId: number): Promise<{ totalRevenue: number; totalExpenses: number; netIncome: number }>;

  // Job Board Postings
  getJobBoardPostings(jobId: number): Promise<JobBoardPosting[]>;
  createJobBoardPosting(p: InsertJobBoardPosting): Promise<JobBoardPosting>;
  updateJobBoardPosting(id: number, updates: Partial<InsertJobBoardPosting>): Promise<JobBoardPosting>;
  getJobBoardPosting(id: number): Promise<JobBoardPosting | undefined>;
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

  // === Staff ===
  async getStaffByEmployer(employerId: number): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.employerId, employerId));
  }

  async getStaff(id: number): Promise<Staff | undefined> {
    const [s] = await db.select().from(staff).where(eq(staff.id, id));
    return s;
  }

  async createStaff(s: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(s).returning();
    // Add employment history entry
    await db.insert(employmentHistory).values({
      staffId: newStaff.id,
      action: "hired",
      description: `Hired as ${s.position}`,
    });
    return newStaff;
  }

  async updateStaff(id: number, updates: Partial<InsertStaff>): Promise<Staff> {
    const [updated] = await db.update(staff).set(updates).where(eq(staff.id, id)).returning();
    return updated;
  }

  async getEmploymentHistory(staffId: number): Promise<EmploymentHistoryRecord[]> {
    return await db.select().from(employmentHistory).where(eq(employmentHistory.staffId, staffId)).orderBy(desc(employmentHistory.date));
  }

  async addEmploymentHistory(h: InsertEmploymentHistory): Promise<EmploymentHistoryRecord> {
    const [record] = await db.insert(employmentHistory).values(h).returning();
    return record;
  }

  // === Tasks ===
  async getTasksByEmployer(employerId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.employerId, employerId)).orderBy(desc(tasks.createdAt));
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [t] = await db.select().from(tasks).where(eq(tasks.id, id));
    return t;
  }

  async createTask(t: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(t).returning();
    return newTask;
  }

  async updateTask(id: number, updates: Partial<InsertTask>): Promise<Task> {
    const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async deleteTask(id: number): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // === Transactions ===
  async getTransactionsByEmployer(employerId: number, filters?: { type?: string; startDate?: Date; endDate?: Date }): Promise<Transaction[]> {
    const conditions = [eq(transactions.employerId, employerId)];
    if (filters?.type) conditions.push(eq(transactions.type, filters.type));
    if (filters?.startDate) conditions.push(gte(transactions.date, filters.startDate));
    if (filters?.endDate) conditions.push(lte(transactions.date, filters.endDate));
    
    return await db.select().from(transactions).where(and(...conditions)).orderBy(desc(transactions.date));
  }

  async createTransaction(t: InsertTransaction): Promise<Transaction> {
    const [newTx] = await db.insert(transactions).values(t).returning();
    return newTx;
  }

  async getFinancialSummary(employerId: number): Promise<{ totalRevenue: number; totalExpenses: number; netIncome: number }> {
    const allTx = await db.select().from(transactions).where(eq(transactions.employerId, employerId));
    const totalRevenue = allTx.filter(t => t.type.toLowerCase() === "revenue").reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = allTx.filter(t => t.type.toLowerCase() === "expense").reduce((sum, t) => sum + t.amount, 0);
    return { totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
  }

  // === Job Board Postings ===
  async getJobBoardPostings(jobId: number): Promise<JobBoardPosting[]> {
    return await db.select().from(jobBoardPostings).where(eq(jobBoardPostings.jobId, jobId));
  }

  async createJobBoardPosting(p: InsertJobBoardPosting): Promise<JobBoardPosting> {
    const [newPosting] = await db.insert(jobBoardPostings).values(p).returning();
    return newPosting;
  }

  async updateJobBoardPosting(id: number, updates: Partial<InsertJobBoardPosting>): Promise<JobBoardPosting> {
    const [updated] = await db.update(jobBoardPostings).set(updates).where(eq(jobBoardPostings.id, id)).returning();
    return updated;
  }

  async getJobBoardPosting(id: number): Promise<JobBoardPosting | undefined> {
    const [p] = await db.select().from(jobBoardPostings).where(eq(jobBoardPostings.id, id));
    return p;
  }
}

export const storage = new DatabaseStorage();
