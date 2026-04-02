import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Settings, Loader2, ClipboardList, Package, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = { companyName: string; businessType: string | null; enabledModules: string[] | null };

const MODULE_OPTIONS = [
  { key: "field_service", label: "Field Service Operations", description: "Job dispatch, photo documentation, key tracking, Google Maps integration.", icon: ClipboardList, color: "text-blue-600" },
  { key: "product_costing", label: "Product Costing", description: "Ingredient management, recipe builder, and pricing calculator.", icon: Package, color: "text-purple-600" },
  { key: "finances", label: "Finances", description: "Revenue and expense tracking with monthly summaries.", icon: DollarSign, color: "text-green-600" },
  { key: "team", label: "Team Management", description: "Employee profiles, login accounts, and status management.", icon: Users, color: "text-orange-600" },
];

export default function BusinessSettings() {
  const { data: user } = useUser();
  const { toast } = useToast();
  const [modules, setModules] = useState<string[]>([]);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ["/api/employer/profile", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/employer/profile/${user?.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile?.enabledModules) setModules(profile.enabledModules);
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PATCH", "/api/business/modules", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employer/profile", user?.id] });
      toast({ title: "Settings saved" });
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  function toggleModule(key: string) {
    setModules(prev => prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]);
  }

  function handleSave() {
    saveMutation.mutate({ enabledModules: modules });
  }

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-slate-500" />
        <h1 className="text-xl font-bold text-slate-900" data-testid="heading-settings">Settings</h1>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : (
        <>
          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Business Info</h2>
            <Card>
              <CardContent className="p-4">
                <p className="font-semibold text-slate-900">{profile?.companyName ?? "Your Business"}</p>
                <p className="text-sm text-slate-500 mt-0.5 capitalize">{profile?.businessType?.replace("_", " ") ?? "General"}</p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Modules</h2>
            <p className="text-sm text-slate-500 mb-3">Enable or disable features for your business. Changes are reflected in the navigation immediately after saving.</p>
            <div className="space-y-3">
              {MODULE_OPTIONS.map(mod => {
                const Icon = mod.icon;
                const enabled = modules.includes(mod.key);
                return (
                  <Card key={mod.key} className={enabled ? "border-primary/30 bg-primary/5" : ""} data-testid={`module-card-${mod.key}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 ${mod.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Label htmlFor={`module-${mod.key}`} className="text-sm font-semibold text-slate-900 cursor-pointer">{mod.label}</Label>
                          <p className="text-xs text-slate-500 mt-0.5">{mod.description}</p>
                        </div>
                        <Switch
                          id={`module-${mod.key}`}
                          checked={enabled}
                          onCheckedChange={() => toggleModule(mod.key)}
                          data-testid={`toggle-module-${mod.key}`}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <Button className="w-full h-11" onClick={handleSave} disabled={saveMutation.isPending} data-testid="button-save-settings">
            {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </>
      )}
    </div>
  );
}
