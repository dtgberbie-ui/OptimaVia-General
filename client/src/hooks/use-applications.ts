import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type CreateApplicationRequest, type UpdateApplicationStatusRequest } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";

// Worker: Apply for a job
export function useApplyJob() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateApplicationRequest) => {
      const res = await fetch(api.worker.apply.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to apply");
      }

      return api.worker.apply.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.worker.myApplications.path] });
      toast({ 
        title: "Application Sent!", 
        description: "The employer has been notified." 
      });
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

// Worker: My Applications
export function useMyApplications() {
  return useQuery({
    queryKey: [api.worker.myApplications.path],
    queryFn: async () => {
      const res = await fetch(api.worker.myApplications.path);
      if (!res.ok) throw new Error("Failed to fetch applications");
      return api.worker.myApplications.responses[200].parse(await res.json());
    },
  });
}

// Employer: Get Applications for a Job
export function useJobApplications(jobId: number) {
  return useQuery({
    queryKey: [api.employer.jobApplications.path, jobId],
    queryFn: async () => {
      const url = buildUrl(api.employer.jobApplications.path, { jobId });
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch applicants");
      return api.employer.jobApplications.responses[200].parse(await res.json());
    },
    enabled: !!jobId,
  });
}

// Employer: Update Application Status
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateApplicationStatusRequest & { id: number }) => {
      const url = buildUrl(api.employer.updateApplicationStatus.path, { id });
      const res = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to update status");
      return api.employer.updateApplicationStatus.responses[200].parse(await res.json());
    },
    onSuccess: (_, variables) => {
      // Invalidate specific job applicants query would be ideal, but requires knowing the jobId
      // We will invalidate all job-applications queries for now
      queryClient.invalidateQueries({ queryKey: [api.employer.jobApplications.path] });
      toast({ title: "Status Updated", description: `Candidate moved to ${variables.status}` });
    },
  });
}
