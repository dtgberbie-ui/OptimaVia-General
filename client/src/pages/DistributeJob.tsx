import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Rss, Copy, ExternalLink, Loader2, Lock, CheckCircle2, 
  AlertCircle, Clipboard, Link2, Sparkles, Globe
} from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-auth";
import type { Job, EmployerProfile } from "@shared/schema";

const PROVIDERS = [
  { 
    id: "indeed", 
    name: "Indeed", 
    color: "bg-blue-600",
    status: "REQUIRES_ACCESS",
    description: "Requires Indeed Partner API access. Apply at Indeed Partner Portal.",
    url: "https://www.indeed.com/hire"
  },
  { 
    id: "linkedin", 
    name: "LinkedIn", 
    color: "bg-blue-700",
    status: "REQUIRES_ACCESS",
    description: "Requires LinkedIn Job Posting API partner approval.",
    url: "https://www.linkedin.com/talent/post-a-job"
  },
  { 
    id: "glassdoor", 
    name: "Glassdoor", 
    color: "bg-green-600",
    status: "MANUAL_ONLY",
    description: "No public API available. Use manual posting below.",
    url: "https://www.glassdoor.com/employers"
  },
  { 
    id: "handshake", 
    name: "Handshake", 
    color: "bg-orange-500",
    status: "REQUIRES_ACCESS",
    description: "Requires institutional partnership approval.",
    url: "https://joinhandshake.com/employers"
  },
];

const BOARD_CHECKLISTS: Record<string, string[]> = {
  indeed: [
    "Go to indeed.com/hire and log into your employer account",
    "Click 'Post a Job' and paste the job content",
    "Set the location, salary, and job type to match your listing",
    "Review and publish - the posting typically goes live within minutes",
    "Copy the apply URL from OptimaVia so Indeed applicants can apply through your pipeline",
  ],
  linkedin: [
    "Go to linkedin.com/talent/post-a-job and sign in",
    "Click 'Post a free job' or choose a promoted listing",
    "Paste the job description and set all fields",
    "Add the OptimaVia apply link as the external application URL",
    "Publish and share with your network for maximum reach",
  ],
  glassdoor: [
    "Visit glassdoor.com/employers and create or log into your employer account",
    "Navigate to 'Post a Job'",
    "Fill in the job details using the content below",
    "Glassdoor may also pull from Indeed - check your Indeed listing too",
    "Add the OptimaVia apply link for external applications",
  ],
  handshake: [
    "Contact your institutional partner or visit joinhandshake.com/employers",
    "Request employer access if not already approved",
    "Once approved, post the job with the details below",
    "Set the target schools and graduation years",
    "Include the OptimaVia apply link",
  ],
  other: [
    "Copy the job posting text below",
    "Navigate to the job board's posting page",
    "Paste the content and adjust formatting as needed",
    "Include the OptimaVia apply link for tracking applicants",
    "Review and publish",
  ],
};

