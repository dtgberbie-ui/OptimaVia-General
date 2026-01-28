import { useRoute } from "wouter";
import { useJob } from "@/hooks/use-jobs";
import { useApplyJob } from "@/hooks/use-applications";
import { useUser } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Briefcase, DollarSign, Calendar, CheckCircle2, Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function JobDetail() {
  const [, params] = useRoute("/jobs/:id");
  const jobId = parseInt(params!.id);
  const { data: job, isLoading } = useJob(jobId);
  const { data: user } = useUser();
  const applyMutation = useApplyJob();

  if (isLoading) return <div className="flex justify-center pt-20"><Loader2 className="animate-spin" /></div>;
  if (!job) return <div className="text-center pt-20">Job not found</div>;

  const handleApply = () => {
    applyMutation.mutate({ jobId });
  };

  const isWorker = user?.role === "worker";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="bg-white rounded-2xl shadow-sm border p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">{job.title}</h1>
            <div className="flex items-center gap-2 text-lg text-muted-foreground">
              <span className="font-medium text-foreground">{job.employer.employerProfile?.companyName}</span>
              <span>•</span>
              <span>{job.location}</span>
            </div>
          </div>
          
          {isWorker && (
            <Button size="lg" className="md:w-auto w-full" onClick={handleApply} disabled={applyMutation.isPending}>
              {applyMutation.isPending ? <Loader2 className="mr-2 animate-spin" /> : "Apply Now"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <DetailItem icon={<Briefcase />} label="Industry" value={job.industry} />
          <DetailItem icon={<MapPin />} label="Location" value={job.location} />
          <DetailItem icon={<DollarSign />} label="Salary" value={`$${job.payMin.toLocaleString()} - $${job.payMax.toLocaleString()}`} />
          <DetailItem icon={<Calendar />} label="Posted" value={format(new Date(job.createdAt!), 'MMM d, yyyy')} />
        </div>

        <div className="prose max-w-none mb-8">
          <h3 className="text-xl font-bold mb-4">Job Description</h3>
          <p className="text-slate-600 whitespace-pre-wrap">{job.description}</p>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Requirements</h3>
          <div className="flex flex-wrap gap-2">
            {job.requiredCertifications.map((cert, i) => (
              <Badge key={i} variant="secondary" className="px-3 py-1 text-sm flex items-center gap-2">
                <CheckCircle2 className="h-3 w-3" />
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailItem({ icon, label, value }: { icon: any, label: string, value: string }) {
  return (
    <div className="p-4 bg-slate-50 rounded-xl">
      <div className="text-muted-foreground mb-1 h-5 w-5">{icon}</div>
      <div className="text-xs text-muted-foreground uppercase font-semibold">{label}</div>
      <div className="font-medium truncate" title={value}>{value}</div>
    </div>
  );
}
