import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, ExternalLink, Plus, Loader2, Send, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function JobBoardPosting() {
  const params = useParams();
  const jobId = params.id;
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPosting, setNewPosting] = useState({ 
    platform: "indeed", 
    content: "" 
  });

  const { data: job, isLoading: loadingJob } = useQuery({
    queryKey: ["/api/jobs", jobId],
  });

  const { data: postings, isLoading } = useQuery({
    queryKey: ["/api/employer/jobs", jobId, "postings"],
    queryFn: async () => {
      const res = await fetch(`/api/employer/jobs/${jobId}/postings`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const createPostingMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", `/api/employer/jobs/${jobId}/postings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs", jobId, "postings"] });
      setShowAddDialog(false);
      toast({ title: "Job posting draft created" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (postingId: number) => {
      return apiRequest("POST", `/api/employer/postings/${postingId}/publish`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs", jobId, "postings"] });
      toast({ 
        title: data.success ? "Posted Successfully!" : "Post Failed",
        description: data.message 
      });
    },
    onError: () => {
      toast({ title: "Failed to post to job board", variant: "destructive" });
    },
  });

  const platforms = [
    { id: "indeed", name: "Indeed", color: "bg-blue-500" },
    { id: "linkedin", name: "LinkedIn", color: "bg-blue-700" },
    { id: "ziprecruiter", name: "ZipRecruiter", color: "bg-green-500" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "posted": return <Badge className="bg-green-500">Posted</Badge>;
      case "expired": return <Badge variant="secondary">Expired</Badge>;
      case "removed": return <Badge variant="destructive">Removed</Badge>;
      default: return <Badge variant="outline">Draft</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Job Board Posting
          </h1>
          {job && (
            <p className="text-muted-foreground">
              Post "{(job as any).title}" to external job boards
            </p>
          )}
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-create-posting">
              <Plus className="h-4 w-4" />
              Create Posting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Job Board Posting</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Platform</Label>
                <Select 
                  value={newPosting.platform} 
                  onValueChange={(value) => setNewPosting({ ...newPosting, platform: value })}
                >
                  <SelectTrigger data-testid="select-platform">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ad Content</Label>
                <Textarea 
                  value={newPosting.content} 
                  onChange={(e) => setNewPosting({ ...newPosting, content: e.target.value })}
                  placeholder="Write your job advertisement content here. This will be posted to the selected job board..."
                  rows={10}
                  data-testid="input-posting-content"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Tip: Include key job details, requirements, and benefits to attract qualified candidates.
                </p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => createPostingMutation.mutate(newPosting)}
                disabled={createPostingMutation.isPending || !newPosting.content.trim()}
                data-testid="button-submit-posting"
              >
                {createPostingMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                Save Draft
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingJob ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : (
        <>
          {/* Job Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{(job as any)?.title}</CardTitle>
              <CardDescription>{(job as any)?.location} · ${(job as any)?.payMin?.toLocaleString()} - ${(job as any)?.payMax?.toLocaleString()}/yr</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{(job as any)?.description}</p>
            </CardContent>
          </Card>

          {/* Postings */}
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : !postings?.length ? (
            <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
              <Globe className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No postings yet</h3>
              <p className="text-muted-foreground mb-4">Create a posting to advertise this job on external platforms</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {(postings as any[]).map((posting) => {
                const platform = platforms.find(p => p.id === posting.platform);
                return (
                  <Card key={posting.id} data-testid={`card-posting-${posting.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${platform?.color} text-white`}>
                            <Globe className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{platform?.name}</CardTitle>
                            {posting.externalId && (
                              <CardDescription className="flex items-center gap-1">
                                ID: {posting.externalId}
                                <ExternalLink className="h-3 w-3" />
                              </CardDescription>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(posting.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-3">
                        {posting.content}
                      </p>
                      {posting.postedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Posted: {new Date(posting.postedAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                    <CardFooter>
                      {posting.status === "draft" ? (
                        <Button 
                          className="w-full gap-2" 
                          onClick={() => publishMutation.mutate(posting.id)}
                          disabled={publishMutation.isPending}
                          data-testid={`button-publish-${posting.id}`}
                        >
                          {publishMutation.isPending ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                          Post to {platform?.name}
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 text-green-600 w-full justify-center">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Active on {platform?.name}</span>
                        </div>
                      )}
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
