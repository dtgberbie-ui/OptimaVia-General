import { useRoute } from "wouter";
import { useJob, useJobs } from "@/hooks/use-jobs";
import { useJobApplications } from "@/hooks/use-applications";
import { ApplicantCard } from "@/components/ApplicantCard";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JobApplicants() {
  const [, params] = useRoute("/employer/jobs/:id/applicants");
  const jobId = parseInt(params!.id);
  
  const { data: job } = useJob(jobId);
  const { data: applications, isLoading } = useJobApplications(jobId);

  if (isLoading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin" /></div>;
  if (!job) return <div className="text-center pt-20">Job not found</div>;

  const newApplicants = applications?.filter(a => a.status === "New") || [];
  const interviewing = applications?.filter(a => a.status === "Interview") || [];
  const hired = applications?.filter(a => a.status === "Hired") || [];
  const rejected = applications?.filter(a => a.status === "Rejected") || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-display font-bold">Applicants for {job.title}</h1>
        <p className="text-muted-foreground">{applications?.length || 0} total candidates</p>
      </div>

      <Tabs defaultValue="new" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="new">New ({newApplicants.length})</TabsTrigger>
          <TabsTrigger value="interview">Interviewing ({interviewing.length})</TabsTrigger>
          <TabsTrigger value="hired">Hired ({hired.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>

        <ApplicantSection value="new" applicants={newApplicants} jobId={jobId} />
        <ApplicantSection value="interview" applicants={interviewing} jobId={jobId} />
        <ApplicantSection value="hired" applicants={hired} jobId={jobId} />
        <ApplicantSection value="rejected" applicants={rejected} jobId={jobId} />
      </Tabs>
    </div>
  );
}

function ApplicantSection({ value, applicants, jobId }: { value: string, applicants: any[], jobId: number }) {
  return (
    <TabsContent value={value} className="space-y-4">
      {applicants.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground bg-slate-50 rounded-lg">No candidates in this stage.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applicants.map(app => (
            <ApplicantCard key={app.id} application={app} jobId={jobId} />
          ))}
        </div>
      )}
    </TabsContent>
  );
}
