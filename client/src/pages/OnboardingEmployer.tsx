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
import { useState, useMemo } from "react";
import { Country, State } from "country-state-city";

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
  "Personal Care & Beauty Services",
  "Automotive & Equipment Repair Services",
  "Retail",
  "Staffing & Recruiting",
  "Transportation",
  "Energy & Utilities",
  "Other",
];

export default function OnboardingEmployer() {
  const createProfileMutation = useCreateEmployerProfile();
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
      country: "",
      location: "",
    },
  });

  const onSubmit = (data: any) => {
    const finalData = {
      ...data,
      industry: showCustomIndustry && customIndustry.trim() ? customIndustry.trim() : data.industry,
    };
    createProfileMutation.mutate(finalData);
  };

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
                          <SelectItem key={industry} value={industry} data-testid={`option-industry-${industry.toLowerCase().replace(/\s+/g, '-')}`}>
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
                          <SelectItem key={c.isoCode} value={c.name}>
                            {c.name}
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
                    <FormLabel>State / Province / Region</FormLabel>
                    {hasStates ? (
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-location">
                            <SelectValue placeholder="Select your state/province/region" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {statesForCountry.map((s) => (
                            <SelectItem key={s.isoCode} value={s.name}>
                              {s.name}
                            </SelectItem>
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
              <Button type="submit" className="w-full" disabled={createProfileMutation.isPending} data-testid="button-complete-profile">
                {createProfileMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Complete Profile"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
