import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

// ── Validation schema ─────────────────────────────────────────────────────────

const schema = z.object({
  firstName: z.string().min(1, "This field is required"),
  lastName: z.string().min(1, "This field is required"),
  email: z.string().min(1, "This field is required").email("Enter a valid email"),
  phone: z.string().min(1, "This field is required"),
  jobTitle: z.string().min(1, "This field is required"),
  employmentType: z.enum(["full_time", "part_time", "contract"]),
  startDate: z.string().min(1, "This field is required"),
  payRate: z.string().optional().refine(v => {
    if (!v || v.trim() === "") return true;
    const n = parseFloat(v);
    return !isNaN(n) && n >= 0;
  }, { message: "Pay rate must be a positive number" }),
  payType: z.enum(["hourly", "salary"]),
  department: z.string().optional(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof schema>;

// ── Component ─────────────────────────────────────────────────────────────────

export default function AddEmployee() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "",
      employmentType: "full_time",
      startDate: today,
      payRate: "",
      payType: "hourly",
      department: "",
      password: "",
    },
  });

  // Step 1: create user account
  const createUserMutation = useMutation({
    mutationFn: (data: { name: string; email: string; phone: string; password: string }) =>
      apiRequest("POST", "/api/business/employees", data),
    onError: async (err: any) => {
      const body = await err.json?.().catch(() => null);
      const msg = body?.message ?? "Failed to create employee";
      if (msg.toLowerCase().includes("email")) {
        form.setError("email", { message: "An account with this email already exists" });
      } else {
        toast({ title: msg, variant: "destructive" });
      }
    },
  });

  // Step 2: create employee profile
  const createProfileMutation = useMutation({
    mutationFn: ({ id, profile }: { id: number; profile: any }) =>
      apiRequest("PUT", `/api/employees/${id}`, profile),
  });

  async function onSubmit(values: FormValues) {
    const fullName = `${values.firstName.trim()} ${values.lastName.trim()}`;

    let newEmployee: any;
    try {
      const res = await fetch("/api/business/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: fullName,
          email: values.email.trim().toLowerCase(),
          phone: values.phone.trim(),
          password: values.password,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg: string = body.message ?? "Failed to create employee";
        if (msg.toLowerCase().includes("email")) {
          form.setError("email", { message: "An account with this email already exists" });
        } else {
          toast({ title: msg, variant: "destructive" });
        }
        return;
      }
      newEmployee = await res.json();
    } catch {
      toast({ title: "Network error. Please try again.", variant: "destructive" });
      return;
    }

    // Step 2: save profile fields
    const profilePayload: Record<string, any> = {
      jobTitle: values.jobTitle.trim(),
      employmentType: values.employmentType,
      startDate: values.startDate,
      payType: values.payType,
    };
    if (values.payRate && values.payRate.trim() !== "") {
      profilePayload.payRate = parseFloat(values.payRate);
    }
    if (values.department && values.department.trim()) {
      profilePayload.department = values.department.trim();
    }

    try {
      await fetch(`/api/employees/${newEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(profilePayload),
      });
    } catch {
      // Profile creation failed — not critical, user was created
    }

    queryClient.invalidateQueries({ queryKey: ["/api/business/employees"] });

    toast({ title: "Employee added successfully" });
    navigate("/employer/team");
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <div className="max-w-lg mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-5 pb-4">
        <button
          onClick={() => navigate("/employer/team")}
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 -ml-1"
          data-testid="button-back"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="text-sm font-medium">Team</span>
        </button>
        <h1 className="ml-2 text-lg font-semibold text-slate-900">Add employee</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="px-4 space-y-4">

          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">First name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Jane" data-testid="input-first-name" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Last name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Smith" data-testid="input-last-name" />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" placeholder="jane@example.com" data-testid="input-email" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Phone */}
          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">Phone</FormLabel>
                <FormControl>
                  <Input {...field} type="tel" placeholder="555-0101" data-testid="input-phone" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Divider */}
          <div className="border-t border-slate-100 pt-1" />

          {/* Job title */}
          <FormField
            control={form.control}
            name="jobTitle"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">Job title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Technician, Shift Lead, Server" data-testid="input-job-title" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Employment type */}
          <FormField
            control={form.control}
            name="employmentType"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">Employment type</FormLabel>
                <FormControl>
                  <div className="flex rounded-lg border border-slate-200 overflow-hidden" data-testid="segmented-employment-type">
                    {(["full_time", "part_time", "contract"] as const).map((type, i) => {
                      const labels = { full_time: "Full-time", part_time: "Part-time", contract: "Contract" };
                      const active = field.value === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => field.onChange(type)}
                          data-testid={`option-${type}`}
                          className={[
                            "flex-1 py-2 text-sm font-medium transition-colors",
                            i > 0 ? "border-l border-slate-200" : "",
                            active
                              ? "bg-primary text-white"
                              : "bg-white text-slate-600 hover:bg-slate-50",
                          ].join(" ")}
                        >
                          {labels[type]}
                        </button>
                      );
                    })}
                  </div>
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Start date */}
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">Start date</FormLabel>
                <FormControl>
                  <Input {...field} type="date" data-testid="input-start-date" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Pay rate + type */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              control={form.control}
              name="payRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Pay rate</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                      <Input {...field} type="number" min="0" step="0.01" placeholder="0.00" className="pl-7" data-testid="input-pay-rate" />
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Pay type</FormLabel>
                  <FormControl>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden h-[40px]" data-testid="segmented-pay-type">
                      {(["hourly", "salary"] as const).map((type, i) => {
                        const active = field.value === type;
                        return (
                          <button
                            key={type}
                            type="button"
                            onClick={() => field.onChange(type)}
                            data-testid={`option-${type}`}
                            className={[
                              "flex-1 text-sm font-medium transition-colors",
                              i > 0 ? "border-l border-slate-200" : "",
                              active
                                ? "bg-primary text-white"
                                : "bg-white text-slate-600 hover:bg-slate-50",
                            ].join(" ")}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        );
                      })}
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Department */}
          <FormField
            control={form.control}
            name="department"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-700">Department</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Optional" data-testid="input-department" />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Login credentials section */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-200">
            <div>
              <p className="text-sm font-semibold text-slate-800">Login credentials</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Set a temporary password for this employee. Share it with them so they can sign in with their email.
              </p>
            </div>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Set a password for this employee"
                        className="pr-10 bg-white"
                        data-testid="input-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                        data-testid="button-toggle-password"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Submit */}
          <div className="pt-2 pb-6">
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={isSubmitting}
              data-testid="button-create-employee"
            >
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Employee
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
