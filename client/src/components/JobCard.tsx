import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Briefcase, Rss, Users } from "lucide-react";
import { Link } from "wouter";
import type { Job, JobWithEmployer } from "@shared/schema";

interface JobCardProps {
  job: Job | JobWithEmployer;
  isEmployer?: boolean;
}

export function JobCard({ job, isEmployer }: JobCardProps) {
  const employerProfile = 'employer' in job ? (job as JobWithEmployer).employer?.employerProfile : null;

  return (
    <Card className="hover-elevate transition-all duration-300 group" data-testid={`card-job-${job.id}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-muted-foreground font-medium mt-1">
              {employerProfile?.companyName || "Confidential Company"}
            </p>
          </div>
          <Badge variant="secondary" className="bg-secondary/10 text-secondary hover:bg-secondary/20">
            {job.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-4 w-4" />
            {job.location}{job.city ? `, ${job.city}` : ''}
          </div>
          <div className="flex items-center gap-1.5">
            <Briefcase className="h-4 w-4" />
            {job.industry}
          </div>
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            ${job.payMin.toLocaleString()} - ${job.payMax.toLocaleString()} /yr
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          {job.requiredCertifications.slice(0, 3).map((cert, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {cert}
            </Badge>
          ))}
          {job.requiredCertifications.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{job.requiredCertifications.length - 3} more
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        {isEmployer ? (
          <>
            <Link href={`/employer/jobs/${job.id}/applicants`} className="flex-1">
              <Button className="w-full gap-2" data-testid={`button-view-applicants-${job.id}`}>
                <Users className="h-4 w-4" />
                Applicants
              </Button>
            </Link>
            {job.status === "OPEN" && (
              <Link href={`/employer/jobs/${job.id}/distribute`}>
                <Button variant="outline" size="icon" data-testid={`button-distribute-job-${job.id}`}>
                  <Rss className="h-4 w-4" />
                </Button>
              </Link>
            )}
          </>
        ) : (
          <Link href={`/jobs/${job.id}`} className="w-full">
            <Button className="w-full group-hover:bg-primary/90">View Details</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
