import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plus, User, Phone, Mail, UserCheck, UserX, Loader2, Users } from "lucide-react";
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
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", username: "", password: "" });

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/business/employees"],
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/business/employees", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/employees"] });
      setShowAdd(false);
      setForm({ name: "", email: "", phone: "", username: "", password: "" });
      toast({ title: "Employee added" });
    },
    onError: (err: any) => toast({ title: err?.message ?? "Failed to add employee", variant: "destructive" }),
  });

  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => apiRequest("PATCH", `/api/business/employees/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/employees"] });
      toast({ title: "Status updated" });
    },
    onError: () => toast({ title: "Failed to update", variant: "destructive" }),
  });

  function handleAdd() {
    if (!form.username || !form.password) {
      toast({ title: "Username and password are required", variant: "destructive" });
      return;
    }
    addMutation.mutate(form);
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
                {active.map(emp => <EmployeeCard key={emp.id} emp={emp} onToggle={status => toggleStatus.mutate({ id: emp.id, status })} toggling={toggleStatus.isPending} />)}
              </div>
            </>
          )}
          {inactive.length > 0 && (
            <>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Inactive ({inactive.length})</p>
              <div className="space-y-2">
                {inactive.map(emp => <EmployeeCard key={emp.id} emp={emp} onToggle={status => toggleStatus.mutate({ id: emp.id, status })} toggling={toggleStatus.isPending} />)}
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Employee Dialog */}
      <Dialog open={showAdd} onOpenChange={v => !v && setShowAdd(false)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Full Name</Label>
              <Input placeholder="e.g. Jake Martinez" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} data-testid="input-employee-name" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Email</Label>
                <Input type="email" placeholder="jake@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} data-testid="input-employee-email" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input type="tel" placeholder="555-0101" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} data-testid="input-employee-phone" />
              </div>
            </div>
            <div className="border-t pt-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Login Credentials</p>
              <div className="space-y-2">
                <div>
                  <Label>Username *</Label>
                  <Input placeholder="e.g. jake_filta" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} data-testid="input-employee-username" />
                </div>
                <div>
                  <Label>Password *</Label>
                  <Input type="password" placeholder="Temporary password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} data-testid="input-employee-password" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} disabled={addMutation.isPending} data-testid="button-save-employee">
              {addMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Add Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmployeeCard({ emp, onToggle, toggling }: {
  emp: Employee; onToggle: (status: string) => void; toggling: boolean;
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
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
              {emp.email && <span className="flex items-center gap-0.5"><Mail className="h-3 w-3" />{emp.email}</span>}
              {emp.phone && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{emp.phone}</span>}
            </div>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={checked => onToggle(checked ? "active" : "inactive")}
            disabled={toggling}
            data-testid={`toggle-employee-${emp.id}`}
          />
        </div>
      </CardContent>
    </Card>
  );
}
