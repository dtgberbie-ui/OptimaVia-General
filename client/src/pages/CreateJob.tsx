import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertJobSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Send } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

import { z } from "zod";

const formSchema = insertJobSchema.omit({ employerId: true }).extend({
  payMin: z.coerce.number().min(0, "Min salary is required"),
  payMax: z.coerce.number().min(0, "Max salary is required"),
});

export default function CreateJob() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      industry: "",
      department: "",
      employmentType: "full-time",
      location: "",
      city: "",
      payMin: 0,
      payMax: 0,
      requiredCertifications: [] as string[],
      responsibilities: "",
      requirements: "",
      schedule: "",
      benefits: "",
      status: "DRAFT",
    },
  });

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/employer/jobs", data);
      return res.json();
    },
    onSuccess: (job: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/jobs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employer/hiring/stats"] });
      if (job.status === "OPEN") {
        toast({ title: "Job Published!", description: "Your job is now live and candidates can apply." });
        setLocation("/employer/hiring");
      } else {
        toast({ title: "Draft Saved", description: "Your job has been saved as a draft." });
        setLocation("/employer/hiring");
      }
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: any, status: string) => {
    createJobMutation.mutate({
      ...data,
      payMin: Number(data.payMin),
      payMax: Number(data.payMax),
      status,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-display">Post a New Job</CardTitle>
          <CardDescription>Fill in the job details below. You can save as draft or publish immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title *</FormLabel>
                    <FormControl><Input placeholder="e.g. Senior Truck Driver" {...field} data-testid="input-job-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Industry *</FormLabel>
                      <FormControl><Input placeholder="e.g. Healthcare, Logistics" {...field} data-testid="input-job-industry" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="department"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <FormControl><Input placeholder="e.g. Operations" {...field} value={field.value || ""} data-testid="input-job-department" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employment Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || "full-time"}>
                        <FormControl>
                          <SelectTrigger data-testid="select-employment-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="full-time">Full-time</SelectItem>
                          <SelectItem value="part-time">Part-time</SelectItem>
                          <SelectItem value="contract">Contract</SelectItem>
                          <SelectItem value="temporary">Temporary</SelectItem>
                          <SelectItem value="internship">Internship</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="schedule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Schedule</FormLabel>
                      <FormControl><Input placeholder="e.g. Mon-Fri 8am-5pm" {...field} value={field.value || ""} data-testid="input-job-schedule" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location (State/Region) *</FormLabel>
                      <FormControl><Input placeholder="e.g. California" {...field} data-testid="input-job-location" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl><Input placeholder="e.g. Los Angeles" {...field} value={field.value || ""} data-testid="input-job-city" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="payMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Salary ($/yr) *</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-job-pay-min" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payMax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Salary ($/yr) *</FormLabel>
                      <FormControl><Input type="number" {...field} data-testid="input-job-pay-max" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="requiredCertifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Certifications (comma separated)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g. CDL-A, OSHA 30" 
                        onChange={(e) => field.onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                        data-testid="input-job-certifications"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description *</FormLabel>
                    <FormControl><Textarea className="min-h-[120px]" placeholder="Describe the role, team, and work environment..." {...field} data-testid="input-job-description" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="responsibilities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Responsibilities</FormLabel>
                    <FormControl><Textarea className="min-h-[100px]" placeholder="List the main duties and responsibilities..." {...field} value={field.value || ""} data-testid="input-job-responsibilities" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requirements"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Requirements</FormLabel>
                    <FormControl><Textarea className="min-h-[100px]" placeholder="Required qualifications, experience, skills..." {...field} value={field.value || ""} data-testid="input-job-requirements" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefits</FormLabel>
                    <FormControl><Textarea className="min-h-[80px]" placeholder="Health insurance, 401k, PTO..." {...field} value={field.value || ""} data-testid="input-job-benefits" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 gap-2"
                  disabled={createJobMutation.isPending}
                  onClick={() => form.handleSubmit((data) => onSubmit(data, "DRAFT"))()}
                  data-testid="button-save-draft"
                >
                  {createJobMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="h-4 w-4" />}
                  Save as Draft
                </Button>
                <Button
                  type="button"
                  className="flex-1 gap-2"
                  disabled={createJobMutation.isPending}
                  onClick={() => form.handleSubmit((data) => onSubmit(data, "OPEN"))()}
                  data-testid="button-publish-job"
                >
                  {createJobMutation.isPending ? <Loader2 className="animate-spin h-4 w-4" /> : <Send className="h-4 w-4" />}
                  Publish Job
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
