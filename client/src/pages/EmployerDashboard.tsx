import { useMyJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { JobCard } from "@/components/JobCard";
import { Plus, Loader2 } from "lucide-react";

export default function EmployerDashboard() {
  const { data: jobs, isLoading } = useMyJobs();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Employer Dashboard</h1>
          <p className="text-muted-foreground">Manage your active listings and applicants.</p>
        </div>
        <Link href="/employer/jobs/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : jobs?.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed">
          <h3 className="text-lg font-medium mb-2">No jobs posted yet</h3>
          <Link href="/employer/jobs/new">
            <Button variant="outline">Create your first job post</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs?.map(job => (
            <JobCard key={job.id} job={job} isEmployer />
          ))}
        </div>
      )}
    </div>
  );
}
