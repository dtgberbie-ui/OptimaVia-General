import { useState } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Mail, MoreHorizontal, FileText, CheckCircle2, XCircle } from "lucide-react";
import { FitScoreBadge } from "./FitScoreBadge";
import { useAiSummarize, useAiOutreach } from "@/hooks/use-ai";
import { useUpdateApplicationStatus } from "@/hooks/use-applications";
import type { ApplicationWithWorker } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface ApplicantCardProps {
  application: ApplicationWithWorker;
  jobId: number;
}

export function ApplicantCard({ application, jobId }: ApplicantCardProps) {
  const { worker } = application;
  const profile = worker.workerProfile;
  const { toast } = useToast();

  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [summary, setSummary] = useState<string[] | null>(null);
  
  const [isOutreachOpen, setIsOutreachOpen] = useState(false);
  const [outreachDraft, setOutreachDraft] = useState("");
  const [outreachSubject, setOutreachSubject] = useState("");

  const summarizeMutation = useAiSummarize();
  const outreachMutation = useAiOutreach();
  const updateStatusMutation = useUpdateApplicationStatus();

  const handleSummarize = () => {
    setIsSummaryOpen(true);
    if (!summary) {
      summarizeMutation.mutate(
        { workerProfileId: profile!.id, jobId },
        { onSuccess: (data) => setSummary(data.summary) }
      );
    }
  };

  const handleOutreach = () => {
    setIsOutreachOpen(true);
    if (!outreachDraft) {
      outreachMutation.mutate(
        { workerProfileId: profile!.id, jobId, type: "email" },
        { 
          onSuccess: (data) => {
            setOutreachDraft(data.message);
            setOutreachSubject(data.subject || "");
          } 
        }
      );
    }
  };

  const handleStatusChange = (status: string) => {
    updateStatusMutation.mutate({ id: application.id, status });
  };

  if (!profile) return null; // Should not happen given schema constraints

  return (
    <>
      <Card className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-start justify-between pb-2">
          <div className="flex gap-4">
            <FitScoreBadge score={application.fitScore} />
            <div>
              <h4 className="text-lg font-bold font-display">{profile.name}</h4>
              <p className="text-sm text-muted-foreground">{profile.location}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.roles.slice(0, 2).map((role, i) => (
                  <Badge key={i} variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleStatusChange("Interview")}>
                <CheckCircle2 className="mr-2 h-4 w-4 text-emerald-500" />
                Move to Interview
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange("Rejected")}>
                <XCircle className="mr-2 h-4 w-4 text-red-500" />
                Reject
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>

        <CardContent className="py-2">
          <div className="flex justify-between items-center text-sm">
            <div className="text-muted-foreground">
              Experience: <span className="font-medium text-foreground">{profile.experienceYears} years</span>
            </div>
            <Badge variant="outline" className={
              application.status === "Interview" ? "border-emerald-500 text-emerald-700 bg-emerald-50" : 
              application.status === "Rejected" ? "border-red-500 text-red-700 bg-red-50" : 
              "border-blue-200 text-blue-700 bg-blue-50"
            }>
              {application.status}
            </Badge>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2 pt-2 border-t mt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2 text-primary border-primary/20 hover:bg-primary/5"
            onClick={handleSummarize}
          >
            <Sparkles className="h-4 w-4" />
            AI Summary
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 gap-2 text-secondary border-secondary/20 hover:bg-secondary/5"
            onClick={handleOutreach}
          >
            <Mail className="h-4 w-4" />
            Draft Email
          </Button>
        </CardFooter>
      </Card>

      {/* AI Summary Dialog */}
      <Dialog open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Candidate Summary
            </DialogTitle>
            <DialogDescription>
              Quick insights based on profile and job match.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {summarizeMutation.isPending && !summary ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                Analyzing fit...
              </div>
            ) : (
              <ul className="space-y-2">
                {summary?.map((point, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="text-primary font-bold">•</span>
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Outreach Dialog */}
      <Dialog open={isOutreachOpen} onOpenChange={setIsOutreachOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-secondary" />
              Draft Outreach Email
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {outreachMutation.isPending && !outreachDraft ? (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                Drafting personalized message...
              </div>
            ) : (
              <>
                 <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Subject</label>
                  <div className="p-2 bg-muted/30 rounded text-sm font-medium border">{outreachSubject}</div>
                 </div>
                 <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Body</label>
                  <Textarea 
                    value={outreachDraft} 
                    onChange={(e) => setOutreachDraft(e.target.value)}
                    className="min-h-[200px]" 
                  />
                 </div>
                 <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsOutreachOpen(false)}>Cancel</Button>
                    <Button onClick={() => {
                       navigator.clipboard.writeText(`${outreachSubject}\n\n${outreachDraft}`);
                       toast({ title: "Copied!", description: "Message copied to clipboard" });
                       setIsOutreachOpen(false);
                    }}>Copy to Clipboard</Button>
                 </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
