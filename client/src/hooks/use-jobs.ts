import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateJobRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Fetch all public jobs
export function useJobs(filters?: { industry?: string; location?: string }) {
  const queryString = filters 
    ? new URLSearchParams(filters as Record<string, string>).toString() 
    : "";
    
  return useQuery({
    queryKey: [api.jobs.list.path, filters],
    queryFn: async () => {
      const url = `${api.jobs.list.path}?${queryString}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      return api.jobs.list.responses[200].parse(await res.json());
    },
  });
}

// Fetch single job
export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.jobs.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch job details");
      return api.jobs.get.responses[200].parse(await res.json());
    },
  });
}

// Create Job (Employer)
export function useCreateJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: CreateJobRequest) => {
      const res = await fetch(api.employer.createJob.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to post job");
      }

      return api.employer.createJob.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.employer.myJobs.path] });
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
      toast({ title: "Job Posted!", description: "Candidates can now apply." });
      setLocation("/employer/dashboard");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });
}

// Employer's own jobs
export function useMyJobs() {
  return useQuery({
    queryKey: [api.employer.myJobs.path],
    queryFn: async () => {
      const res = await fetch(api.employer.myJobs.path);
      if (!res.ok) throw new Error("Failed to fetch your jobs");
      return api.employer.myJobs.responses[200].parse(await res.json());
    },
  });
}
