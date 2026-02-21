import { useQuery } from "@tanstack/react-query";
import { useMyJobs } from "@/hooks/use-jobs";
import type { Job } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { JobCard } from "@/components/JobCard";
import { Plus, Loader2, Users, Calendar, DollarSign, Briefcase, CalendarDays, TrendingUp, CheckCircle2, Clock } from "lucide-react";

export default function EmployerDashboard() {
  const { data: jobs, isLoading: jobsLoading } = useMyJobs();
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/employer/dashboard/stats"],
  });

  const modules = [
    {
      title: "Hiring",
      description: "Post jobs, review applicants, distribute listings",
      icon: Briefcase,
      href: "/employer/hiring",
      color: "text-indigo-500",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      stats: stats ? [
        { label: "Open Jobs", value: stats.openJobs },
      ] : [],
    },
    {
      title: "Workforce",
      description: "Manage staff, track performance",
      icon: Users,
      href: "/employer/staff",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      stats: stats ? [
        { label: "Total Staff", value: stats.totalStaff },
        { label: "Active", value: stats.activeStaff },
      ] : [],
    },
    {
      title: "Operations",
      description: "Tasks, shifts, and scheduling",
      icon: CalendarDays,
      href: "/employer/operations",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      stats: stats ? [
        { label: "Pending Tasks", value: stats.pendingTasks },
        { label: "Upcoming Shifts", value: stats.upcomingShifts },
      ] : [],
    },
    {
      title: "Finance",
      description: "Revenue, expenses, and reports",
      icon: DollarSign,
      href: "/employer/finances",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
      stats: stats ? [
        { label: "Net Income", value: `$${((stats.netIncome || 0) / 100).toFixed(0)}` },
      ] : [],
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold" data-testid="text-employer-dashboard-title">Business Dashboard</h1>
          <p className="text-muted-foreground">Manage all aspects of your business operations.</p>
        </div>
        <Link href="/employer/jobs/new">
          <Button className="gap-2" data-testid="button-post-job">
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {statsLoading ? (
        <div className="flex justify-center py-4"><Loader2 className="animate-spin h-6 w-6 text-primary" /></div>
      ) : stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-l-4 border-l-indigo-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Jobs</p>
                  <p className="text-2xl font-bold" data-testid="stat-open-jobs">{stats.openJobs}</p>
                </div>
                <Briefcase className="h-8 w-8 text-indigo-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Staff</p>
                  <p className="text-2xl font-bold" data-testid="stat-active-staff">{stats.activeStaff} / {stats.totalStaff}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending Tasks</p>
                  <p className="text-2xl font-bold" data-testid="stat-pending-tasks">{stats.pendingTasks}</p>
                </div>
                <CheckCircle2 className="h-8 w-8 text-purple-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="pt-4 pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Net Income</p>
                  <p className="text-2xl font-bold" data-testid="stat-net-income">
                    ${((stats.netIncome || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 0 })}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <h2 className="text-xl font-semibold mb-4">Modules</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {modules.map((mod) => (
          <Link key={mod.href} href={mod.href}>
            <Card className="hover-elevate cursor-pointer h-full transition-all" data-testid={`link-module-${mod.title.toLowerCase()}`}>
              <CardHeader className="pb-2">
                <div className={`w-12 h-12 rounded-lg ${mod.bgColor} flex items-center justify-center mb-2`}>
                  <mod.icon className={`h-6 w-6 ${mod.color}`} />
                </div>
                <CardTitle className="text-lg">{mod.title}</CardTitle>
                <CardDescription>{mod.description}</CardDescription>
              </CardHeader>
              {mod.stats.length > 0 && (
                <CardContent className="pt-0">
                  <div className="flex gap-4 text-sm">
                    {mod.stats.map((s) => (
                      <div key={s.label}>
                        <span className="text-muted-foreground">{s.label}: </span>
                        <span className="font-semibold">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          </Link>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Job Listings</h2>
      {jobsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : jobs?.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
          <h3 className="text-lg font-medium mb-2" data-testid="text-no-jobs">No jobs posted yet</h3>
          <Link href="/employer/jobs/new">
            <Button variant="outline">Create your first job post</Button>
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(jobs as Job[])?.slice(0, 6).map((job: Job) => (
            <JobCard key={job.id} job={job} isEmployer />
          ))}
        </div>
      )}
    </div>
  );
}
