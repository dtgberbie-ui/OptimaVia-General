import { useMutation } from "@tanstack/react-query";
import { api, type AiSummaryRequest, type AiOutreachRequest } from "@shared/routes";

export function useAiSummarize() {
  return useMutation({
    mutationFn: async (data: AiSummaryRequest) => {
      const res = await fetch(api.ai.summarizeCandidate.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to generate summary");
      return api.ai.summarizeCandidate.responses[200].parse(await res.json());
    },
  });
}

export function useAiOutreach() {
  return useMutation({
    mutationFn: async (data: AiOutreachRequest) => {
      const res = await fetch(api.ai.draftOutreach.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to draft outreach");
      return api.ai.draftOutreach.responses[200].parse(await res.json());
    },
  });
}
