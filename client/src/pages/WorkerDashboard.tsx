import { useMyApplications } from "@/hooks/use-applications";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Briefcase } from "lucide-react";
import { format } from "date-fns";

export default function WorkerDashboard() {
  const { data: applications, isLoading } = useMyApplications();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-display font-bold mb-8">My Applications</h1>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : applications?.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed">
          <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications?.map(app => (
            <Card key={app.id}>
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold">{app.job.title}</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> {app.job.industry}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {app.job.location}</span>
                  </div>
                </div>
                <Badge className={
                  app.status === "Interview" ? "bg-emerald-500" : 
                  app.status === "New" ? "bg-blue-500" : "bg-slate-500"
                }>
                  {app.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Applied on {format(new Date(app.createdAt!), 'PPP')}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
