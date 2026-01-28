import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, type InsertEmployerProfile, type InsertWorkerProfile } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useCreateEmployerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: InsertEmployerProfile) => {
      const res = await fetch(api.employer.createProfile.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create profile");
      }
      return api.employer.createProfile.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
      toast({ title: "Profile Complete!", description: "Welcome to OptimaVia." });
      setLocation("/employer/dashboard");
    },
  });
}

export function useCreateWorkerProfile() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: InsertWorkerProfile) => {
      const res = await fetch(api.worker.createProfile.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create profile");
      }
      return api.worker.createProfile.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.auth.user.path] });
      toast({ title: "Profile Complete!", description: "Start applying for jobs." });
      setLocation("/jobs");
    },
  });
}
