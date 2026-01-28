import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Briefcase } from "lucide-react";
import { Link } from "wouter";
import type { JobWithEmployer } from "@shared/schema";

interface JobCardProps {
  job: JobWithEmployer;
  isEmployer?: boolean;
}

export function JobCard({ job, isEmployer }: JobCardProps) {
  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary group">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
              {job.title}
            </h3>
            <p className="text-muted-foreground font-medium mt-1">
              {job.employer?.employerProfile?.companyName || "Confidential Company"}
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
            {job.location}
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
      <CardFooter>
        {isEmployer ? (
          <Link href={`/employer/jobs/${job.id}/applicants`} className="w-full">
            <Button className="w-full">View Applicants</Button>
          </Link>
        ) : (
          <Link href={`/jobs/${job.id}`} className="w-full">
            <Button className="w-full group-hover:bg-primary/90">View Details</Button>
          </Link>
        )}
      </CardFooter>
    </Card>
  );
}
