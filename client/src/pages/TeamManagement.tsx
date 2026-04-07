import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useUser } from "@/hooks/use-auth";
import {
  Plus, Phone, Loader2, Users, Info, Copy, Check, KeyRound, Eye, EyeOff, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

// ── Types ────────────────────────────────────────────────────────────────────

type Employee = {
  id: number; name: string | null; username: string; email: string | null;
  phone: string | null; role: string; status: string;
};

type EmployeeProfile = {
  jobTitle: string | null; department: string | null; employmentType: string | null;
  payRate: number | null; payType: string | null; startDate: string | null;
  profilePhotoUrl: string | null;
};

type EmployeeWithProfile = Employee & { employeeProfile: EmployeeProfile | null };

type BusinessProfile = { companyName: string; enabledModules: string[] | null };

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null, username: string) {
  if (name) return name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return username.slice(0, 2).toUpperCase();
}

function lastName(name: string | null) {
  if (!name) return "";
  const parts = name.trim().split(" ");
  return parts[parts.length - 1].toLowerCase();
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function TeamManagement() {
  const { data: user } = useUser();

  const { data: profile } = useQuery<BusinessProfile>({
    queryKey: ["/api/employer/profile", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/employer/profile/${user?.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  const employeeDbEnabled = profile?.enabledModules?.includes("employee_database") ?? false;

  return employeeDbEnabled ? <EnhancedTeamView /> : <BasicTeamView />;
}

// ─────────────────────────────────────────────────────────────────────────────
// ENHANCED VIEW (Employee Database module ON)
// ─────────────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "active" | "inactive" | "terminated";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "terminated", label: "Terminated" },
];

function statusBadgeStyle(status: string) {
  if (status === "active")     return { bg: "#E1F5EE", color: "#085041" };
  if (status === "terminated") return { bg: "#FCEBEB", color: "#791F1F" };
  return { bg: "#F1EFE8", color: "#444441" };
}

function EnhancedTeamView() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<StatusFilter>("active");
  const [search, setSearch] = useState("");

  const { data: employees, isLoading } = useQuery<EmployeeWithProfile[]>({
    queryKey: ["/api/employees"],
  });

  // Filter + search
  const filtered = (employees ?? [])
    .filter(e => filter === "all" || e.status === filter)
    .filter(e => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (e.name ?? "").toLowerCase().includes(q) ||
        (e.employeeProfile?.jobTitle ?? "").toLowerCase().includes(q) ||
        (e.employeeProfile?.department ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => lastName(a.name).localeCompare(lastName(b.name)));

  const activeCount = (employees ?? []).filter(e => e.status === "active").length;

  function emptyMessage() {
    if (search) return `No employees matching "${search}".`;
    if (filter !== "all") return `No ${filter} employees found.`;
    return "No team members yet. Tap 'Add Employee' to get started.";
  }

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900" data-testid="heading-team">Team</h1>
          <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 text-xs font-semibold rounded-full px-2 py-0.5 min-w-[24px]">
            {activeCount}
          </span>
        </div>
        <Button
          size="sm"
          className="bg-primary text-white"
          onClick={() => navigate("/employer/employees/add")}
          data-testid="button-add-employee"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Employee
        </Button>
      </div>

      {/* ── Sticky filters + search ─────────────────────────────────────── */}
      <div className="sticky top-0 z-10 bg-white px-4 pb-3 border-b border-slate-100">
        {/* Filter tabs */}
        <div className="flex gap-1.5 mb-3">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              data-testid={`filter-${f.key}`}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                filter === f.key
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, title, or department"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
            data-testid="input-search-employees"
          />
        </div>
      </div>

      {/* ── List ────────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Users className="h-8 w-8 text-slate-200 mx-auto mb-2" />
            <p className="text-sm text-slate-500">{emptyMessage()}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map(emp => (
              <EnhancedEmployeeCard
                key={emp.id}
                emp={emp}
                onClick={() => navigate(`/employer/employees/${emp.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EnhancedEmployeeCard({
  emp, onClick,
}: {
  emp: EmployeeWithProfile;
  onClick: () => void;
}) {
  const badge = statusBadgeStyle(emp.status);
  const ini = initials(emp.name, emp.username);
  const title = emp.employeeProfile?.jobTitle;
  const dept = emp.employeeProfile?.department;
  const subtitle = [title, dept].filter(Boolean).join(" · ");

  return (
    <button
      className="w-full text-left bg-white border border-slate-200 rounded-lg px-3.5 py-3 flex items-center gap-3 hover:border-slate-300 hover:shadow-sm transition-all active:scale-[0.99]"
      onClick={onClick}
      data-testid={`employee-card-${emp.id}`}
    >
      {/* Avatar */}
      {emp.employeeProfile?.profilePhotoUrl ? (
        <img
          src={emp.employeeProfile.profilePhotoUrl}
          alt={emp.name ?? emp.username}
          className="h-11 w-11 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          className="h-11 w-11 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold"
          style={{ backgroundColor: "#E1F5EE", color: "#085041" }}
        >
          {ini}
        </div>
      )}

      {/* Name + title */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 leading-tight" data-testid={`text-employee-name-${emp.id}`}>
          {emp.name || emp.username}
        </p>
        {subtitle ? (
          <p className="text-xs text-slate-400 mt-0.5 truncate">{subtitle}</p>
        ) : (
          <p className="text-xs text-slate-300 mt-0.5 italic">No title set</p>
        )}
      </div>

      {/* Status badge */}
      <span
        className="shrink-0 font-medium"
        style={{
          backgroundColor: badge.bg,
          color: badge.color,
          fontSize: 11,
          fontWeight: 500,
          padding: "3px 8px",
          borderRadius: 8,
        }}
        data-testid={`badge-status-${emp.id}`}
      >
        {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BASIC VIEW (Employee Database module OFF — unchanged)
// ─────────────────────────────────────────────────────────────────────────────

function BasicTeamView() {
  const { toast } = useToast();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showAddPw, setShowAddPw] = useState(false);
  const [addedLogin, setAddedLogin] = useState<{ handle: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const [resetTarget, setResetTarget] = useState<Employee | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/business/employees"],
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/business/employees", data),
    onSuccess: (res: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/employees"] });
      setAddedLogin({ handle: res.loginHandle ?? res.username, password: form.password });
      setForm({ name: "", email: "", phone: "", password: "" });
    },
    onError: (err: any) => toast({ title: err?.message ?? "Failed to add employee", variant: "destructive" }),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiRequest("PATCH", `/api/business/employees/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/employees"] });
      toast({ title: "Status updated" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  const resetMutation = useMutation({
    mutationFn: ({ id, password }: { id: number; password: string }) =>
      apiRequest("PATCH", `/api/business/employees/${id}/password`, { password }),
    onSuccess: () => setResetDone(true),
    onError: (err: any) => toast({ title: err?.message ?? "Failed to reset password", variant: "destructive" }),
  });

  function handleAdd() {
    if (!form.password) { toast({ title: "A temporary password is required", variant: "destructive" }); return; }
    if (!form.name && !form.email) { toast({ title: "Name or email is required", variant: "destructive" }); return; }
    addMutation.mutate(form);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function handleAddClose() { setShowAdd(false); setAddedLogin(null); setCopied(false); setShowAddPw(false); }
  function openReset(emp: Employee) { setResetTarget(emp); setResetPw(""); setResetDone(false); setShowResetPw(false); }
  function handleReset() {
    if (!resetPw || resetPw.length < 4) { toast({ title: "Password must be at least 4 characters", variant: "destructive" }); return; }
    if (resetTarget) resetMutation.mutate({ id: resetTarget.id, password: resetPw });
  }
  function handleResetClose() { setResetTarget(null); setResetPw(""); setResetDone(false); setShowResetPw(false); }

  const active = employees?.filter(e => e.status !== "inactive") ?? [];
  const inactive = employees?.filter(e => e.status === "inactive") ?? [];

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900" data-testid="heading-team">Team</h1>
        <Button size="sm" onClick={() => setShowAdd(true)} data-testid="button-add-employee">
          <Plus className="h-4 w-4 mr-1" /> Add Employee
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : employees?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No employees yet.</p>
            <p className="text-slate-400 text-xs mt-1">Add your first team member.</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {active.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Active ({active.length})</p>
              <div className="space-y-2 mb-4">
                {active.map(emp => (
                  <BasicEmployeeCard key={emp.id} emp={emp}
                    onToggle={status => toggleStatus.mutate({ id: emp.id, status })}
                    toggling={toggleStatus.isPending}
                    onResetPassword={() => openReset(emp)}
                  />
                ))}
              </div>
            </>
          )}
          {inactive.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Inactive ({inactive.length})</p>
              <div className="space-y-2">
                {inactive.map(emp => (
                  <BasicEmployeeCard key={emp.id} emp={emp}
                    onToggle={status => toggleStatus.mutate({ id: emp.id, status })}
                    toggling={toggleStatus.isPending}
                    onResetPassword={() => openReset(emp)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={showAdd} onOpenChange={v => !v && handleAddClose()}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader><DialogTitle>{addedLogin ? "Employee Added" : "Add Team Member"}</DialogTitle></DialogHeader>
          {addedLogin ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                <p className="font-semibold mb-1">Account created successfully!</p>
                <p className="text-xs text-green-700">Share these credentials with your employee so they can sign in.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Login</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-slate-900 text-xs bg-white border rounded px-2 py-0.5">{addedLogin.handle}</code>
                    <button onClick={() => handleCopy(`Login: ${addedLogin.handle}\nPassword: ${addedLogin.password}`)} className="text-slate-400 hover:text-primary" data-testid="button-copy-credentials">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Password</span>
                  <code className="font-mono text-slate-900 text-xs bg-white border rounded px-2 py-0.5">{addedLogin.password}</code>
                </div>
              </div>
              <p className="text-xs text-slate-400 flex items-start gap-1.5">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                They sign in at the app login page using these credentials.
              </p>
              <Button className="w-full" onClick={handleAddClose} data-testid="button-done-employee">Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div>
                  <Label>Full Name</Label>
                  <Input placeholder="e.g. Jake Martinez" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-employee-name" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label>Email <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
                    <Input type="email" placeholder="jake@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="input-employee-email" />
                  </div>
                  <div>
                    <Label>Phone <span className="text-slate-400 font-normal text-xs">(optional)</span></Label>
                    <Input type="tel" placeholder="555-0101" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} data-testid="input-employee-phone" />
                  </div>
                </div>
                <div className="border-t pt-3">
                  <Label>Temporary Password *</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showAddPw ? "text" : "password"}
                      placeholder="Set an initial password"
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      data-testid="input-employee-password"
                    />
                    <button type="button" onClick={() => setShowAddPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                      {showAddPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    {form.email ? "They'll sign in with their email address." : "A login handle will be generated from their name."}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleAddClose}>Cancel</Button>
                <Button onClick={handleAdd} disabled={addMutation.isPending} data-testid="button-save-employee">
                  {addMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Add Employee
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={v => !v && handleResetClose()}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{resetDone ? "Password Reset" : `Reset Password — ${resetTarget?.name || resetTarget?.username}`}</DialogTitle>
          </DialogHeader>
          {resetDone ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
                <p className="font-semibold mb-1">Password updated!</p>
                <p className="text-xs text-green-700">Share the new credentials with your employee.</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Login</span>
                  <code className="font-mono text-slate-900 text-xs bg-white border rounded px-2 py-0.5">{resetTarget?.username}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">New Password</span>
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-slate-900 text-xs bg-white border rounded px-2 py-0.5">{resetPw}</code>
                    <button onClick={() => handleCopy(`Login: ${resetTarget?.username}\nPassword: ${resetPw}`)} className="text-slate-400 hover:text-primary" data-testid="button-copy-reset-credentials">
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
              <Button className="w-full" onClick={handleResetClose} data-testid="button-done-reset">Done</Button>
            </div>
          ) : (
            <>
              <div className="space-y-3 py-1">
                <p className="text-sm text-slate-500">
                  Set a new password for <span className="font-medium text-slate-800">{resetTarget?.name || resetTarget?.username}</span>.
                  Their login is <code className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{resetTarget?.username}</code>.
                </p>
                <div>
                  <Label>New Password</Label>
                  <div className="relative mt-1">
                    <Input
                      type={showResetPw ? "text" : "password"}
                      placeholder="Enter new password"
                      value={resetPw}
                      onChange={e => setResetPw(e.target.value)}
                      data-testid="input-reset-password"
                    />
                    <button type="button" onClick={() => setShowResetPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600" tabIndex={-1}>
                      {showResetPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleResetClose}>Cancel</Button>
                <Button onClick={handleReset} disabled={resetMutation.isPending} data-testid="button-confirm-reset">
                  {resetMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Reset Password
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BasicEmployeeCard({ emp, onToggle, toggling, onResetPassword }: {
  emp: Employee;
  onToggle: (status: string) => void;
  toggling: boolean;
  onResetPassword: () => void;
}) {
  const isActive = emp.status !== "inactive";
  return (
    <Card data-testid={`employee-card-${emp.id}`}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 font-semibold text-sm ${isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-400"}`}>
            {initials(emp.name, emp.username)}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-semibold text-sm ${isActive ? "text-slate-900" : "text-slate-400"}`}>{emp.name || emp.username}</p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-slate-400 font-mono bg-slate-100 px-1.5 py-0.5 rounded" data-testid={`text-login-${emp.id}`}>
                {emp.username}
              </span>
              {emp.phone && <span className="flex items-center gap-0.5 text-xs text-slate-500"><Phone className="h-3 w-3" />{emp.phone}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onResetPassword}
              className="text-slate-400 hover:text-primary p-1 rounded-lg hover:bg-slate-100 transition-colors"
              title="Reset password"
              data-testid={`button-reset-password-${emp.id}`}
            >
              <KeyRound className="h-4 w-4" />
            </button>
            <Switch
              checked={isActive}
              onCheckedChange={checked => onToggle(checked ? "active" : "inactive")}
              disabled={toggling}
              data-testid={`toggle-employee-${emp.id}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
