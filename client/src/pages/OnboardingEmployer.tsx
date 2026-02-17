import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployerProfileSchema } from "@shared/schema";
import { useCreateEmployerProfile } from "@/hooks/use-onboarding";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2 } from "lucide-react";

const INDUSTRIES = [
  "Home Care",
  "Trucking & Logistics",
  "Manufacturing",
  "Construction",
  "Healthcare",
  "Warehousing & Distribution",
  "Agriculture",
  "Food & Beverage",
  "Hospitality",
  "Cleaning & Janitorial",
  "Landscaping",
  "Retail",
  "Staffing & Recruiting",
  "Transportation",
  "Energy & Utilities",
  "Other",
];

export default function OnboardingEmployer() {
  const createProfileMutation = useCreateEmployerProfile();
  
  const form = useForm({
    resolver: zodResolver(insertEmployerProfileSchema.omit({ userId: true })),
    defaultValues: {
      companyName: "",
      industry: "",
      location: "",
    },
  });

  const onSubmit = (data: any) => createProfileMutation.mutate(data);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-display">Setup Your Company Profile</CardTitle>
          <CardDescription>Tell us about your organization to start hiring.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Logistics Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-industry">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry} data-testid={`option-industry-${industry.toLowerCase().replace(/\s+/g, '-')}`}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headquarters Location</FormLabel>
                    <FormControl>
                      <Input placeholder="City, State" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={createProfileMutation.isPending}>
                {createProfileMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Complete Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