export default function DistributeJob() {
  const params = useParams();
  const jobId = params.id;
  const { toast } = useToast();
  const { data: user } = useUser();
  const [selectedBoard, setSelectedBoard] = useState("indeed");
  const [rewrittenText, setRewrittenText] = useState("");
  const [showXmlPreview, setShowXmlPreview] = useState(false);

  const { data: job, isLoading: loadingJob } = useQuery<Job>({
    queryKey: ["/api/jobs", jobId],
  });

  const { data: profile } = useQuery<EmployerProfile>({
    queryKey: ["/api/employer/profile", user?.id],
    enabled: !!user?.id,
  });

  const rewriteMutation = useMutation({
    mutationFn: async ({ jobId, board }: { jobId: number; board: string }) => {
      const res = await apiRequest("POST", "/api/ai/rewrite-for-board", { jobId, board });
      return res.json();
    },
    onSuccess: (data: { rewrittenText: string }) => {
      setRewrittenText(data.rewrittenText);
      toast({ title: "Job posting rewritten", description: `Optimized for ${selectedBoard}` });
    },
    onError: () => {
      toast({ title: "Failed to rewrite", variant: "destructive" });
    },
  });

  const baseUrl = window.location.origin;
  const applyUrl = `${baseUrl}/jobs/${jobId}`;
  const feedUrl = profile ? `${baseUrl}/api/jobs/${user?.id}/feed.xml?token=${profile.feedToken || ''}` : '';
  const publicFeedUrl = `${baseUrl}/api/jobs/feed.xml`;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied to clipboard` });
  };

  const getJobPostingText = () => {
    if (!job) return "";
    return `${job.title} - ${profile?.companyName || 'Company'}

Location: ${job.location}${job.city ? ', ' + job.city : ''}
Type: ${job.employmentType || 'Full-time'}
Pay: $${job.payMin?.toLocaleString()} - $${job.payMax?.toLocaleString()}/year

${job.description}

${job.responsibilities ? 'Responsibilities:\n' + job.responsibilities + '\n' : ''}
${job.requirements ? 'Requirements:\n' + job.requirements + '\n' : ''}
${job.requiredCertifications?.length ? 'Certifications Required: ' + job.requiredCertifications.join(', ') + '\n' : ''}
${job.schedule ? 'Schedule: ' + job.schedule + '\n' : ''}
${job.benefits ? 'Benefits: ' + job.benefits + '\n' : ''}
Apply: ${applyUrl}`;
  };

  if (loadingJob) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-muted-foreground" /></div>;
  }

  if (!job) {
    return <div className="container mx-auto px-4 py-8 text-center"><p>Job not found.</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-distribute-title">
          <Rss className="h-8 w-8 text-primary" />
          Distribute Job
        </h1>
        <p className="text-muted-foreground mt-1">
          Distribute "{job.title}" across job boards and syndication feeds.
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{job.title}</CardTitle>
          <CardDescription>
            {job.location}{job.city ? `, ${job.city}` : ''} · {job.employmentType || 'Full-time'} · ${job.payMin?.toLocaleString()} - ${job.payMax?.toLocaleString()}/yr
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="feed" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-lg">
          <TabsTrigger value="feed" data-testid="tab-syndication">Syndication Feed</TabsTrigger>
          <TabsTrigger value="integrations" data-testid="tab-integrations">Direct Integrations</TabsTrigger>
          <TabsTrigger value="manual" data-testid="tab-manual">Manual Posting</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Rss className="h-5 w-5 text-orange-500" />
                    XML Syndication Feed
                  </CardTitle>
                  <CardDescription>
                    Many job boards and aggregators can ingest XML feeds. Share your feed URL with job boards to automatically syndicate your listings.
                  </CardDescription>
                </div>
                <Badge variant="default" className="bg-green-600">Active</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Public Feed URL (all employers)</p>
                <div className="flex gap-2">
                  <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all" data-testid="text-public-feed-url">
                    {publicFeedUrl}
                  </code>
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(publicFeedUrl, "Public feed URL")} data-testid="button-copy-public-feed">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {feedUrl && (
                <div>
                  <p className="text-sm font-medium mb-2">Your Private Feed URL (your jobs only)</p>
                  <div className="flex gap-2">
                    <code className="flex-1 bg-muted px-3 py-2 rounded text-sm break-all" data-testid="text-private-feed-url">
                      {feedUrl}
                    </code>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(feedUrl, "Private feed URL")} data-testid="button-copy-private-feed">
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">XML Preview</p>
                  <Button variant="ghost" size="sm" onClick={() => setShowXmlPreview(!showXmlPreview)} data-testid="button-toggle-xml">
                    {showXmlPreview ? "Hide" : "Show"} Preview
                  </Button>
                </div>
                {showXmlPreview && (
                  <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-64 whitespace-pre-wrap" data-testid="text-xml-preview">
{`<?xml version="1.0" encoding="UTF-8"?>
<jobs>
  <job>
    <job_id>${job.id}</job_id>
    <title>${job.title}</title>
    <description>${job.description}</description>
    <location>${job.location}</location>
    <city>${job.city || ''}</city>
    <employment_type>${job.employmentType || 'full-time'}</employment_type>
    <salary_min>${job.payMin}</salary_min>
    <salary_max>${job.payMax}</salary_max>
    <apply_url>${applyUrl}</apply_url>
    <company_name>${profile?.companyName || ''}</company_name>
    <category>${job.industry}</category>
  </job>
</jobs>`}
                  </pre>
                )}
              </div>
              
              <p className="text-xs text-muted-foreground">
                Feed updated: {new Date().toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Direct API integrations allow automatic posting. Most job boards require partner approval before API access is granted.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {PROVIDERS.map((provider) => (
              <Card key={provider.id} data-testid={`card-integration-${provider.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${provider.color} text-white`}>
                        <Globe className="h-5 w-5" />
                      </div>
                      <CardTitle className="text-lg">{provider.name}</CardTitle>
                    </div>
                    <Badge variant={provider.status === "MANUAL_ONLY" ? "secondary" : "outline"} className="flex items-center gap-1">
                      {provider.status === "MANUAL_ONLY" ? (
                        <><AlertCircle className="h-3 w-3" /> Manual Only</>
                      ) : (
                        <><Lock className="h-3 w-3" /> Requires Partner Access</>
                      )}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{provider.description}</p>
                </CardContent>
                <CardFooter>
                  <a href={provider.url} target="_blank" rel="noopener noreferrer" className="w-full">
                    <Button variant="outline" className="w-full gap-2" data-testid={`button-visit-${provider.id}`}>
                      <ExternalLink className="h-4 w-4" />
                      Visit {provider.name}
                    </Button>
                  </a>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clipboard className="h-5 w-5" />
                Manual Posting Assistant
              </CardTitle>
              <CardDescription>
                Copy your job posting, get an AI-rewritten version, and follow the checklist for each board.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={() => copyToClipboard(getJobPostingText(), "Job posting text")}
                  data-testid="button-copy-job-text"
                >
                  <Copy className="h-4 w-4" />
                  Copy Job Text
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2" 
                  onClick={() => copyToClipboard(applyUrl, "Apply link")}
                  data-testid="button-copy-apply-link"
                >
                  <Link2 className="h-4 w-4" />
                  Copy Apply Link
                </Button>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">AI Rewrite for Job Board</p>
                <div className="flex gap-3 mb-4">
                  <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                    <SelectTrigger className="w-48" data-testid="select-board">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="indeed">Indeed</SelectItem>
                      <SelectItem value="linkedin">LinkedIn</SelectItem>
                      <SelectItem value="glassdoor">Glassdoor</SelectItem>
                      <SelectItem value="handshake">Handshake</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    className="gap-2"
                    onClick={() => rewriteMutation.mutate({ jobId: Number(jobId), board: selectedBoard })}
                    disabled={rewriteMutation.isPending}
                    data-testid="button-generate-rewrite"
                  >
                    {rewriteMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                    Generate Board-Specific Version
                  </Button>
                </div>
                
                {rewrittenText && (
                  <div className="space-y-2">
                    <Textarea 
                      value={rewrittenText} 
                      onChange={(e) => setRewrittenText(e.target.value)}
                      className="min-h-[200px] text-sm"
                      data-testid="textarea-rewritten"
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-2"
                      onClick={() => copyToClipboard(rewrittenText, "Rewritten job posting")}
                      data-testid="button-copy-rewritten"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Rewritten Text
                    </Button>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-3">
                  Posting Checklist for {selectedBoard.charAt(0).toUpperCase() + selectedBoard.slice(1)}
                </p>
                <ol className="space-y-2">
                  {(BOARD_CHECKLISTS[selectedBoard] || BOARD_CHECKLISTS.other).map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" data-testid={`checklist-step-${i}`}>
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
