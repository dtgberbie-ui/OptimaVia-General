import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, Phone, Loader2, Users, Info, Copy, Check, KeyRound, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Employee = {
  id: number; name: string | null; username: string; email: string | null;
  phone: string | null; role: string; status: string;
};

function initials(e: Employee) {
  if (e.name) return e.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
  return e.username.slice(0, 2).toUpperCase();
}

export default function TeamManagement() {
  const { toast } = useToast();

  // ── Add employee state ──────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [showAddPw, setShowAddPw] = useState(false);
  const [addedLogin, setAddedLogin] = useState<{ handle: string; password: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Reset password state ────────────────────────────────────────────────
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);
  const [resetPw, setResetPw] = useState("");
  const [showResetPw, setShowResetPw] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/business/employees"],
  });

  // ── Mutations ───────────────────────────────────────────────────────────
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
    onSuccess: () => {
      setResetDone(true);
    },
    onError: (err: any) => toast({ title: err?.message ?? "Failed to reset password", variant: "destructive" }),
  });

  // ── Handlers ────────────────────────────────────────────────────────────
  function handleAdd() {
    if (!form.password) {
      toast({ title: "A temporary password is required", variant: "destructive" });
      return;
    }
    if (!form.name && !form.email) {
      toast({ title: "Name or email is required", variant: "destructive" });
      return;
    }
    addMutation.mutate(form);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleAddClose() {
    setShowAdd(false);
    setAddedLogin(null);
    setCopied(false);
    setShowAddPw(false);
  }

  function openReset(emp: Employee) {
    setResetTarget(emp);
    setResetPw("");
    setResetDone(false);
    setShowResetPw(false);
  }

  function handleReset() {
    if (!resetPw || resetPw.length < 4) {
      toast({ title: "Password must be at least 4 characters", variant: "destructive" });
      return;
    }
    if (resetTarget) resetMutation.mutate({ id: resetTarget.id, password: resetPw });
  }

  function handleResetClose() {
    setResetTarget(null);
    setResetPw("");
    setResetDone(false);
    setShowResetPw(false);
  }

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
                  <EmployeeCard
                    key={emp.id} emp={emp}
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
                  <EmployeeCard
                    key={emp.id} emp={emp}
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

      {/* ── Add Employee Dialog ─────────────────────────────────────────── */}
      <Dialog open={showAdd} onOpenChange={v => !v && handleAddClose()}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{addedLogin ? "Employee Added" : "Add Team Member"}</DialogTitle>
          </DialogHeader>

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

      {/* ── Reset Password Dialog ───────────────────────────────────────── */}
      <Dialog open={!!resetTarget} onOpenChange={v => !v && handleResetClose()}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>
              {resetDone ? "Password Reset" : `Reset Password — ${resetTarget?.name || resetTarget?.username}`}
            </DialogTitle>
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

function EmployeeCard({ emp, onToggle, toggling, onResetPassword }: {
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
            {initials(emp)}
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
