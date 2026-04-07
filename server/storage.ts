import { db } from "./db";
import { 
  users, employerProfiles, workerProfiles, jobs, applications,
  staff, employmentHistory, tasks, transactions, jobBoardPostings,
  jobDistributions, integrationCredentials, applicationClicks,
  industryConfigs, scheduleShifts,
  serviceJobs, jobPhotos, ingredients, products, productIngredients,
  type User, type InsertUser,
  type EmployerProfile, type InsertEmployerProfile,
  type WorkerProfile, type InsertWorkerProfile,
  type Job, type InsertJob,
  type Application, type InsertApplication,
  type Staff, type InsertStaff,
  type EmploymentHistoryRecord, type InsertEmploymentHistory,
  type Task, type InsertTask,
  type Transaction, type InsertTransaction,
  type JobBoardPosting, type InsertJobBoardPosting,
  type JobDistribution, type InsertJobDistribution,
  type IntegrationCredential, type InsertIntegrationCredential,
  type ApplicationClick, type InsertApplicationClick,
  type IndustryConfig, type InsertIndustryConfig,
  type ScheduleShift, type InsertScheduleShift,
  type ServiceJob, type InsertServiceJob,
  type JobPhoto, type InsertJobPhoto,
  type Ingredient, type InsertIngredient,
  type Product, type InsertProduct,
  type ProductIngredient, type InsertProductIngredient,
  type ServiceJobWithDetails, type ProductWithIngredients
} from "@shared/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { role: string }): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  getEmployeesByBusiness(businessId: number): Promise<User[]>;

  getEmployerProfile(userId: number): Promise<EmployerProfile | undefined>;
  createEmployerProfile(profile: InsertEmployerProfile): Promise<EmployerProfile>;
  updateEmployerProfile(userId: number, updates: Partial<InsertEmployerProfile>): Promise<EmployerProfile>;
  
  getWorkerProfile(userId: number): Promise<WorkerProfile | undefined>;
  createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile>;

  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<Job | undefined>;
  getJobs(filters?: { industry?: string; location?: string }): Promise<Job[]>;
  getJobsByEmployer(employerId: number): Promise<Job[]>;
  getPublishedJobs(): Promise<Job[]>;
  getPublishedJobsByEmployer(employerId: number): Promise<Job[]>;
  updateJob(id: number, updates: Partial<InsertJob>): Promise<Job>;

  createApplication(app: InsertApplication): Promise<Application>;
  getApplicationsByJob(jobId: number): Promise<Application[]>;
  getApplicationsByWorker(workerId: number): Promise<Application[]>;
  getApplicationsByEmployer(employerId: number): Promise<Application[]>;
  updateApplicationStatus(id: number, status: string, notes?: string): Promise<Application>;

  getStaffByEmployer(employerId: number): Promise<Staff[]>;
  getStaff(id: number): Promise<Staff | undefined>;
  createStaff(s: InsertStaff): Promise<Staff>;
  updateStaff(id: number, updates: Partial<InsertStaff>): Promise<Staff>;
  getEmploymentHistory(staffId: number): Promise<EmploymentHistoryRecord[]>;
  addEmploymentHistory(h: InsertEmploymentHistory): Promise<EmploymentHistoryRecord>;

  getTasksByEmployer(employerId: number): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(t: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: number): Promise<void>;

  getTransactionsByEmployer(employerId: number, filters?: { type?: string; startDate?: Date; endDate?: Date }): Promise<Transaction[]>;
  createTransaction(t: InsertTransaction): Promise<Transaction>;
  deleteTransaction(id: number): Promise<void>;
  getFinancialSummary(employerId: number): Promise<{ totalRevenue: number; totalExpenses: number; netIncome: number }>;

  getJobBoardPostings(jobId: number): Promise<JobBoardPosting[]>;
  createJobBoardPosting(p: InsertJobBoardPosting): Promise<JobBoardPosting>;
  updateJobBoardPosting(id: number, updates: Partial<InsertJobBoardPosting>): Promise<JobBoardPosting>;
  getJobBoardPosting(id: number): Promise<JobBoardPosting | undefined>;

  getDistributionsByJob(jobId: number): Promise<JobDistribution[]>;
  createDistribution(d: InsertJobDistribution): Promise<JobDistribution>;
  updateDistribution(id: number, updates: Partial<InsertJobDistribution>): Promise<JobDistribution>;

  getIntegrationsByEmployer(employerId: number): Promise<IntegrationCredential[]>;
  createIntegrationCredential(c: InsertIntegrationCredential): Promise<IntegrationCredential>;

  recordClick(click: InsertApplicationClick): Promise<ApplicationClick>;
  getClicksByJob(jobId: number): Promise<ApplicationClick[]>;

  getIndustryConfigs(): Promise<IndustryConfig[]>;
  getIndustryConfigByName(name: string): Promise<IndustryConfig | undefined>;
  createIndustryConfig(config: InsertIndustryConfig): Promise<IndustryConfig>;

  getShiftsByEmployer(employerId: number): Promise<ScheduleShift[]>;
  getShift(id: number): Promise<ScheduleShift | undefined>;
  createShift(shift: InsertScheduleShift): Promise<ScheduleShift>;
  updateShift(id: number, updates: Partial<InsertScheduleShift>): Promise<ScheduleShift>;
  deleteShift(id: number): Promise<void>;

  // Field Service Module
  getServiceJobsByBusiness(businessId: number): Promise<ServiceJobWithDetails[]>;
  getServiceJobsByEmployee(employeeId: number): Promise<ServiceJobWithDetails[]>;
  getServiceJob(id: number): Promise<ServiceJobWithDetails | undefined>;
  createServiceJob(j: InsertServiceJob): Promise<ServiceJob>;
  updateServiceJob(id: number, updates: Partial<InsertServiceJob & { startedAt?: Date; completedAt?: Date }>): Promise<ServiceJob>;
  deleteServiceJob(id: number): Promise<void>;
  addJobPhoto(photo: InsertJobPhoto): Promise<JobPhoto>;
  getJobPhotos(jobId: number): Promise<JobPhoto[]>;

  // Product Costing Module
  getIngredientsByBusiness(businessId: number): Promise<Ingredient[]>;
  getIngredient(id: number): Promise<Ingredient | undefined>;
  createIngredient(ing: InsertIngredient): Promise<Ingredient>;
  updateIngredient(id: number, updates: Partial<InsertIngredient>): Promise<Ingredient>;
  deleteIngredient(id: number): Promise<void>;

  getProductsByBusiness(businessId: number): Promise<ProductWithIngredients[]>;
  getProduct(id: number): Promise<ProductWithIngredients | undefined>;
  createProduct(p: InsertProduct): Promise<Product>;
  updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<void>;

  setProductIngredients(productId: number, items: Omit<InsertProductIngredient, "productId">[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser & { role: string }): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [updated] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return updated;
  }

  async getEmployeesByBusiness(businessId: number): Promise<User[]> {
    return await db.select().from(users).where(eq(users.businessId, businessId));
  }

  async getEmployerProfile(userId: number): Promise<EmployerProfile | undefined> {
    const [profile] = await db.select().from(employerProfiles).where(eq(employerProfiles.userId, userId));
    return profile;
  }

  async createEmployerProfile(profile: InsertEmployerProfile): Promise<EmployerProfile> {
    const [newProfile] = await db.insert(employerProfiles).values(profile).returning();
    return newProfile;
  }

  async updateEmployerProfile(userId: number, updates: Partial<InsertEmployerProfile>): Promise<EmployerProfile> {
    const [updated] = await db.update(employerProfiles).set(updates).where(eq(employerProfiles.userId, userId)).returning();
    return updated;
  }

  async getWorkerProfile(userId: number): Promise<WorkerProfile | undefined> {
    const [profile] = await db.select().from(workerProfiles).where(eq(workerProfiles.userId, userId));
    return profile;
  }

  async createWorkerProfile(profile: InsertWorkerProfile): Promise<WorkerProfile> {
    const [newProfile] = await db.insert(workerProfiles).values(profile).returning();
    return newProfile;
  }

  async createJob(job: InsertJob): Promise<Job> {
    const [newJob] = await db.insert(jobs).values(job).returning();
    return newJob;
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job;
  }

  async getJobs(filters?: { industry?: string; location?: string }): Promise<Job[]> {
    const conditions = [];
    if (filters?.industry) conditions.push(eq(jobs.industry, filters.industry));
    if (filters?.location) conditions.push(eq(jobs.location, filters.location));
    if (conditions.length > 0) return await db.select().from(jobs).where(and(...conditions));
    return await db.select().from(jobs);
  }

  async getJobsByEmployer(employerId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.employerId, employerId));
  }

  async getPublishedJobs(): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.status, "OPEN"));
  }

  async getPublishedJobsByEmployer(employerId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(and(eq(jobs.employerId, employerId), eq(jobs.status, "OPEN")));
  }

  async updateJob(id: number, updates: Partial<InsertJob>): Promise<Job> {
    const [updated] = await db.update(jobs).set({ ...updates, updatedAt: new Date() }).where(eq(jobs.id, id)).returning();
    return updated;
  }

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

  async getApplicationsByEmployer(employerId: number): Promise<Application[]> {
    const employerJobs = await db.select({ id: jobs.id }).from(jobs).where(eq(jobs.employerId, employerId));
    if (employerJobs.length === 0) return [];
    const allApps: Application[] = [];
    for (const j of employerJobs) {
      const apps = await db.select().from(applications).where(eq(applications.jobId, j.id));
      allApps.push(...apps);
    }
    return allApps;
  }

  async updateApplicationStatus(id: number, status: string, notes?: string): Promise<Application> {
    const [updated] = await db.update(applications).set({ status, notes }).where(eq(applications.id, id)).returning();
    return updated;
  }

  async getStaffByEmployer(employerId: number): Promise<Staff[]> {
    return await db.select().from(staff).where(eq(staff.employerId, employerId));
  }

  async getStaff(id: number): Promise<Staff | undefined> {
    const [s] = await db.select().from(staff).where(eq(staff.id, id));
    return s;
  }

  async createStaff(s: InsertStaff): Promise<Staff> {
    const [newStaff] = await db.insert(staff).values(s).returning();
    await db.insert(employmentHistory).values({ staffId: newStaff.id, action: "hired", description: `Hired as ${s.position}` });
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

  async deleteTransaction(id: number): Promise<void> {
    await db.delete(transactions).where(eq(transactions.id, id));
  }

  async getFinancialSummary(employerId: number): Promise<{ totalRevenue: number; totalExpenses: number; netIncome: number }> {
    const allTx = await db.select().from(transactions).where(eq(transactions.employerId, employerId));
    const totalRevenue = allTx.filter(t => t.type === "revenue").reduce((s, t) => s + t.amount, 0);
    const totalExpenses = allTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses };
  }

  async getJobBoardPostings(jobId: number): Promise<JobBoardPosting[]> {
    return await db.select().from(jobBoardPostings).where(eq(jobBoardPostings.jobId, jobId));
  }

  async createJobBoardPosting(p: InsertJobBoardPosting): Promise<JobBoardPosting> {
    const [posting] = await db.insert(jobBoardPostings).values(p).returning();
    return posting;
  }

  async updateJobBoardPosting(id: number, updates: Partial<InsertJobBoardPosting>): Promise<JobBoardPosting> {
    const [updated] = await db.update(jobBoardPostings).set(updates).where(eq(jobBoardPostings.id, id)).returning();
    return updated;
  }

  async getJobBoardPosting(id: number): Promise<JobBoardPosting | undefined> {
    const [p] = await db.select().from(jobBoardPostings).where(eq(jobBoardPostings.id, id));
    return p;
  }

  async getDistributionsByJob(jobId: number): Promise<JobDistribution[]> {
    return await db.select().from(jobDistributions).where(eq(jobDistributions.jobId, jobId));
  }

  async createDistribution(d: InsertJobDistribution): Promise<JobDistribution> {
    const [dist] = await db.insert(jobDistributions).values(d).returning();
    return dist;
  }

  async updateDistribution(id: number, updates: Partial<InsertJobDistribution>): Promise<JobDistribution> {
    const [updated] = await db.update(jobDistributions).set(updates).where(eq(jobDistributions.id, id)).returning();
    return updated;
  }

  async getIntegrationsByEmployer(employerId: number): Promise<IntegrationCredential[]> {
    return await db.select().from(integrationCredentials).where(eq(integrationCredentials.employerId, employerId));
  }

  async createIntegrationCredential(c: InsertIntegrationCredential): Promise<IntegrationCredential> {
    const [cred] = await db.insert(integrationCredentials).values(c).returning();
    return cred;
  }

  async recordClick(click: InsertApplicationClick): Promise<ApplicationClick> {
    const [record] = await db.insert(applicationClicks).values(click).returning();
    return record;
  }

  async getClicksByJob(jobId: number): Promise<ApplicationClick[]> {
    return await db.select().from(applicationClicks).where(eq(applicationClicks.jobId, jobId));
  }

  async getIndustryConfigs(): Promise<IndustryConfig[]> {
    return await db.select().from(industryConfigs);
  }

  async getIndustryConfigByName(name: string): Promise<IndustryConfig | undefined> {
    const [config] = await db.select().from(industryConfigs).where(eq(industryConfigs.industryName, name));
    return config;
  }

  async createIndustryConfig(config: InsertIndustryConfig): Promise<IndustryConfig> {
    const [newConfig] = await db.insert(industryConfigs).values(config).returning();
    return newConfig;
  }

  async getShiftsByEmployer(employerId: number): Promise<ScheduleShift[]> {
    return await db.select().from(scheduleShifts).where(eq(scheduleShifts.employerId, employerId)).orderBy(desc(scheduleShifts.date));
  }

  async getShift(id: number): Promise<ScheduleShift | undefined> {
    const [shift] = await db.select().from(scheduleShifts).where(eq(scheduleShifts.id, id));
    return shift;
  }

  async createShift(shift: InsertScheduleShift): Promise<ScheduleShift> {
    const [newShift] = await db.insert(scheduleShifts).values(shift).returning();
    return newShift;
  }

  async updateShift(id: number, updates: Partial<InsertScheduleShift>): Promise<ScheduleShift> {
    const [updated] = await db.update(scheduleShifts).set(updates).where(eq(scheduleShifts.id, id)).returning();
    return updated;
  }

  async deleteShift(id: number): Promise<void> {
    await db.delete(scheduleShifts).where(eq(scheduleShifts.id, id));
  }

  // === FIELD SERVICE MODULE ===

  private async enrichServiceJob(job: ServiceJob): Promise<ServiceJobWithDetails> {
    const photos = await db.select().from(jobPhotos).where(eq(jobPhotos.jobId, job.id));
    let assignedEmployee: User | null = null;
    if (job.assignedTo) {
      const [emp] = await db.select().from(users).where(eq(users.id, job.assignedTo));
      assignedEmployee = emp ?? null;
    }
    return { ...job, assignedEmployee, photos };
  }

  async getServiceJobsByBusiness(businessId: number): Promise<ServiceJobWithDetails[]> {
    const rawJobs = await db.select().from(serviceJobs).where(eq(serviceJobs.businessId, businessId)).orderBy(desc(serviceJobs.createdAt));
    return Promise.all(rawJobs.map(j => this.enrichServiceJob(j)));
  }

  async getServiceJobsByEmployee(employeeId: number): Promise<ServiceJobWithDetails[]> {
    const rawJobs = await db.select().from(serviceJobs).where(eq(serviceJobs.assignedTo, employeeId)).orderBy(desc(serviceJobs.scheduledDate));
    return Promise.all(rawJobs.map(j => this.enrichServiceJob(j)));
  }

  async getServiceJob(id: number): Promise<ServiceJobWithDetails | undefined> {
    const [job] = await db.select().from(serviceJobs).where(eq(serviceJobs.id, id));
    if (!job) return undefined;
    return this.enrichServiceJob(job);
  }

  async createServiceJob(j: InsertServiceJob): Promise<ServiceJob> {
    const [newJob] = await db.insert(serviceJobs).values(j).returning();
    return newJob;
  }

  async updateServiceJob(id: number, updates: Partial<InsertServiceJob & { startedAt?: Date; completedAt?: Date }>): Promise<ServiceJob> {
    const [updated] = await db.update(serviceJobs).set(updates as any).where(eq(serviceJobs.id, id)).returning();
    return updated;
  }

  async deleteServiceJob(id: number): Promise<void> {
    await db.delete(jobPhotos).where(eq(jobPhotos.jobId, id));
    await db.delete(serviceJobs).where(eq(serviceJobs.id, id));
  }

  async addJobPhoto(photo: InsertJobPhoto): Promise<JobPhoto> {
    const [newPhoto] = await db.insert(jobPhotos).values(photo).returning();
    return newPhoto;
  }

  async getJobPhotos(jobId: number): Promise<JobPhoto[]> {
    return await db.select().from(jobPhotos).where(eq(jobPhotos.jobId, jobId));
  }

  // === PRODUCT COSTING MODULE ===

  async getIngredientsByBusiness(businessId: number): Promise<Ingredient[]> {
    return await db.select().from(ingredients).where(eq(ingredients.businessId, businessId)).orderBy(desc(ingredients.createdAt));
  }

  async getIngredient(id: number): Promise<Ingredient | undefined> {
    const [ing] = await db.select().from(ingredients).where(eq(ingredients.id, id));
    return ing;
  }

  async createIngredient(ing: InsertIngredient): Promise<Ingredient> {
    const [newIng] = await db.insert(ingredients).values(ing).returning();
    return newIng;
  }

  async updateIngredient(id: number, updates: Partial<InsertIngredient>): Promise<Ingredient> {
    const [updated] = await db.update(ingredients).set(updates).where(eq(ingredients.id, id)).returning();
    return updated;
  }

  async deleteIngredient(id: number): Promise<void> {
    await db.delete(productIngredients).where(eq(productIngredients.ingredientId, id));
    await db.delete(ingredients).where(eq(ingredients.id, id));
  }

  private async enrichProduct(p: Product): Promise<ProductWithIngredients> {
    const pis = await db.select().from(productIngredients).where(eq(productIngredients.productId, p.id));
    const enriched = await Promise.all(pis.map(async pi => {
      const [ing] = await db.select().from(ingredients).where(eq(ingredients.id, pi.ingredientId));
      return { ...pi, ingredient: ing };
    }));
    const totalBatchCost = enriched.reduce((sum, pi) => sum + (pi.ingredient?.costPerUnit ?? 0) * pi.quantityPerUnit, 0);
    const batchYield = p.batchYield ?? 1;
    const costPerUnit = totalBatchCost / batchYield;
    return { ...p, productIngredients: enriched, costPerUnit };
  }

  async getProductsByBusiness(businessId: number): Promise<ProductWithIngredients[]> {
    const rawProducts = await db.select().from(products).where(eq(products.businessId, businessId)).orderBy(desc(products.createdAt));
    return Promise.all(rawProducts.map(p => this.enrichProduct(p)));
  }

  async getProduct(id: number): Promise<ProductWithIngredients | undefined> {
    const [p] = await db.select().from(products).where(eq(products.id, id));
    if (!p) return undefined;
    return this.enrichProduct(p);
  }

  async createProduct(p: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(p).returning();
    return newProduct;
  }

  async updateProduct(id: number, updates: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<void> {
    await db.delete(productIngredients).where(eq(productIngredients.productId, id));
    await db.delete(products).where(eq(products.id, id));
  }

  async setProductIngredients(productId: number, items: Omit<InsertProductIngredient, "productId">[]): Promise<void> {
    await db.delete(productIngredients).where(eq(productIngredients.productId, productId));
    if (items.length > 0) {
      await db.insert(productIngredients).values(items.map(i => ({ ...i, productId })));
    }
  }
}

export const storage = new DatabaseStorage();
