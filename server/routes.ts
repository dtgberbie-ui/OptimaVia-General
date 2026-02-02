import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { db } from "./db";
import { users, jobs, workerProfiles, applications } from "@shared/schema";
import { eq } from "drizzle-orm";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up Authentication (Session + Passport)
  setupAuth(app);

  // === EMPLOYER ROUTES ===
  
  app.post(api.employer.createProfile.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.createProfile.input.parse(req.body);
      // Force user ID from session
      const profile = await storage.createEmployerProfile({ ...input, userId: (req.user as any).id });
      res.status(201).json(profile);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.get(api.employer.getProfile.path, async (req, res) => {
    const profile = await storage.getEmployerProfile(Number(req.params.userId));
    if (!profile) return res.status(404).send("Not found");
    res.json(profile);
  });

  app.post(api.employer.createJob.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.createJob.input.parse(req.body);
      const job = await storage.createJob({ ...input, employerId: (req.user as any).id });
      res.status(201).json(job);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.get(api.employer.myJobs.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const jobs = await storage.getJobsByEmployer((req.user as any).id);
    res.json(jobs);
  });

  app.get(api.employer.jobApplications.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    // Verify job belongs to employer
    const job = await storage.getJob(Number(req.params.jobId));
    if (!job || job.employerId !== (req.user as any).id) {
      return res.status(403).send("Forbidden");
    }

    const apps = await storage.getApplicationsByJob(Number(req.params.jobId));
    
    // Enrich with worker details
    const enrichedApps = await Promise.all(apps.map(async (app) => {
      const worker = await storage.getUser(app.workerId);
      const workerProfile = await storage.getWorkerProfile(app.workerId);
      return { ...app, worker: { ...worker!, workerProfile: workerProfile || null } };
    }));

    res.json(enrichedApps);
  });

  app.patch(api.employer.updateApplicationStatus.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { status, notes } = api.employer.updateApplicationStatus.input.parse(req.body);
      const updated = await storage.updateApplicationStatus(Number(req.params.id), status, notes);
      res.json(updated);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  // === STAFF MANAGEMENT ===

  app.get(api.employer.listStaff.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    const staffList = await storage.getStaffByEmployer((req.user as any).id);
    
    // Enrich with worker profiles
    const enrichedStaff = await Promise.all(staffList.map(async (s) => {
      const workerProfile = await storage.getWorkerProfile(s.workerId);
      return { ...s, workerProfile: workerProfile || null };
    }));
    
    res.json(enrichedStaff);
  });

  app.get(api.employer.getStaff.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const s = await storage.getStaff(Number(req.params.id));
    if (!s || s.employerId !== (req.user as any).id) return res.status(404).send("Not found");
    
    const workerProfile = await storage.getWorkerProfile(s.workerId);
    const history = await storage.getEmploymentHistory(s.id);
    
    res.json({ ...s, workerProfile, history });
  });

  app.post(api.employer.createStaff.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.createStaff.input.parse(req.body);
      const newStaff = await storage.createStaff({ ...input, employerId: (req.user as any).id });
      res.status(201).json(newStaff);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.patch(api.employer.updateStaff.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.updateStaff.input.parse(req.body);
      const updated = await storage.updateStaff(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  // === TASKS ===

  app.get(api.employer.listTasks.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    const taskList = await storage.getTasksByEmployer((req.user as any).id);
    
    // Enrich with assignee
    const enrichedTasks = await Promise.all(taskList.map(async (t) => {
      if (t.staffId) {
        const assignee = await storage.getStaff(t.staffId);
        const profile = assignee ? await storage.getWorkerProfile(assignee.workerId) : null;
        return { ...t, assignee: assignee ? { ...assignee, workerProfile: profile } : null };
      }
      return { ...t, assignee: null };
    }));
    
    res.json(enrichedTasks);
  });

  app.post(api.employer.createTask.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.createTask.input.parse(req.body);
      const newTask = await storage.createTask({ ...input, employerId: (req.user as any).id });
      res.status(201).json(newTask);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.patch(api.employer.updateTask.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.updateTask.input.parse(req.body);
      const updated = await storage.updateTask(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.delete(api.employer.deleteTask.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    await storage.deleteTask(Number(req.params.id));
    res.status(204).send();
  });

  // === FINANCIAL TRACKING ===

  app.get(api.employer.listTransactions.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    const { type, startDate, endDate } = req.query as any;
    const filters = {
      type,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    const txList = await storage.getTransactionsByEmployer((req.user as any).id, filters);
    res.json(txList);
  });

  app.post(api.employer.createTransaction.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.createTransaction.input.parse(req.body);
      const newTx = await storage.createTransaction({ ...input, employerId: (req.user as any).id });
      res.status(201).json(newTx);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.get(api.employer.getFinancialSummary.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    const summary = await storage.getFinancialSummary((req.user as any).id);
    res.json(summary);
  });

  // === JOB BOARD POSTINGS ===

  app.get(api.employer.listJobPostings.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const postings = await storage.getJobBoardPostings(Number(req.params.jobId));
    res.json(postings);
  });

  app.post(api.employer.createJobPosting.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.createJobPosting.input.parse(req.body);
      const newPosting = await storage.createJobBoardPosting({ ...input, jobId: Number(req.params.jobId) });
      res.status(201).json(newPosting);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.post(api.employer.postToJobBoard.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const posting = await storage.getJobBoardPosting(Number(req.params.id));
      if (!posting) return res.status(404).send("Not found");

      // Simulate posting to external job board (Indeed, etc.)
      // In production, this would call the Indeed API with the employer's credentials
      const externalId = `EXT-${Date.now()}-${Math.random().toString(36).substring(7)}`;
      
      await storage.updateJobBoardPosting(posting.id, {
        status: "posted",
        externalId,
        postedAt: new Date(),
      } as any);

      res.json({ 
        success: true, 
        externalId, 
        message: `Successfully posted to ${posting.platform}. External ID: ${externalId}` 
      });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to post to job board" });
    }
  });

  // === WORKER ROUTES ===

  app.post(api.worker.createProfile.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.worker.createProfile.input.parse(req.body);
      const profile = await storage.createWorkerProfile({ ...input, userId: (req.user as any).id });
      res.status(201).json(profile);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.get(api.worker.getProfile.path, async (req, res) => {
    const profile = await storage.getWorkerProfile(Number(req.params.userId));
    if (!profile) return res.status(404).send("Not found");
    res.json(profile);
  });

  app.post(api.worker.apply.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'worker') return res.status(401).send("Unauthorized");
    try {
      const input = api.worker.apply.input.parse(req.body);
      
      // Calculate Fit Score (Deterministic MVP Logic)
      const job = await storage.getJob(input.jobId);
      const workerProfile = await storage.getWorkerProfile((req.user as any).id);
      
      let score = 50; // Base score
      if (job && workerProfile) {
        // Role match
        if (workerProfile.roles.some(r => job.title.includes(r))) score += 20;
        // Certs match
        const matchingCerts = job.requiredCertifications.filter(c => workerProfile.certifications.includes(c));
        score += (matchingCerts.length * 10);
        // Experience
        if (workerProfile.experienceYears > 2) score += 10;
        
        // Cap at 100
        score = Math.min(100, score);
      }

      const app = await storage.createApplication({
        ...input,
        workerId: (req.user as any).id,
        fitScore: score,
        status: "New"
      });
      res.status(201).json(app);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.get(api.worker.myApplications.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const apps = await storage.getApplicationsByWorker((req.user as any).id);
    
    // Enrich with job details
    const enrichedApps = await Promise.all(apps.map(async (app) => {
      const job = await storage.getJob(app.jobId);
      return { ...app, job: job! };
    }));
    
    res.json(enrichedApps);
  });

  // === PUBLIC ROUTES ===

  app.get(api.jobs.list.path, async (req, res) => {
    const filters = req.query as { industry?: string; location?: string };
    const jobs = await storage.getJobs(filters);
    
    // Enrich with employer details
    const enrichedJobs = await Promise.all(jobs.map(async (job) => {
      const employer = await storage.getUser(job.employerId);
      const profile = await storage.getEmployerProfile(job.employerId);
      return { ...job, employer: { ...employer!, employerProfile: profile || null } };
    }));

    res.json(enrichedJobs);
  });

  app.get(api.jobs.get.path, async (req, res) => {
    const job = await storage.getJob(Number(req.params.id));
    if (!job) return res.status(404).send("Not found");
    
    const employer = await storage.getUser(job.employerId);
    const profile = await storage.getEmployerProfile(job.employerId);
    
    res.json({ ...job, employer: { ...employer!, employerProfile: profile || null } });
  });

  // === AI ROUTES ===

  app.post(api.ai.summarizeCandidate.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { workerProfileId, jobId } = req.body;
      const workerProfile = await storage.getWorkerProfile(workerProfileId);
      const job = await storage.getJob(jobId);

      if (!workerProfile || !job) return res.status(404).send("Profile or Job not found");

      const prompt = `
        Summarize this candidate for the job of ${job.title} in 3 bullet points.
        Candidate: ${workerProfile.name}
        Roles: ${workerProfile.roles.join(", ")}
        Experience: ${workerProfile.experienceYears} years
        Certs: ${workerProfile.certifications.join(", ")}
        Availability: ${workerProfile.availability}
        Job Req: ${job.description}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });

      const summaryText = response.choices[0].message.content || "";
      // Naive split, AI usually outputs bullets
      const summary = summaryText.split("\n").filter(line => line.trim().length > 0);

      res.json({ summary });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "AI Error" });
    }
  });

  app.post(api.ai.draftOutreach.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { workerProfileId, jobId, type } = req.body;
      const workerProfile = await storage.getWorkerProfile(workerProfileId);
      const job = await storage.getJob(jobId);
      
      if (!workerProfile || !job) return res.status(404).send("Profile or Job not found");

      const prompt = `
        Draft a short, professional ${type} inviting ${workerProfile.name} to interview for ${job.title} at ${job.location}.
        Mention their experience (${workerProfile.experienceYears} years) as a highlight.
        Keep it under 100 words.
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
      });

      res.json({ message: response.choices[0].message.content || "", subject: `Interview for ${job.title}` });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "AI Error" });
    }
  });

  // === SEED DATA ===
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) return;

  console.log("Seeding database...");

  // Create Employers
  const emp1 = await storage.createUser({ username: "logistics_inc", password: "password", role: "employer" });
  await storage.createEmployerProfile({
    userId: emp1.id,
    companyName: "Swift Logistics",
    industry: "Logistics",
    location: "Chicago, IL"
  });

  const emp2 = await storage.createUser({ username: "care_plus", password: "password", role: "employer" });
  await storage.createEmployerProfile({
    userId: emp2.id,
    companyName: "CarePlus Home Health",
    industry: "Healthcare",
    location: "Phoenix, AZ"
  });

  // Create Jobs
  await storage.createJob({
    employerId: emp1.id,
    title: "CDL-A Truck Driver",
    description: "Regional route, home weekends. Clean driving record required.",
    industry: "Logistics",
    location: "Chicago, IL",
    payMin: 60000,
    payMax: 80000,
    requiredCertifications: ["CDL-A"],
    status: "OPEN"
  });

  const job2 = await storage.createJob({
    employerId: emp2.id,
    title: "Certified Nursing Assistant (CNA)",
    description: "In-home care for seniors. Flexible shifts.",
    industry: "Healthcare",
    location: "Phoenix, AZ",
    payMin: 35000,
    payMax: 45000,
    requiredCertifications: ["CNA", "CPR"],
    status: "OPEN"
  });

  // Create Workers
  const worker1 = await storage.createUser({ username: "driver_dave", password: "password", role: "worker" });
  await storage.createWorkerProfile({
    userId: worker1.id,
    name: "Dave Miller",
    phone: "555-0101",
    location: "Chicago, IL",
    roles: ["Truck Driver"],
    experienceYears: 5,
    certifications: ["CDL-A"],
    availability: "Full-time"
  });

  const worker2 = await storage.createUser({ username: "nurse_sarah", password: "password", role: "worker" });
  await storage.createWorkerProfile({
    userId: worker2.id,
    name: "Sarah Jones",
    phone: "555-0102",
    location: "Phoenix, AZ",
    roles: ["CNA", "Caregiver"],
    experienceYears: 3,
    certifications: ["CNA", "CPR"],
    availability: "Part-time"
  });

  // Create Application
  await storage.createApplication({
    jobId: job2.id,
    workerId: worker2.id,
    status: "New",
    fitScore: 85,
    notes: "Looks like a great fit."
  });

  console.log("Database seeded!");
}
