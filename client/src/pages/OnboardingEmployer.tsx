import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertEmployerProfileSchema } from "@shared/schema";
import { useCreateEmployerProfile } from "@/hooks/use-onboarding";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Loader2, ClipboardList, Package, DollarSign, Users, CheckCircle2, ChevronLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { Country, State } from "country-state-city";

const INDUSTRIES = [
  "Home Care", "Trucking & Logistics", "Manufacturing", "Construction",
  "Healthcare", "Warehousing & Distribution", "Agriculture", "Food & Beverage",
  "Hospitality", "Cleaning & Janitorial", "Landscaping",
  "Personal Care & Beauty Services", "Automotive & Equipment Repair Services",
  "Retail", "Staffing & Recruiting", "Transportation", "Energy & Utilities", "Other",
];

const MODULES = [
  {
    key: "field_service",
    label: "Field Service",
    description: "Dispatch workers to job sites, track status, and collect photo documentation.",
    icon: ClipboardList,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    selectedBorder: "border-blue-500",
    selectedBg: "bg-blue-50",
  },
  {
    key: "product_costing",
    label: "Product Costing",
    description: "Build recipes, calculate per-unit costs, and set profitable selling prices.",
    icon: Package,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    selectedBorder: "border-purple-500",
    selectedBg: "bg-purple-50",
  },
  {
    key: "finances",
    label: "Finances",
    description: "Log revenue and expenses, track monthly summaries, and monitor profit.",
    icon: DollarSign,
    color: "text-green-600",
    bg: "bg-green-50",
    border: "border-green-200",
    selectedBorder: "border-green-500",
    selectedBg: "bg-green-50",
  },
  {
    key: "team",
    label: "Team Management",
    description: "Add employee accounts, manage active/inactive status, and control access.",
    icon: Users,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-200",
    selectedBorder: "border-orange-500",
    selectedBg: "bg-orange-50",
  },
];

export default function OnboardingEmployer() {
  const createProfileMutation = useCreateEmployerProfile();
  const [step, setStep] = useState<1 | 2>(1);
  const [savedFormData, setSavedFormData] = useState<any>(null);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [showCustomIndustry, setShowCustomIndustry] = useState(false);
  const [customIndustry, setCustomIndustry] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("");

  const allCountries = useMemo(() => Country.getAllCountries(), []);
  const statesForCountry = useMemo(() => {
    if (!selectedCountryCode) return [];
    return State.getStatesOfCountry(selectedCountryCode);
  }, [selectedCountryCode]);
  const hasStates = statesForCountry.length > 0;

  const form = useForm({
    resolver: zodResolver(insertEmployerProfileSchema.omit({ userId: true })),
    defaultValues: {
      companyName: "",
      industry: "",
      companySize: "",
      country: "",
      location: "",
    },
  });

  function handleStep1(data: any) {
    const finalData = {
      ...data,
      industry: showCustomIndustry && customIndustry.trim() ? customIndustry.trim() : data.industry,
    };
    setSavedFormData(finalData);
    setStep(2);
  }

  function toggleModule(key: string) {
    setSelectedModules(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  }

  function handleSubmit() {
    createProfileMutation.mutate({
      ...savedFormData,
      enabledModules: selectedModules,
    });
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          <div className={`h-2 rounded-full flex-1 transition-colors ${step >= 1 ? "bg-indigo-600" : "bg-slate-200"}`} />
          <div className={`h-2 rounded-full flex-1 transition-colors ${step >= 2 ? "bg-indigo-600" : "bg-slate-200"}`} />
        </div>

        {step === 1 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl font-display">Setup Your Company Profile</CardTitle>
              <CardDescription>Tell us about your business to get started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleStep1)} className="space-y-5">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Acme Logistics Inc." {...field} data-testid="input-company-name" />
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
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            setShowCustomIndustry(value === "Other");
                            if (value !== "Other") setCustomIndustry("");
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-industry">
                              <SelectValue placeholder="Select your industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INDUSTRIES.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {showCustomIndustry && (
                          <Input
                            placeholder="Please specify your industry"
                            value={customIndustry}
                            onChange={(e) => setCustomIndustry(e.target.value)}
                            className="mt-2"
                            data-testid="input-custom-industry"
                          />
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companySize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Size</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-company-size">
                              <SelectValue placeholder="Select company size" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1-10">1-10 employees</SelectItem>
                            <SelectItem value="11-50">11-50 employees</SelectItem>
                            <SelectItem value="51-200">51-200 employees</SelectItem>
                            <SelectItem value="201-500">201-500 employees</SelectItem>
                            <SelectItem value="500+">500+ employees</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <Select
                          onValueChange={(value) => {
                            field.onChange(value);
                            const countryObj = allCountries.find(c => c.name === value);
                            setSelectedCountryCode(countryObj?.isoCode || "");
                            form.setValue("location", "");
                          }}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-country">
                              <SelectValue placeholder="Select your country" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allCountries.map((c) => (
                              <SelectItem key={c.isoCode} value={c.name}>{c.name}</SelectItem>
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
                        <FormLabel>State / Province / Region</FormLabel>
                        {hasStates ? (
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-location">
                                <SelectValue placeholder="Select your state/province/region" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {statesForCountry.map((s) => (
                                <SelectItem key={s.isoCode} value={s.name}>{s.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <FormControl>
                            <Input
                              placeholder={selectedCountryCode ? "Enter your state/province/region" : "Select a country first"}
                              {...field}
                              data-testid="input-location"
                            />
                          </FormControl>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" data-testid="button-next-step">
                    Next: Choose Your Tools →
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="shadow-lg">
            <CardHeader>
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 mb-2 -mt-1"
                data-testid="button-back"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
              <CardTitle className="text-2xl font-display">Choose Your Tools</CardTitle>
              <CardDescription>
                Select the modules that fit your business. You can change these anytime in Settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {MODULES.map((mod) => {
                  const Icon = mod.icon;
                  const selected = selectedModules.includes(mod.key);
                  return (
                    <button
                      key={mod.key}
                      type="button"
                      onClick={() => toggleModule(mod.key)}
                      data-testid={`module-card-${mod.key}`}
                      className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                        selected
                          ? `${mod.selectedBorder} ${mod.selectedBg} shadow-sm`
                          : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${mod.bg} shrink-0`}>
                          <Icon className={`h-5 w-5 ${mod.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{mod.label}</p>
                            {selected && (
                              <CheckCircle2 className={`h-5 w-5 shrink-0 ${mod.color}`} />
                            )}
                          </div>
                          <p className="text-sm text-slate-500 mt-0.5">{mod.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedModules.length === 0 && (
                <p className="text-xs text-center text-slate-400">
                  Select at least one module to continue.
                </p>
              )}

              <Button
                className="w-full mt-2"
                onClick={handleSubmit}
                disabled={selectedModules.length === 0 || createProfileMutation.isPending}
                data-testid="button-complete-profile"
              >
                {createProfileMutation.isPending
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Setting up your account...</>
                  : "Launch My Dashboard"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
