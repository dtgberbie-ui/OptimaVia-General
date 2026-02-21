import { useQuery } from "@tanstack/react-query";
import { useMyJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { Briefcase, Users, Rss, Link2, Plus, Loader2, ArrowRight, Eye } from "lucide-react";
import type { Job } from "@shared/schema";

export default function HiringDashboard() {
  const { data: jobs, isLoading: loadingJobs } = useMyJobs();
  const { data: stats, isLoading: loadingStats } = useQuery<{
    openJobs: number;
    totalApplicants: number;
    integrationsConnected: number;
    feedEnabled: boolean;
  }>({
    queryKey: ["/api/employer/hiring/stats"],
  });

  const isLoading = loadingJobs || loadingStats;

  const statCards = [
    {
      title: "Open Jobs",
      value: stats?.openJobs ?? 0,
      icon: Briefcase,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Total Applicants",
      value: stats?.totalApplicants ?? 0,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Integrations",
      value: stats?.integrationsConnected ?? 0,
      icon: Link2,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Syndication Feed",
      value: stats?.feedEnabled ? "Active" : "Inactive",
      icon: Rss,
      color: stats?.feedEnabled ? "text-orange-600" : "text-gray-400",
      bgColor: stats?.feedEnabled ? "bg-orange-50 dark:bg-orange-950" : "bg-gray-50 dark:bg-gray-900",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold" data-testid="text-hiring-title">Hiring</h1>
          <p className="text-muted-foreground">Manage job postings, applicants, and distribution channels.</p>
        </div>
        <Link href="/employer/jobs/new">
          <Button className="gap-2" data-testid="button-post-job">
            <Plus className="h-4 w-4" />
            Post a Job
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {statCards.map((card) => (
              <Card key={card.title} data-testid={`card-stat-${card.title.toLowerCase().replace(/\s/g, '-')}`}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <card.icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{card.title}</p>
                      <p className="text-2xl font-bold">{card.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Job Listings</h2>
          </div>

          {!jobs?.length ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No jobs posted yet</h3>
              <p className="text-muted-foreground mb-4">Create your first job posting to start receiving applicants.</p>
              <Link href="/employer/jobs/new">
                <Button data-testid="button-create-first-job">Create your first job post</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job: Job) => (
                <Card key={job.id} className="hover-elevate" data-testid={`card-job-${job.id}`}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{job.title}</h3>
                          <Badge variant={job.status === "OPEN" ? "default" : job.status === "DRAFT" ? "secondary" : "outline"}>
                            {job.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.location}{job.city ? `, ${job.city}` : ''} · {job.employmentType || 'Full-time'} · ${job.payMin?.toLocaleString()} - ${job.payMax?.toLocaleString()}/yr
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {job.status === "OPEN" && (
                          <Link href={`/employer/jobs/${job.id}/distribute`}>
                            <Button variant="outline" size="sm" className="gap-1" data-testid={`button-distribute-${job.id}`}>
                              <Rss className="h-3.5 w-3.5" />
                              Distribute
                            </Button>
                          </Link>
                        )}
                        <Link href={`/employer/jobs/${job.id}/applicants`}>
                          <Button variant="outline" size="sm" className="gap-1" data-testid={`button-applicants-${job.id}`}>
                            <Eye className="h-3.5 w-3.5" />
                            Applicants
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
