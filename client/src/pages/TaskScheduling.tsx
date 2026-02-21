import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Plus, Loader2, Trash2, CheckCircle2, AlertCircle, Circle } from "lucide-react";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function TaskScheduling() {
  const { toast } = useToast();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newTask, setNewTask] = useState({ 
    title: "", 
    description: "", 
    priority: "medium", 
    dueDate: "", 
    staffId: null as number | null 
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["/api/employer/tasks"],
  });

  const { data: staff } = useQuery({
    queryKey: ["/api/employer/staff"],
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/employer/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/tasks"] });
      setShowAddDialog(false);
      setNewTask({ title: "", description: "", priority: "medium", dueDate: "", staffId: null });
      toast({ title: "Task created successfully" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: any }) => {
      return apiRequest("PATCH", `/api/employer/tasks/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/tasks"] });
      toast({ title: "Task updated" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/employer/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/tasks"] });
      toast({ title: "Task deleted" });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "destructive";
      case "medium": return "default";
      case "low": return "secondary";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Clock className="h-4 w-4 text-blue-500" />;
      case "cancelled": return <AlertCircle className="h-4 w-4 text-gray-400" />;
      default: return <Circle className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-primary" />
            Task Scheduling
          </h1>
          <p className="text-muted-foreground">Assign and track tasks for your staff.</p>
        </div>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="button-add-task">
              <Plus className="h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Title</Label>
                <Input 
                  value={newTask.title} 
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="Task title"
                  data-testid="input-task-title"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea 
                  value={newTask.description} 
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  placeholder="Task details..."
                  data-testid="input-task-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select 
                    value={newTask.priority} 
                    onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
                  >
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input 
                    type="date" 
                    value={newTask.dueDate} 
                    onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                    data-testid="input-due-date"
                  />
                </div>
              </div>
              <div>
                <Label>Assign To</Label>
                <Select 
                  value={newTask.staffId?.toString() || ""} 
                  onValueChange={(value) => setNewTask({ ...newTask, staffId: value && value !== "unassigned" ? parseInt(value) : null })}
                >
                  <SelectTrigger data-testid="select-assignee">
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {(staff as any[] || []).map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.workerProfile?.name || `Staff ${s.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="w-full" 
                onClick={() => createTaskMutation.mutate(newTask)}
                disabled={createTaskMutation.isPending || !newTask.title}
                data-testid="button-submit-task"
              >
                {createTaskMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : null}
                Create Task
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
      ) : !tasks?.length ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
          <p className="text-muted-foreground mb-4">Create tasks to assign to your staff</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(tasks as any[]).map((task) => (
            <Card key={task.id} data-testid={`card-task-${task.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-2">
                    {getStatusIcon(task.status)}
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      {task.assignee?.workerProfile && (
                        <CardDescription>Assigned to: {task.assignee.workerProfile.name}</CardDescription>
                      )}
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {task.description && (
                  <p className="text-sm text-muted-foreground mb-4">{task.description}</p>
                )}
                {task.dueDate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2">
                <Select 
                  value={task.status} 
                  onValueChange={(value) => updateTaskMutation.mutate({ id: task.id, updates: { status: value } })}
                >
                  <SelectTrigger className="flex-1" data-testid={`select-task-status-${task.id}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => deleteTaskMutation.mutate(task.id)}
                  data-testid={`button-delete-task-${task.id}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
