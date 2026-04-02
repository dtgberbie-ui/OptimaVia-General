import { useQuery } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-auth";
import { Link } from "wouter";
import { DollarSign, TrendingUp, TrendingDown, ClipboardList, Users, Package, FlaskConical, ChevronRight, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = { companyName: string; businessType: string | null; enabledModules: string[] | null };
type FinancialSummary = { totalRevenue: number; totalExpenses: number; netIncome: number };
type ServiceJob = {
  id: number; clientName: string; serviceAddress: string; scheduledDate: string;
  scheduledTime: string | null; status: string; priority: string;
  assignedEmployee: { name: string | null; username: string } | null;
};

function fmt(cents: number) { return `$${(cents / 100).toFixed(2)}`; }

function statusColor(s: string) {
  if (s === "completed") return "bg-green-100 text-green-700";
  if (s === "in_progress") return "bg-blue-100 text-blue-700";
  if (s === "assigned") return "bg-yellow-100 text-yellow-700";
  return "bg-slate-100 text-slate-600";
}

function statusLabel(s: string) {
  if (s === "in_progress") return "In Progress";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function EmployerDashboard() {
  const { data: user } = useUser();

  const { data: profile, isLoading: profileLoading } = useQuery<Profile>({
    queryKey: ["/api/employer/profile", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/employer/profile/${user?.id}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!user,
  });

  const { data: summary, isLoading: summaryLoading } = useQuery<FinancialSummary>({
    queryKey: ["/api/employer/financial-summary"],
  });

  const modules: string[] = profile?.enabledModules ?? [];
  const hasModule = (m: string) => modules.includes(m);
  const hasFieldService = hasModule("field_service");
  const hasProductCosting = hasModule("product_costing");
  const hasFinances = hasModule("finances");

  const { data: jobs, isLoading: jobsLoading } = useQuery<ServiceJob[]>({
    queryKey: ["/api/service-jobs"],
    enabled: hasFieldService,
  });

  const todayStr = new Date().toISOString().split("T")[0];
  const todayJobs = jobs?.filter(j => j.scheduledDate === todayStr) ?? [];
  const unassigned = jobs?.filter(j => j.status === "unassigned") ?? [];

  return (
    <div className="px-4 py-5 max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900" data-testid="heading-dashboard">
          {profileLoading ? <Skeleton className="h-7 w-40 inline-block" /> : (profile?.companyName ?? "Dashboard")}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Financial Cards */}
      {hasFinances && (
        <div className="grid grid-cols-3 gap-3">
          {summaryLoading ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)
          ) : (
            <>
              <Link href="/employer/finances">
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-0 bg-green-50" data-testid="card-revenue">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-[9px] text-green-600 font-medium uppercase tracking-wide">Revenue</span>
                    </div>
                    <p className="text-base font-bold text-green-700">{fmt(summary?.totalRevenue ?? 0)}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/employer/finances">
                <Card className="cursor-pointer hover:shadow-md transition-shadow border-0 bg-red-50" data-testid="card-expenses">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-[9px] text-red-600 font-medium uppercase tracking-wide">Expenses</span>
                    </div>
                    <p className="text-base font-bold text-red-700">{fmt(summary?.totalExpenses ?? 0)}</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/employer/finances">
                <Card className={`cursor-pointer hover:shadow-md transition-shadow border-0 ${(summary?.netIncome ?? 0) >= 0 ? "bg-blue-50" : "bg-orange-50"}`} data-testid="card-profit">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className={`h-3 w-3 ${(summary?.netIncome ?? 0) >= 0 ? "text-blue-600" : "text-orange-600"}`} />
                      <span className={`text-[9px] font-medium uppercase tracking-wide ${(summary?.netIncome ?? 0) >= 0 ? "text-blue-600" : "text-orange-600"}`}>Profit</span>
                    </div>
                    <p className={`text-base font-bold ${(summary?.netIncome ?? 0) >= 0 ? "text-blue-700" : "text-orange-700"}`}>{fmt(summary?.netIncome ?? 0)}</p>
                  </CardContent>
                </Card>
              </Link>
            </>
          )}
        </div>
      )}

      {/* Field Service: Today's Jobs */}
      {hasFieldService && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-700">Today's Jobs</h2>
            <Link href="/employer/service-jobs" className="text-xs text-primary font-medium flex items-center gap-0.5">
              See all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {jobsLoading ? (
            <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
          ) : todayJobs.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-6 text-center text-slate-400 text-sm">No jobs scheduled for today</CardContent></Card>
          ) : (
            <div className="space-y-2">
              {todayJobs.slice(0, 4).map(job => (
                <Link key={job.id} href={`/employer/service-jobs/${job.id}`}>
                  <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid={`job-card-${job.id}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-slate-900 truncate">{job.clientName}</p>
                          <p className="text-xs text-slate-500 truncate">{job.serviceAddress}</p>
                          {job.assignedEmployee && (
                            <p className="text-xs text-slate-400 mt-0.5">→ {job.assignedEmployee.name || job.assignedEmployee.username}</p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(job.status)}`}>{statusLabel(job.status)}</span>
                          {job.scheduledTime && <span className="text-xs text-slate-400">{job.scheduledTime}</span>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
          {unassigned.length > 0 && (
            <Link href="/employer/service-jobs">
              <div className="mt-2 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 cursor-pointer hover:bg-amber-100 transition-colors">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                <span className="text-sm text-amber-800">{unassigned.length} job{unassigned.length !== 1 ? "s" : ""} need assignment</span>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Product Costing */}
      {hasProductCosting && (
        <div>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Product Costing</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/employer/ingredients">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-ingredients">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-purple-100 rounded-lg p-2"><FlaskConical className="h-5 w-5 text-purple-600" /></div>
                  <div><p className="text-sm font-semibold">Ingredients</p><p className="text-xs text-slate-500">Manage costs</p></div>
                </CardContent>
              </Card>
            </Link>
            <Link href="/employer/products">
              <Card className="cursor-pointer hover:shadow-md transition-shadow" data-testid="card-products">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-2"><Package className="h-5 w-5 text-blue-600" /></div>
                  <div><p className="text-sm font-semibold">Products</p><p className="text-xs text-slate-500">Recipes & pricing</p></div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      )}

      {/* Fallback shortcuts */}
      {!hasFieldService && !hasProductCosting && (
        <div className="grid grid-cols-2 gap-3">
          <Link href="/employer/finances">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="bg-green-100 rounded-lg p-2"><DollarSign className="h-5 w-5 text-green-600" /></div>
                <div><p className="text-sm font-semibold">Finances</p><p className="text-xs text-slate-500">Track revenue</p></div>
              </CardContent>
            </Card>
          </Link>
          <Link href="/employer/team">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="bg-blue-100 rounded-lg p-2"><Users className="h-5 w-5 text-blue-600" /></div>
                <div><p className="text-sm font-semibold">Team</p><p className="text-xs text-slate-500">Manage staff</p></div>
              </CardContent>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
