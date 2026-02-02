import { useMyJobs } from "@/hooks/use-jobs";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Link } from "wouter";
import { JobCard } from "@/components/JobCard";
import { Plus, Loader2, Users, Calendar, DollarSign, Globe } from "lucide-react";

export default function EmployerDashboard() {
  const { data: jobs, isLoading } = useMyJobs();

  const quickActions = [
    { 
      title: "Staff Management", 
      description: "Manage team & performance", 
      icon: Users, 
      href: "/employer/staff",
      color: "text-blue-500"
    },
    { 
      title: "Task Scheduling", 
      description: "Assign and track tasks", 
      icon: Calendar, 
      href: "/employer/tasks",
      color: "text-purple-500"
    },
    { 
      title: "Financial Tracking", 
      description: "Revenue & expenses", 
      icon: DollarSign, 
      href: "/employer/finances",
      color: "text-green-500"
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Employer Dashboard</h1>
          <p className="text-muted-foreground">Manage your active listings and applicants.</p>
        </div>
        <Link href="/employer/jobs/new">
          <Button className="gap-2" data-testid="button-post-job">
            <Plus className="h-4 w-4" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {quickActions.map((action) => (
          <Link key={action.href} href={action.href}>
            <Card className="hover-elevate cursor-pointer h-full" data-testid={`link-${action.title.toLowerCase().replace(/\s/g, '-')}`}>
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <action.icon className={`h-8 w-8 ${action.color}`} />
                <div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      {/* Jobs Section */}
      <h2 className="text-xl font-semibold mb-4">Your Job Listings</h2>
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : jobs?.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
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
