import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Star, Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function StaffManagement() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newStaff, setNewStaff] = useState({ workerId: 0, position: "", hourlyRate: 0 });

  const { data: staff, isLoading } = useQuery({
    queryKey: ["/api/employer/staff"],
  });

  const addStaffMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/employer/staff", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/staff"] });
      setShowAddDialog(false);
      toast({ title: "Staff member added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add staff", variant: "destructive" });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PATCH", `/api/employer/staff/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/staff"] });
      toast({ title: "Staff updated" });
    },
  });

  const handleRatingChange = (staffId: number, rating: number) => {
    updateStaffMutation.mutate({ id: staffId, updates: { performanceRating: rating } });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            Staff Management
          </h1>
          <p className="text-muted-foreground">Manage your team, track performance, and view employment history.</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-staff">
              <Plus className="h-4 w-4" />
              Add Staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Worker ID (from hired applicants)</Label>
                <Input 
                  type="number" 
                  value={newStaff.workerId} 
                  onChange={(e) => setNewStaff({ ...newStaff, workerId: parseInt(e.target.value) || 0 })}
                  data-testid="input-worker-id"
                />
              </div>
              <div>
                <Label>Position</Label>
                <Input 
                  value={newStaff.position} 
                  onChange={(e) => setNewStaff({ ...newStaff, position: e.target.value })}
                  placeholder="e.g., CNA, Driver"
                  data-testid="input-position"
                />
              </div>
              <div>
                <Label>Hourly Rate ($)</Label>
                <Input 
                  type="number" 
                  value={newStaff.hourlyRate} 
                  onChange={(e) => setNewStaff({ ...newStaff, hourlyRate: parseInt(e.target.value) || 0 })}
                  data-testid="input-hourly-rate"
                />
              </div>
              <Button 
                className="w-full" 
                onClick={() => addStaffMutation.mutate(newStaff)}
                disabled={addStaffMutation.isPending}
                data-testid="button-submit-staff"
              >
                {addStaffMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                Add Staff Member
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : !staff?.length ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No staff members yet</h3>
          <p className="text-muted-foreground mb-4">Add staff when you hire candidates</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(staff as any[]).map((member) => (
            <Card key={member.id} data-testid={`card-staff-${member.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{member.workerProfile?.name || "Unknown"}</CardTitle>
                    <CardDescription>{member.position}</CardDescription>
                  </div>
                  <Badge variant={member.status === "active" ? "default" : "secondary"}>
                    {member.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Hourly Rate:</span>
                  <span className="font-medium">${member.hourlyRate}/hr</span>
                  <span className="text-muted-foreground">Hired:</span>
                  <span className="font-medium">{new Date(member.hiredDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Performance Rating</Label>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => handleRatingChange(member.id, star)}
                        className="focus:outline-none"
                        data-testid={`button-rating-${member.id}-${star}`}
                      >
                        <Star 
                          className={`h-5 w-5 ${star <= (member.performanceRating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select 
                    value={member.status} 
                    onValueChange={(value) => updateStaffMutation.mutate({ id: member.id, updates: { status: value } })}
                  >
                    <SelectTrigger className="flex-1" data-testid={`select-status-${member.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active" data-testid={`option-active-${member.id}`}>Active</SelectItem>
                      <SelectItem value="inactive" data-testid={`option-inactive-${member.id}`}>Inactive</SelectItem>
                      <SelectItem value="terminated" data-testid={`option-terminated-${member.id}`}>Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
