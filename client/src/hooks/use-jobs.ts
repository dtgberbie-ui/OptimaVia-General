import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type { CreateJobRequest } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

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
      return res.json();
    },
  });
}

export function useJob(id: number) {
  return useQuery({
    queryKey: [api.jobs.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.jobs.get.path, { id });
      const res = await fetch(url);
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch job details");
      return res.json();
    },
  });
}

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

      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.employer.myJobs.path] });
      queryClient.invalidateQueries({ queryKey: [api.jobs.list.path] });
      toast({ title: "Job Posted!", description: "Candidates can now apply." });
      setLocation("/employer/hiring");
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

export function useMyJobs() {
  return useQuery({
    queryKey: [api.employer.myJobs.path],
    queryFn: async () => {
      const res = await fetch(api.employer.myJobs.path);
      if (!res.ok) throw new Error("Failed to fetch your jobs");
      return res.json();
    },
  });
}
