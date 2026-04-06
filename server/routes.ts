import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";
import { db } from "./db";
import { users, jobs, workerProfiles, applications, employerProfiles, industryConfigs, scheduleShifts, serviceJobs } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import crypto, { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function generateJobXml(job: any, employerProfile: any, baseUrl: string): string {
  const applyUrl = `${baseUrl}/jobs/${job.id}`;
  return `  <job>
    <job_id>${job.id}</job_id>
    <title>${escapeXml(job.title)}</title>
    <description><![CDATA[${job.description}]]></description>
    <location>${escapeXml(job.location)}</location>
    <country>${escapeXml(employerProfile?.country || '')}</country>
    <region>${escapeXml(job.location)}</region>
    <city>${escapeXml(job.city || '')}</city>
    <employment_type>${escapeXml(job.employmentType || 'full-time')}</employment_type>
    <salary_min>${job.payMin}</salary_min>
    <salary_max>${job.payMax}</salary_max>
    <salary_currency>USD</salary_currency>
    <apply_url>${escapeXml(applyUrl)}</apply_url>
    <company_name>${escapeXml(employerProfile?.companyName || 'Unknown')}</company_name>
    <posted_date>${job.createdAt ? new Date(job.createdAt).toISOString() : ''}</posted_date>
    <updated_date>${job.updatedAt ? new Date(job.updatedAt).toISOString() : ''}</updated_date>
    <category>${escapeXml(job.industry)}</category>
  </job>`;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  setupAuth(app);

  // === EMPLOYER ROUTES ===
  
  app.post(api.employer.createProfile.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.createProfile.input.parse(req.body);
      const feedToken = crypto.randomBytes(16).toString('hex');
      const profile = await storage.createEmployerProfile({ ...input, userId: (req.user as any).id, feedToken });
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

  app.patch(api.employer.updateJob.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const job = await storage.getJob(Number(req.params.id));
      if (!job || job.employerId !== (req.user as any).id) return res.status(404).send("Not found");
      const input = api.employer.updateJob.input.parse(req.body);
      const updated = await storage.updateJob(Number(req.params.id), input);
      res.json(updated);
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
    
    const job = await storage.getJob(Number(req.params.jobId));
    if (!job || job.employerId !== (req.user as any).id) {
      return res.status(403).send("Forbidden");
    }

    const apps = await storage.getApplicationsByJob(Number(req.params.jobId));
    
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
      const body = { ...req.body, date: req.body.date ? new Date(req.body.date) : new Date() };
      const input = api.employer.createTransaction.input.parse(body);
      const newTx = await storage.createTransaction({ ...input, employerId: (req.user as any).id });
      res.status(201).json(newTx);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.delete("/api/employer/transactions/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      await storage.deleteTransaction(parseInt(req.params.id));
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete transaction" });
    }
  });

  app.get(api.employer.getFinancialSummary.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    const summary = await storage.getFinancialSummary((req.user as any).id);
    res.json(summary);
  });

  // === JOB BOARD POSTINGS (Legacy) ===

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

  // === JOB DISTRIBUTIONS ===

  app.get(api.employer.listDistributions.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const distributions = await storage.getDistributionsByJob(Number(req.params.jobId));
    res.json(distributions);
  });

  app.post(api.employer.createDistribution.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.createDistribution.input.parse(req.body);
      const dist = await storage.createDistribution({ ...input, jobId: Number(req.params.jobId) });
      res.status(201).json(dist);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.patch(api.employer.updateDistribution.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.updateDistribution.input.parse(req.body);
      const updated = await storage.updateDistribution(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  // === INTEGRATIONS ===

  app.get(api.employer.listIntegrations.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    const integrations = await storage.getIntegrationsByEmployer((req.user as any).id);
    res.json(integrations);
  });

  // === HIRING STATS ===

  app.get(api.employer.hiringStats.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    const employerId = (req.user as any).id;
    
    const employerJobs = await storage.getJobsByEmployer(employerId);
    const openJobs = employerJobs.filter(j => j.status === "OPEN").length;
    const allApps = await storage.getApplicationsByEmployer(employerId);
    const integrations = await storage.getIntegrationsByEmployer(employerId);
    const connectedCount = integrations.filter(i => i.status === "CONNECTED").length;
    const profile = await storage.getEmployerProfile(employerId);
    
    res.json({
      openJobs,
      totalApplicants: allApps.length,
      integrationsConnected: connectedCount,
      feedEnabled: !!profile?.feedToken,
    });
  });

  // === SCHEDULE SHIFTS ===

  app.get(api.employer.listShifts.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    const shifts = await storage.getShiftsByEmployer((req.user as any).id);
    const staffList = await storage.getStaffByEmployer((req.user as any).id);
    const shiftsWithStaff = shifts.map(shift => ({
      ...shift,
      staffMember: shift.staffId ? staffList.find(s => s.id === shift.staffId) : null,
    }));
    res.json(shiftsWithStaff);
  });

  app.post(api.employer.createShift.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.createShift.input.parse(req.body);
      const shift = await storage.createShift({ ...input, employerId: (req.user as any).id });
      res.status(201).json(shift);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.patch(api.employer.updateShift.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    try {
      const input = api.employer.updateShift.input.parse(req.body);
      const updated = await storage.updateShift(Number(req.params.id), input);
      res.json(updated);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.delete(api.employer.deleteShift.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    await storage.deleteShift(Number(req.params.id));
    res.json({ success: true });
  });

  // === DASHBOARD STATS ===

  app.get(api.employer.dashboardStats.path, async (req, res) => {
    if (!req.isAuthenticated() || (req.user as any).role !== 'employer') return res.status(401).send("Unauthorized");
    const employerId = (req.user as any).id;

    const [employerJobs, staffList, taskList, financialSummary, shifts] = await Promise.all([
      storage.getJobsByEmployer(employerId),
      storage.getStaffByEmployer(employerId),
      storage.getTasksByEmployer(employerId),
      storage.getFinancialSummary(employerId),
      storage.getShiftsByEmployer(employerId),
    ]);

    const now = new Date();
    res.json({
      openJobs: employerJobs.filter(j => j.status === "OPEN").length,
      totalStaff: staffList.length,
      activeStaff: staffList.filter(s => s.status === "active").length,
      pendingTasks: taskList.filter(t => t.status === "pending" || t.status === "in_progress").length,
      completedTasks: taskList.filter(t => t.status === "completed").length,
      totalRevenue: financialSummary.totalRevenue,
      totalExpenses: financialSummary.totalExpenses,
      netIncome: financialSummary.netIncome,
      upcomingShifts: shifts.filter(s => s.date && new Date(s.date) >= now).length,
    });
  });

  // === INDUSTRY CONFIGS ===

  app.get(api.industryConfig.list.path, async (_req, res) => {
    const configs = await storage.getIndustryConfigs();
    res.json(configs);
  });

  app.get(api.industryConfig.getByIndustry.path, async (req, res) => {
    const config = await storage.getIndustryConfigByName(decodeURIComponent(req.params.industry));
    if (!config) return res.status(404).json({ message: "Industry config not found" });
    res.json(config);
  });

  // === XML FEED ENDPOINTS ===

  app.get(api.feed.publicFeed.path, async (req, res) => {
    try {
      const publishedJobs = await storage.getPublishedJobs();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      let xmlJobs = '';
      for (const job of publishedJobs) {
        const profile = await storage.getEmployerProfile(job.employerId);
        xmlJobs += generateJobXml(job, profile, baseUrl) + '\n';
      }
      
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<jobs updated="${new Date().toISOString()}">
${xmlJobs}</jobs>`;

      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      res.status(500).send("Feed generation error");
    }
  });

  app.get(api.feed.employerFeed.path, async (req, res) => {
    try {
      const employerId = Number(req.params.employerId);
      const token = req.query.token as string;
      
      const profile = await storage.getEmployerProfile(employerId);
      if (!profile) return res.status(404).send("Employer not found");
      
      if (profile.feedToken && profile.feedToken !== token) {
        return res.status(403).send("Invalid feed token");
      }
      
      const publishedJobs = await storage.getPublishedJobsByEmployer(employerId);
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      let xmlJobs = '';
      for (const job of publishedJobs) {
        xmlJobs += generateJobXml(job, profile, baseUrl) + '\n';
      }
      
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<jobs employer="${escapeXml(profile.companyName)}" updated="${new Date().toISOString()}">
${xmlJobs}</jobs>`;

      res.set('Content-Type', 'application/xml');
      res.send(xml);
    } catch (err) {
      res.status(500).send("Feed generation error");
    }
  });

  // === CLICK TRACKING ===

  app.post(api.tracking.recordClick.path, async (req, res) => {
    try {
      const { jobId, source, sourceUrl } = req.body;
      await storage.recordClick({ jobId, source, sourceUrl });
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ success: false });
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
      
      const job = await storage.getJob(input.jobId);
      const workerProfile = await storage.getWorkerProfile((req.user as any).id);
      
      let score = 50;
      if (job && workerProfile) {
        if (workerProfile.roles.some(r => job.title.includes(r))) score += 20;
        const matchingCerts = job.requiredCertifications.filter(c => workerProfile.certifications.includes(c));
        score += (matchingCerts.length * 10);
        if (workerProfile.experienceYears > 2) score += 10;
        score = Math.min(100, score);
      }

      const [application] = await db.insert(applications).values({
        jobId: input.jobId,
        workerId: (req.user as any).id,
        status: "New",
        fitScore: score,
      }).returning();
      res.status(201).json(application);
    } catch (err) {
      res.status(400).json(err);
    }
  });

  app.get(api.worker.myApplications.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    const apps = await storage.getApplicationsByWorker((req.user as any).id);
    
    const enrichedApps = await Promise.all(apps.map(async (app) => {
      const job = await storage.getJob(app.jobId);
      return { ...app, job: job! };
    }));
    
    res.json(enrichedApps);
  });

  // === PUBLIC ROUTES ===

  app.get(api.jobs.list.path, async (req, res) => {
    const filters = req.query as { industry?: string; location?: string };
    const allJobs = await storage.getJobs(filters);
    const publishedJobs = allJobs.filter(j => j.status === "OPEN");
    
    const enrichedJobs = await Promise.all(publishedJobs.map(async (job) => {
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

  app.post(api.ai.rewriteForBoard.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    try {
      const { jobId, board } = req.body;
      const job = await storage.getJob(jobId);
      if (!job) return res.status(404).send("Job not found");

      const employer = await storage.getUser(job.employerId);
      const profile = await storage.getEmployerProfile(job.employerId);

      try {
        const prompt = `Rewrite this job posting for ${board}. Keep all factual information accurate - do not invent benefits, pay, or requirements that aren't listed. Format it appropriately for ${board}'s style. Keep it concise and professional.

Job Title: ${job.title}
Company: ${profile?.companyName || 'Company'}
Location: ${job.location}${job.city ? ', ' + job.city : ''}
Type: ${job.employmentType || 'Full-time'}
Pay: $${job.payMin?.toLocaleString()} - $${job.payMax?.toLocaleString()}/year
Description: ${job.description}
${job.responsibilities ? 'Responsibilities: ' + job.responsibilities : ''}
${job.requirements ? 'Requirements: ' + job.requirements : ''}
${job.requiredCertifications?.length ? 'Required Certifications: ' + job.requiredCertifications.join(', ') : ''}
${job.schedule ? 'Schedule: ' + job.schedule : ''}
${job.benefits ? 'Benefits: ' + job.benefits : ''}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
        });

        res.json({ rewrittenText: response.choices[0].message.content || "" });
      } catch (aiErr) {
        const templateText = `${job.title} - ${profile?.companyName || 'Company'}

Location: ${job.location}${job.city ? ', ' + job.city : ''}
Type: ${job.employmentType || 'Full-time'}
Pay Range: $${job.payMin?.toLocaleString()} - $${job.payMax?.toLocaleString()}/year

About the Role:
${job.description}

${job.responsibilities ? 'Key Responsibilities:\n' + job.responsibilities + '\n' : ''}
${job.requirements ? 'Requirements:\n' + job.requirements + '\n' : ''}
${job.requiredCertifications?.length ? 'Required Certifications: ' + job.requiredCertifications.join(', ') + '\n' : ''}
${job.schedule ? 'Schedule: ' + job.schedule + '\n' : ''}
${job.benefits ? 'Benefits: ' + job.benefits + '\n' : ''}
Apply now at ${profile?.companyName || 'our company'}!`;

        res.json({ rewrittenText: templateText });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "AI Error" });
    }
  });

  // === EMPLOYEE MANAGEMENT ===

  app.get("/api/business/employees", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const employees = await storage.getEmployeesByBusiness(req.user.id);
    res.json(employees);
  });

  app.post("/api/business/employees", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { name, email, phone, password } = req.body;
    if (!password) return res.status(400).json({ message: "A temporary password is required" });

    // Derive a login handle: use email if provided, otherwise slug from name
    let loginHandle: string;
    if (email && email.trim()) {
      loginHandle = email.trim().toLowerCase();
      const existingByEmail = await storage.getUserByEmail(loginHandle);
      if (existingByEmail) return res.status(400).json({ message: "An account with that email already exists" });
    } else {
      if (!name) return res.status(400).json({ message: "Name or email is required" });
      const base = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
      const suffix = Math.floor(100 + Math.random() * 900);
      loginHandle = `${base}_${suffix}`;
      // Ensure unique
      let attempt = loginHandle;
      while (await storage.getUserByUsername(attempt)) {
        attempt = `${base}_${Math.floor(100 + Math.random() * 900)}`;
      }
      loginHandle = attempt;
    }

    const hashedPw = await hashPassword(password);
    const employee = await storage.createUser({
      username: loginHandle,
      password: hashedPw,
      role: "employee",
      name: name || null,
      email: email || null,
      phone: phone || null,
      businessId: req.user.id,
    });
    res.status(201).json({ ...employee, loginHandle });
  });

  app.patch("/api/business/employees/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    const updated = await storage.updateUser(id, req.body);
    res.json(updated);
  });

  app.patch("/api/business/employees/:id/password", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    const { password } = req.body;
    if (!password || password.length < 4) {
      return res.status(400).json({ message: "Password must be at least 4 characters" });
    }
    const hashedPw = await hashPassword(password);
    const updated = await storage.updateUser(id, { password: hashedPw });
    res.json({ success: true, username: updated.username });
  });

  // === SERVICE JOBS (FIELD SERVICE MODULE) ===

  app.get("/api/service-jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const user = req.user;
    if (user.role === "employee") {
      const jobs = await storage.getServiceJobsByEmployee(user.id);
      return res.json(jobs);
    }
    const jobs = await storage.getServiceJobsByBusiness(user.id);
    res.json(jobs);
  });

  app.get("/api/service-jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const job = await storage.getServiceJob(parseInt(req.params.id));
    if (!job) return res.status(404).json({ message: "Not found" });
    res.json(job);
  });

  app.post("/api/service-jobs", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const body = req.body;
    const job = await storage.createServiceJob({
      ...body,
      businessId: req.user.id,
      createdBy: req.user.id,
      status: body.assignedTo ? "assigned" : "unassigned",
    });
    res.status(201).json(job);
  });

  app.patch("/api/service-jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    const updates = { ...req.body };
    if (updates.status === "in_progress") updates.startedAt = new Date();
    if (updates.status === "completed") updates.completedAt = new Date();
    const job = await storage.updateServiceJob(id, updates);
    res.json(job);
  });

  app.delete("/api/service-jobs/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteServiceJob(parseInt(req.params.id));
    res.json({ success: true });
  });

  // Job photos
  app.get("/api/service-jobs/:id/photos", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const photos = await storage.getJobPhotos(parseInt(req.params.id));
    res.json(photos);
  });

  app.post("/api/service-jobs/:id/photos", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { photoUrl, photoType, note } = req.body;
    if (!photoUrl || !photoType) return res.status(400).json({ message: "photoUrl and photoType required" });
    const photo = await storage.addJobPhoto({
      jobId: parseInt(req.params.id),
      userId: req.user.id,
      photoUrl,
      photoType,
      note: note || null,
    });
    res.status(201).json(photo);
  });

  // === INGREDIENTS (PRODUCT COSTING MODULE) ===

  app.get("/api/ingredients", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const items = await storage.getIngredientsByBusiness(req.user.id);
    res.json(items);
  });

  app.post("/api/ingredients", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const item = await storage.createIngredient({ ...req.body, businessId: req.user.id });
    res.status(201).json(item);
  });

  app.patch("/api/ingredients/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const item = await storage.updateIngredient(parseInt(req.params.id), req.body);
    res.json(item);
  });

  app.delete("/api/ingredients/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteIngredient(parseInt(req.params.id));
    res.json({ success: true });
  });

  // === PRODUCTS (PRODUCT COSTING MODULE) ===

  app.get("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const items = await storage.getProductsByBusiness(req.user.id);
    res.json(items);
  });

  app.get("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const item = await storage.getProduct(parseInt(req.params.id));
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  });

  app.post("/api/products", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { ingredients: ingredientList, ...productData } = req.body;
    const product = await storage.createProduct({ ...productData, businessId: req.user.id });
    if (ingredientList && Array.isArray(ingredientList)) {
      await storage.setProductIngredients(product.id, ingredientList);
    }
    const enriched = await storage.getProduct(product.id);
    res.status(201).json(enriched);
  });

  app.patch("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const id = parseInt(req.params.id);
    const { ingredients: ingredientList, ...productData } = req.body;
    const product = await storage.updateProduct(id, productData);
    if (ingredientList !== undefined && Array.isArray(ingredientList)) {
      await storage.setProductIngredients(id, ingredientList);
    }
    const enriched = await storage.getProduct(product.id);
    res.json(enriched);
  });

  app.delete("/api/products/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    await storage.deleteProduct(parseInt(req.params.id));
    res.json({ success: true });
  });

  // === BUSINESS MODULE SETTINGS ===

  app.patch("/api/business/modules", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const { enabledModules, businessType } = req.body;
    const updated = await storage.updateEmployerProfile(req.user.id, { enabledModules, businessType });
    res.json(updated);
  });

  // === SEED DATA ===
  await seedDatabase();
  await seedIndustryConfigs();

  return httpServer;
}

async function seedDatabase() {
  // Check if demo accounts already exist
  const filtaUser = await storage.getUserByUsername("filta_raleigh");
  if (filtaUser) return;

  console.log("Seeding demo accounts...");

  const hashedPw = await hashPassword("password");

  // === FILTA RALEIGH — Field Service Business ===
  const filta = await storage.createUser({
    username: "filta_raleigh",
    password: hashedPw,
    role: "employer",
    name: "Filta Raleigh Manager",
    email: "manager@filtaraleigh.com",
  });
  await storage.createEmployerProfile({
    userId: filta.id,
    companyName: "Filta Raleigh",
    industry: "Field Service",
    country: "United States",
    location: "Raleigh, NC",
    businessType: "field_service",
    enabledModules: ["field_service", "finances", "team"],
    feedToken: crypto.randomBytes(16).toString('hex'),
  });

  const emp1 = await storage.createUser({
    username: "jake_filta",
    password: hashedPw,
    role: "employee",
    name: "Jake Martinez",
    email: "jake@filtaraleigh.com",
    phone: "919-555-0101",
    businessId: filta.id,
  });
  const emp2 = await storage.createUser({
    username: "maria_filta",
    password: hashedPw,
    role: "employee",
    name: "Maria Chen",
    email: "maria@filtaraleigh.com",
    phone: "919-555-0102",
    businessId: filta.id,
  });
  const emp3 = await storage.createUser({
    username: "deon_filta",
    password: hashedPw,
    role: "employee",
    name: "Deon Williams",
    email: "deon@filtaraleigh.com",
    phone: "919-555-0103",
    businessId: filta.id,
  });

  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);

  await storage.createServiceJob({
    businessId: filta.id,
    title: "Oil Filtration Service",
    clientName: "The Pit BBQ",
    serviceAddress: "328 W Davie St, Raleigh, NC 27601",
    scheduledDate: fmt(today),
    scheduledTime: "09:00",
    assignedTo: emp1.id,
    notes: "Monthly service. Customer prefers early morning. Side door access code: 4521.",
    status: "assigned",
    priority: "high",
    keyTrackingEnabled: true,
    createdBy: filta.id,
  });

  await storage.createServiceJob({
    businessId: filta.id,
    title: "Oil Filtration Service",
    clientName: "Beasley's Chicken + Honey",
    serviceAddress: "237 S Wilmington St, Raleigh, NC 27601",
    scheduledDate: fmt(today),
    scheduledTime: "11:00",
    assignedTo: emp2.id,
    notes: "Bi-weekly service. Ask for Carlos.",
    status: "in_progress",
    priority: "medium",
    keyTrackingEnabled: false,
    createdBy: filta.id,
  });

  await storage.createServiceJob({
    businessId: filta.id,
    title: "Oil Filtration Service",
    clientName: "State of Beer",
    serviceAddress: "1053 E Whitaker Mill Rd, Raleigh, NC 27604",
    scheduledDate: fmt(yesterday),
    scheduledTime: "14:00",
    assignedTo: emp3.id,
    notes: "Monthly service.",
    status: "completed",
    priority: "low",
    keyTrackingEnabled: false,
    createdBy: filta.id,
  });

  await storage.createServiceJob({
    businessId: filta.id,
    title: "Oil Filtration Service",
    clientName: "Coquette",
    serviceAddress: "4351 The Circle at N Hills St, Raleigh, NC 27609",
    scheduledDate: fmt(tomorrow),
    scheduledTime: "10:00",
    assignedTo: null,
    notes: "New client. Confirm contact with front desk before visit.",
    status: "unassigned",
    priority: "medium",
    keyTrackingEnabled: true,
    createdBy: filta.id,
  });

  // Some sample transactions for Filta
  await storage.createTransaction({ employerId: filta.id, type: "revenue", category: "Service", amount: 45000, description: "The Pit BBQ — monthly service", date: new Date() });
  await storage.createTransaction({ employerId: filta.id, type: "revenue", category: "Service", amount: 38000, description: "Beasley's — bi-weekly service", date: new Date() });
  await storage.createTransaction({ employerId: filta.id, type: "expense", category: "Supplies", amount: 12000, description: "Filter cartridges — bulk order", date: new Date() });
  await storage.createTransaction({ employerId: filta.id, type: "expense", category: "Fuel", amount: 8500, description: "Fleet fuel — this week", date: new Date() });

  // === SWEET SCOOPS ICE CREAM — Product Costing Business ===
  const iceCream = await storage.createUser({
    username: "sweet_scoops",
    password: hashedPw,
    role: "employer",
    name: "Sweet Scoops Owner",
    email: "owner@sweetscoops.com",
  });
  await storage.createEmployerProfile({
    userId: iceCream.id,
    companyName: "Sweet Scoops Ice Cream",
    industry: "Food & Beverage",
    country: "United States",
    location: "Chapel Hill, NC",
    businessType: "product",
    enabledModules: ["product_costing", "finances", "team"],
    feedToken: crypto.randomBytes(16).toString('hex'),
  });

  // Ingredients
  const cream = await storage.createIngredient({ businessId: iceCream.id, name: "Heavy Cream", unit: "gallon", costPerUnit: 4.50, supplier: "Homeland Dairy" });
  const sugar = await storage.createIngredient({ businessId: iceCream.id, name: "Cane Sugar", unit: "lb", costPerUnit: 0.80, supplier: "US Foods" });
  const vanilla = await storage.createIngredient({ businessId: iceCream.id, name: "Pure Vanilla Extract", unit: "oz", costPerUnit: 0.75, supplier: "Nielsen-Massey" });
  const waffleCone = await storage.createIngredient({ businessId: iceCream.id, name: "Waffle Cone", unit: "each", costPerUnit: 0.15, supplier: "Joy Cone Co." });
  const chocolateChips = await storage.createIngredient({ businessId: iceCream.id, name: "Chocolate Chips", unit: "oz", costPerUnit: 0.18, supplier: "Ghirardelli" });
  const strawberries = await storage.createIngredient({ businessId: iceCream.id, name: "Fresh Strawberries", unit: "oz", costPerUnit: 0.22, supplier: "Local Farm" });

  // Products
  const vanillaCone = await storage.createProduct({ businessId: iceCream.id, name: "Vanilla Waffle Cone", description: "Classic vanilla soft serve in a waffle cone", category: "Cones", sellingPrice: 4.50 });
  await storage.setProductIngredients(vanillaCone.id, [
    { ingredientId: cream.id, quantityPerUnit: 0.0625 },      // 1/16 gallon = 8oz cream per cone (as a float)
    { ingredientId: sugar.id, quantityPerUnit: 0.03125 },     // 0.5oz sugar (lb = 16oz, so 0.5/16)
    { ingredientId: vanilla.id, quantityPerUnit: 0.0625 },    // 0.25oz vanilla extract (in 4oz bottle = 0.0625)
    { ingredientId: waffleCone.id, quantityPerUnit: 1 },      // 1 cone
  ]);

  const chocoScoop = await storage.createProduct({ businessId: iceCream.id, name: "Chocolate Chip Sundae", description: "Two scoops of vanilla with chocolate chips", category: "Sundaes", sellingPrice: 5.75 });
  await storage.setProductIngredients(chocoScoop.id, [
    { ingredientId: cream.id, quantityPerUnit: 0.09375 },    // ~12oz
    { ingredientId: sugar.id, quantityPerUnit: 0.0625 },
    { ingredientId: vanilla.id, quantityPerUnit: 0.0625 },
    { ingredientId: chocolateChips.id, quantityPerUnit: 2 }, // 2oz chips
  ]);

  const strawberryScoop = await storage.createProduct({ businessId: iceCream.id, name: "Strawberry Cone", description: "Fresh strawberry ice cream in a waffle cone", category: "Cones", sellingPrice: 4.75 });
  await storage.setProductIngredients(strawberryScoop.id, [
    { ingredientId: cream.id, quantityPerUnit: 0.0625 },
    { ingredientId: sugar.id, quantityPerUnit: 0.03125 },
    { ingredientId: strawberries.id, quantityPerUnit: 3 }, // 3oz strawberries
    { ingredientId: waffleCone.id, quantityPerUnit: 1 },
  ]);

  // Revenue and expenses for ice cream shop
  await storage.createTransaction({ employerId: iceCream.id, type: "revenue", category: "Walk-in Sales", amount: 34000, description: "Walk-in sales — Monday", date: new Date() });
  await storage.createTransaction({ employerId: iceCream.id, type: "revenue", category: "Walk-in Sales", amount: 28500, description: "Walk-in sales — Tuesday", date: new Date() });
  await storage.createTransaction({ employerId: iceCream.id, type: "expense", category: "Supplies", amount: 8500, description: "Cream & dairy restock", date: new Date() });
  await storage.createTransaction({ employerId: iceCream.id, type: "expense", category: "Utilities", amount: 3200, description: "Electric bill", date: new Date() });

  // === LEGACY EMPLOYER ACCOUNTS ===
  const emp_legacy = await storage.createUser({ username: "logistics_inc", password: hashedPw, role: "employer" });
  await storage.createEmployerProfile({
    userId: emp_legacy.id,
    companyName: "Swift Logistics",
    industry: "Logistics",
    country: "United States",
    location: "Illinois",
    businessType: "general",
    enabledModules: ["field_service", "finances", "team"],
    feedToken: crypto.randomBytes(16).toString('hex'),
  });

  console.log("Database seeded!");
}

async function seedIndustryConfigs() {
  const existing = await db.select().from(industryConfigs).limit(1);
  if (existing.length > 0) return;

  console.log("Seeding industry configs...");
  const industryConfigData = [
    {
      industryName: "Home Healthcare",
      enabledModules: ["hiring", "workforce", "finance", "operations"],
      dashboardWidgets: JSON.stringify([
        { type: "stat", key: "activeCaregiver", label: "Active Caregivers" },
        { type: "stat", key: "shiftCompliance", label: "Shift Compliance" },
        { type: "stat", key: "openPositions", label: "Open Positions" },
        { type: "list", key: "upcomingShifts", label: "Upcoming Shifts" },
      ]),
      customFields: JSON.stringify({
        staffProfile: ["patientCaseload", "shiftPreference", "specializations"],
        shifts: ["patientName", "careType"],
      }),
      terminology: JSON.stringify({
        staff: "Caregivers",
        shift: "Visit",
        task: "Care Task",
        client: "Patient",
      }),
    },
    {
      industryName: "Manufacturing",
      enabledModules: ["hiring", "workforce", "finance", "operations"],
      dashboardWidgets: JSON.stringify([
        { type: "stat", key: "productionShifts", label: "Production Shifts" },
        { type: "stat", key: "certifiedWorkers", label: "Certified Workers" },
        { type: "stat", key: "safetyIncidents", label: "Safety Score" },
        { type: "list", key: "upcomingShifts", label: "Shift Schedule" },
      ]),
      customFields: JSON.stringify({
        staffProfile: ["machinesCertified", "safetyTraining", "productionLine"],
        shifts: ["productionLine", "machineAssignment"],
      }),
      terminology: JSON.stringify({
        staff: "Operators",
        shift: "Production Shift",
        task: "Work Order",
        client: "Production Line",
      }),
    },
    {
      industryName: "Logistics/Transportation",
      enabledModules: ["hiring", "workforce", "finance", "operations"],
      dashboardWidgets: JSON.stringify([
        { type: "stat", key: "activeDrivers", label: "Active Drivers" },
        { type: "stat", key: "deliveriesScheduled", label: "Routes Scheduled" },
        { type: "stat", key: "fleetUtilization", label: "Fleet Utilization" },
        { type: "list", key: "upcomingShifts", label: "Scheduled Routes" },
      ]),
      customFields: JSON.stringify({
        staffProfile: ["licenseType", "endorsements", "vehicleAssigned"],
        shifts: ["route", "vehicleId", "deliveryCount"],
      }),
      terminology: JSON.stringify({
        staff: "Drivers",
        shift: "Route",
        task: "Delivery",
        client: "Customer",
      }),
    },
    {
      industryName: "Hospitality/Restaurants",
      enabledModules: ["hiring", "workforce", "finance", "operations"],
      dashboardWidgets: JSON.stringify([
        { type: "stat", key: "staffOnDuty", label: "Staff On Duty" },
        { type: "stat", key: "openPositions", label: "Open Positions" },
        { type: "stat", key: "laborCostPercent", label: "Labor Cost %" },
        { type: "list", key: "upcomingShifts", label: "Today's Schedule" },
      ]),
      customFields: JSON.stringify({
        staffProfile: ["foodHandlerCert", "positionType", "serveSafe"],
        shifts: ["section", "role"],
      }),
      terminology: JSON.stringify({
        staff: "Team Members",
        shift: "Shift",
        task: "Prep Task",
        client: "Guest",
      }),
    },
    {
      industryName: "Automotive Repair",
      enabledModules: ["hiring", "workforce", "finance", "operations"],
      dashboardWidgets: JSON.stringify([
        { type: "stat", key: "activeTechnicians", label: "Active Technicians" },
        { type: "stat", key: "jobsScheduled", label: "Jobs Scheduled" },
        { type: "stat", key: "laborRevenue", label: "Labor Revenue" },
        { type: "list", key: "upcomingShifts", label: "Tech Schedule" },
      ]),
      customFields: JSON.stringify({
        staffProfile: ["aseCertifications", "specialties", "bayAssignment"],
        shifts: ["serviceType", "vehicleInfo"],
      }),
      terminology: JSON.stringify({
        staff: "Technicians",
        shift: "Service Slot",
        task: "Work Order",
        client: "Customer",
      }),
    },
    {
      industryName: "Retail",
      enabledModules: ["hiring", "workforce", "finance", "operations"],
      dashboardWidgets: JSON.stringify([
        { type: "stat", key: "staffScheduled", label: "Staff Scheduled" },
        { type: "stat", key: "openPositions", label: "Open Positions" },
        { type: "stat", key: "laborCost", label: "Labor Cost" },
        { type: "list", key: "upcomingShifts", label: "Floor Schedule" },
      ]),
      customFields: JSON.stringify({
        staffProfile: ["department", "posRegisterTrained", "keyHolder"],
        shifts: ["department", "register"],
      }),
      terminology: JSON.stringify({
        staff: "Associates",
        shift: "Floor Shift",
        task: "Store Task",
        client: "Customer",
      }),
    },
  ];

  for (const config of industryConfigData) {
    await db.insert(industryConfigs).values(config).onConflictDoNothing();
  }

  console.log("Industry configs seeded!");
}
