import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { Plus, MapPin, Clock, User, ChevronRight, Filter, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Employee = { id: number; name: string | null; username: string };
type ServiceJob = {
  id: number; title: string; clientName: string; serviceAddress: string;
  scheduledDate: string; scheduledTime: string | null; status: string;
  priority: string; keyTrackingEnabled: boolean;
  assignedEmployee: Employee | null;
};

const STATUS_OPTIONS = ["all", "unassigned", "assigned", "in_progress", "completed"];

function statusColor(s: string) {
  if (s === "completed") return "default" as const;
  if (s === "in_progress") return "default" as const;
  if (s === "assigned") return "secondary" as const;
  return "outline" as const;
}

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

function priorityBadge(p: string) {
  if (p === "high") return "bg-red-100 text-red-700";
  if (p === "medium") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-500";
}

export default function ServiceJobs() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    clientName: "", serviceAddress: "", scheduledDate: "", scheduledTime: "",
    notes: "", assignedTo: "", priority: "medium", keyTrackingEnabled: false,
  });

  const { data: jobs, isLoading } = useQuery<ServiceJob[]>({
    queryKey: ["/api/service-jobs"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/business/employees"],
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/service-jobs", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/service-jobs"] });
      setShowCreate(false);
      setForm({ clientName: "", serviceAddress: "", scheduledDate: "", scheduledTime: "", notes: "", assignedTo: "", priority: "medium", keyTrackingEnabled: false });
      toast({ title: "Job created successfully" });
    },
    onError: () => toast({ title: "Failed to create job", variant: "destructive" }),
  });

  const filtered = jobs?.filter(j => filter === "all" || j.status === filter) ?? [];

  function handleCreate() {
    if (!form.clientName || !form.serviceAddress || !form.scheduledDate) {
      toast({ title: "Please fill in required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...form,
      title: "Service Job",
      assignedTo: form.assignedTo ? parseInt(form.assignedTo) : null,
    });
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900" data-testid="heading-service-jobs">Service Jobs</h1>
        <Button size="sm" onClick={() => setShowCreate(true)} data-testid="button-create-job">
          <Plus className="h-4 w-4 mr-1" /> New Job
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {STATUS_OPTIONS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
              filter === s ? "bg-primary text-white border-primary" : "bg-white text-slate-600 border-slate-200 hover:border-primary"
            }`}
            data-testid={`filter-${s}`}
          >
            {statusLabel(s === "all" ? "All" : s)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-slate-400 text-sm">
            No {filter !== "all" ? statusLabel(filter) + " " : ""}jobs found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(job => (
            <Link key={job.id} href={`/employer/service-jobs/${job.id}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`job-card-${job.id}`}>
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
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityBadge(job.priority)}`}>{job.priority}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {job.scheduledDate}{job.scheduledTime ? ` at ${job.scheduledTime}` : ""}
                    </span>
                    {job.assignedEmployee ? (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {job.assignedEmployee.name || job.assignedEmployee.username}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Unassigned</span>
                    )}
                    {job.keyTrackingEnabled && <span className="text-indigo-600">🔑 Key tracking</span>}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Job Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Create Service Job</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Client Name *</Label>
              <Input placeholder="e.g. The Pit BBQ" value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} data-testid="input-client-name" />
            </div>
            <div>
              <Label>Service Address *</Label>
              <Input placeholder="Full address" value={form.serviceAddress} onChange={e => setForm(f => ({ ...f, serviceAddress: e.target.value }))} data-testid="input-service-address" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Date *</Label>
                <Input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} data-testid="input-scheduled-date" />
              </div>
              <div>
                <Label>Time</Label>
                <Input type="time" value={form.scheduledTime} onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))} data-testid="input-scheduled-time" />
              </div>
            </div>
            <div>
              <Label>Assign To</Label>
              <Select value={form.assignedTo} onValueChange={v => setForm(f => ({ ...f, assignedTo: v }))}>
                <SelectTrigger data-testid="select-assign-to"><SelectValue placeholder="Choose employee..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {employees?.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.name || e.username}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger data-testid="select-priority"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea placeholder="Instructions, access codes, etc." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} data-testid="input-notes" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.keyTrackingEnabled} onCheckedChange={v => setForm(f => ({ ...f, keyTrackingEnabled: v }))} id="key-tracking" data-testid="switch-key-tracking" />
              <Label htmlFor="key-tracking" className="text-sm">Key / Asset Tracking</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending} data-testid="button-create-job-submit">
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Create Job
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
