import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-auth";
import { MapPin, Clock, ChevronRight, CheckCircle, Play, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type ServiceJob = {
  id: number; clientName: string; serviceAddress: string;
  scheduledDate: string; scheduledTime: string | null; status: string;
  priority: string; keyTrackingEnabled: boolean; notes: string | null;
};

function statusBg(s: string) {
  if (s === "completed") return "bg-green-100 text-green-700";
  if (s === "in_progress") return "bg-blue-100 text-blue-700";
  if (s === "assigned") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-500";
}

function statusLabel(s: string) {
  if (s === "in_progress") return "In Progress";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function StatusIcon({ status }: { status: string }) {
  if (status === "completed") return <CheckCircle className="h-4 w-4 text-green-600" />;
  if (status === "in_progress") return <Play className="h-4 w-4 text-blue-600" />;
  return <AlertCircle className="h-4 w-4 text-yellow-600" />;
}

export default function EmployeeJobs() {
  const { data: user } = useUser();

  const { data: jobs, isLoading } = useQuery<ServiceJob[]>({
    queryKey: ["/api/service-jobs"],
  });

  const today = new Date().toISOString().split("T")[0];
  const todayJobs = jobs?.filter(j => j.scheduledDate === today && j.status !== "completed") ?? [];
  const upcomingJobs = jobs?.filter(j => j.scheduledDate > today) ?? [];
  const completedJobs = jobs?.filter(j => j.status === "completed") ?? [];

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900" data-testid="heading-employee-jobs">My Jobs</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <>
          {todayJobs.length > 0 && (
            <JobSection title="Today" jobs={todayJobs} />
          )}
          {upcomingJobs.length > 0 && (
            <JobSection title="Upcoming" jobs={upcomingJobs} />
          )}
          {todayJobs.length === 0 && upcomingJobs.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">No jobs assigned</p>
                <p className="text-slate-400 text-xs mt-1">Your manager will assign jobs to you here.</p>
              </CardContent>
            </Card>
          )}
          {completedJobs.length > 0 && (
            <JobSection title="Completed" jobs={completedJobs} faded />
          )}
        </>
      )}
    </div>
  );
}

function JobSection({ title, jobs, faded }: { title: string; jobs: ServiceJob[]; faded?: boolean }) {
  return (
    <div>
      <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${faded ? "text-slate-300" : "text-slate-400"}`}>{title}</p>
      <div className="space-y-2">
        {jobs.map(job => (
          <Link key={job.id} href={`/employee/jobs/${job.id}`}>
            <Card className={`cursor-pointer hover:shadow-md transition-shadow ${faded ? "opacity-60" : ""}`} data-testid={`employee-job-card-${job.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{job.clientName}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{job.serviceAddress}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBg(job.status)}`}>{statusLabel(job.status)}</span>
                    {job.keyTrackingEnabled && <span className="text-xs text-indigo-600">🔑 Keys</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Clock className="h-3 w-3" />
                  {job.scheduledDate}{job.scheduledTime ? ` at ${job.scheduledTime}` : ""}
                  <ChevronRight className="h-3.5 w-3.5 ml-auto text-slate-300" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
