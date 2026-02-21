import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Plus, Loader2, Trash2, CalendarDays } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function ShiftScheduling() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newShift, setNewShift] = useState({
    staffId: null as number | null,
    date: "",
    startTime: "",
    endTime: "",
    role: "",
    notes: "",
  });

  const { data: shifts, isLoading } = useQuery({
    queryKey: ["/api/employer/shifts"],
  });

  const { data: staff } = useQuery({
    queryKey: ["/api/employer/staff"],
  });

  const createShiftMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/employer/shifts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/shifts"] });
      setShowAddDialog(false);
      setNewShift({ staffId: null, date: "", startTime: "", endTime: "", role: "", notes: "" });
      toast({ title: "Shift created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create shift", variant: "destructive" });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/employer/shifts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/shifts"] });
      toast({ title: "Shift deleted" });
    },
  });

  const today = new Date();
  const sortedShifts = (shifts as any[] || []).sort((a: any, b: any) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateA - dateB;
  });

  const upcomingShifts = sortedShifts.filter((s: any) => s.date && new Date(s.date) >= today);
  const pastShifts = sortedShifts.filter((s: any) => s.date && new Date(s.date) < today);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3" data-testid="text-shift-scheduling-title">
            <CalendarDays className="h-8 w-8 text-primary" />
            Shift Scheduling
          </h1>
          <p className="text-muted-foreground">Schedule and manage staff shifts.</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-shift">
              <Plus className="h-4 w-4" />
              New Shift
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Shift</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Assign To</Label>
                <Select
                  value={newShift.staffId?.toString() || ""}
                  onValueChange={(value) => setNewShift({ ...newShift, staffId: value ? parseInt(value) : null })}
                >
                  <SelectTrigger data-testid="select-shift-staff">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {(staff as any[] || []).map((s: any) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.workerProfile?.name || `Staff ${s.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={newShift.date}
                  onChange={(e) => setNewShift({ ...newShift, date: e.target.value })}
                  data-testid="input-shift-date"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                    data-testid="input-shift-start"
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                    data-testid="input-shift-end"
                  />
                </div>
              </div>
              <div>
                <Label>Role / Position</Label>
                <Input
                  value={newShift.role}
                  onChange={(e) => setNewShift({ ...newShift, role: e.target.value })}
                  placeholder="e.g., CNA, Driver, Technician"
                  data-testid="input-shift-role"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Input
                  value={newShift.notes}
                  onChange={(e) => setNewShift({ ...newShift, notes: e.target.value })}
                  placeholder="Optional notes"
                  data-testid="input-shift-notes"
                />
              </div>
              <Button
                className="w-full"
                onClick={() => createShiftMutation.mutate(newShift)}
                disabled={createShiftMutation.isPending || !newShift.date}
                data-testid="button-submit-shift"
              >
                {createShiftMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                Schedule Shift
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : !(shifts as any[])?.length ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
          <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No shifts scheduled</h3>
          <p className="text-muted-foreground mb-4">Create shifts to manage your team's schedule</p>
        </div>
      ) : (
        <div className="space-y-8">
          {upcomingShifts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4" data-testid="text-upcoming-shifts">Upcoming Shifts ({upcomingShifts.length})</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingShifts.map((shift: any) => (
                  <Card key={shift.id} data-testid={`card-shift-${shift.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {shift.date ? format(new Date(shift.date), "EEE, MMM d") : "No date"}
                          </CardTitle>
                          <CardDescription>
                            {shift.startTime && shift.endTime
                              ? `${shift.startTime} - ${shift.endTime}`
                              : "Time TBD"}
                          </CardDescription>
                        </div>
                        <Badge variant="default">Upcoming</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {shift.staffMember && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Staff:</span>
                            <span className="font-medium">{shift.staffMember?.workerProfile?.name || `Staff ${shift.staffId}`}</span>
                          </div>
                        )}
                        {shift.role && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Role:</span>
                            <span className="font-medium">{shift.role}</span>
                          </div>
                        )}
                        {shift.notes && (
                          <p className="text-muted-foreground italic">{shift.notes}</p>
                        )}
                      </div>
                      <div className="flex justify-end mt-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteShiftMutation.mutate(shift.id)}
                          data-testid={`button-delete-shift-${shift.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {pastShifts.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Past Shifts ({pastShifts.length})</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastShifts.map((shift: any) => (
                  <Card key={shift.id} className="opacity-75" data-testid={`card-shift-past-${shift.id}`}>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {shift.date ? format(new Date(shift.date), "EEE, MMM d") : "No date"}
                          </CardTitle>
                          <CardDescription>
                            {shift.startTime && shift.endTime
                              ? `${shift.startTime} - ${shift.endTime}`
                              : "Time TBD"}
                          </CardDescription>
                        </div>
                        <Badge variant="secondary">Past</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {shift.staffMember && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Staff:</span>
                            <span className="font-medium">{shift.staffMember?.workerProfile?.name || `Staff ${shift.staffId}`}</span>
                          </div>
                        )}
                        {shift.role && (
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Role:</span>
                            <span className="font-medium">{shift.role}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
